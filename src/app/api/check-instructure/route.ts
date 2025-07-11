import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple endpoint to check if an instructor exists in the database
export async function GET(request: NextRequest) {
  try {
    const instructureId = request.nextUrl.searchParams.get('id');
    const email = request.nextUrl.searchParams.get('email');
    
    if (!instructureId && !email) {
      return NextResponse.json({
        error: 'Either id or email parameter is required',
        example: '/api/check-instructure?id=instructor-id OR /api/check-instructure?email=email@example.com'
      }, { status: 400 });
    }
    
    // Prepare query conditions
    const whereCondition = instructureId 
      ? { id: instructureId } 
      : { email: email };
    
    // Check if instructor exists
    const instructor = await prisma.instructure.findFirst({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    if (!instructor) {
      return NextResponse.json({
        exists: false,
        instructureId: instructureId || null,
        email: email || null,
        message: 'Instructor not found'
      });
    }
    
    // Get certificate count
    const certificateCount = await prisma.certificate.count({
      where: { instructureId: instructor.id }
    });
    
    // Get class assignments
    const classAssignments = await prisma.instructureClass.count({
      where: { instructureId: instructor.id }
    });
    
    return NextResponse.json({
      exists: true,
      instructor: {
        id: instructor.id,
        name: instructor.full_name,
        email: instructor.email || instructor.user?.email,
        userId: instructor.userId
      },
      certificateCount,
      classAssignments,
      certificateLink: `/instructure/certificate?id=${instructor.id}`,
      checkCertificatesLink: `/api/check-instructor-certificates?id=${instructor.id}`
    });
    
  } catch (error) {
    console.error('Error checking instructor:', error);
    return NextResponse.json({
      error: 'Failed to check instructor',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 