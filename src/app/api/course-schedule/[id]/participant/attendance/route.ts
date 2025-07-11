import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Fungsi helper untuk menghitung jumlah kehadiran
async function updatePresentDayCount(registrationId: string) {
  // Hitung jumlah kehadiran dengan status "present"
  const presentCount = await prisma.attendance.count({
    where: { 
      registrationId: registrationId,
      status: "present" 
    }
  });
  
  // Update nilai present_day di courseRegistration
  await prisma.courseRegistration.update({
    where: { id: registrationId },
    data: { present_day: presentCount }
  });
  
  return presentCount;
}

// POST /api/course-schedule/[id]/participant/attendance
export async function POST(request, { params }) {
  try {
    const scheduleId = params.id;
    const body = await request.json();
    const { participantId, status, mode, date } = body;
    if (!participantId || !status || !mode) {
      return NextResponse.json({ error: "participantId, status, and mode are required" }, { status: 400 });
    }
    // Find registration
    const registration = await prisma.courseRegistration.findFirst({
      where: { classId: scheduleId, participantId }
    });
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    // Get user from session
    let createdBy = null;
    try {
      const session = await getServerSession(authOptions);
      createdBy = session?.user?.id || null;
    } catch {}
    // Create attendance
    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        status,
        mode,
        createdBy,
        date: date ? new Date(date) : undefined,
      }
    });
    
    // Update present_day count
    const presentCount = await updatePresentDayCount(registration.id);
    
    return NextResponse.json({
      id: attendance.id,
      registrationId: attendance.registrationId,
      status: attendance.status,
      mode: attendance.mode,
      date: attendance.date,
      createdBy: attendance.createdBy,
      presentCount: presentCount
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create attendance" }, { status: 500 });
  }
}

// GET /api/course-schedule/[id]/participant/attendance?participantId=xxx
export async function GET(request, { params }) {
  try {
    const scheduleId = params.id;
    const participantId = request.nextUrl.searchParams.get("participantId");
    if (!participantId) {
      return NextResponse.json({ error: "participantId is required" }, { status: 400 });
    }
    // Find registration
    const registration = await prisma.courseRegistration.findFirst({
      where: { classId: scheduleId, participantId }
    });
    if (!registration) {
      return NextResponse.json({ attendances: [] }, { status: 200 });
    }
    // Get attendance list
    const attendances = await prisma.attendance.findMany({
      where: { registrationId: registration.id },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json({ attendances }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: 500 });
  }
}

// PATCH /api/course-schedule/[id]/participant/attendance
export async function PATCH(request, { params }) {
  try {
    const scheduleId = params.id;
    const body = await request.json();
    const { attendanceId, status, mode, date } = body;
    if (!attendanceId) {
      return NextResponse.json({ error: "attendanceId is required" }, { status: 400 });
    }
    
    // Dapatkan attendance untuk mendapatkan registrationId
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });
    
    if (!attendance) {
      return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
    }
    
    // Update attendance
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        mode,
        date: date ? new Date(date) : undefined,
      },
    });
    
    // Update present_day count
    const presentCount = await updatePresentDayCount(attendance.registrationId);
    
    return NextResponse.json({ 
      attendance: updated,
      presentCount: presentCount
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update attendance" }, { status: 500 });
  }
}

// DELETE /api/course-schedule/[id]/participant/attendance
export async function DELETE(request, { params }) {
  try {
    const scheduleId = params.id;
    const body = await request.json();
    const { attendanceId } = body;
    if (!attendanceId) {
      return NextResponse.json({ error: "attendanceId is required" }, { status: 400 });
    }
    
    // Dapatkan attendance untuk mendapatkan registrationId sebelum dihapus
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });
    
    if (!attendance) {
      return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
    }
    
    const registrationId = attendance.registrationId;
    
    // Delete attendance
    await prisma.attendance.delete({ where: { id: attendanceId } });
    
    // Update present_day count
    const presentCount = await updatePresentDayCount(registrationId);
    
    return NextResponse.json({ 
      success: true,
      presentCount: presentCount
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete attendance" }, { status: 500 });
  }
} 