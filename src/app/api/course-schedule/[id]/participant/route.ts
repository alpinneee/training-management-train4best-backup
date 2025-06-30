import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;  // classId
  };
}

// POST /api/course-schedule/[id]/participant - Add a participant to a course schedule
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: participantId }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Check if registration already exists
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        classId,
        participantId
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Participant is already registered for this course' },
        { status: 409 }
      );
    }

    // Create registration
    const registration = await prisma.courseRegistration.create({
      data: {
        id: `reg_${Date.now()}`,
        classId,
        participantId,
        reg_date: new Date(),
        reg_status: 'Registered',
        payment: 0, // Initial payment is 0
        payment_status: 'Unpaid',
        present_day: 0 // Initial present days is 0
      },
      include: {
        participant: {
          select: {
            full_name: true,
            phone_number: true
          }
        }
      }
    });

    return NextResponse.json({
      id: registration.id,
      participantId: registration.participantId,
      name: registration.participant.full_name,
      presentDay: `${registration.present_day} days`,
      paymentStatus: registration.payment_status,
      regDate: registration.reg_date,
      regStatus: registration.reg_status
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding participant to course schedule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to add participant: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}

// DELETE /api/course-schedule/[id]/participant?registrationId=XXX - Remove a participant from a course schedule
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');

    console.log(`DELETE request received - classId: ${classId}, registrationId: ${registrationId}`);

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if the registration exists
    console.log(`Looking for registration with id: ${registrationId}`);
    
    const registration = await prisma.courseRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      console.log(`Registration not found with id: ${registrationId}`);
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    console.log(`Registration found with id: ${registration.id}, preparing to delete related records`);

    // Gunakan Prisma client standar untuk menghapus data
    await prisma.$transaction(async (tx) => {
      // 1. Hapus payments
      console.log('Deleting payments...');
      await tx.payment.deleteMany({
        where: { registrationId: registration.id }
      });
      
      // 2. Hapus value reports
      console.log('Deleting value reports...');
      await tx.valueReport.deleteMany({
        where: { registrationId: registration.id }
      });
      
      // 3. Hapus certifications
      console.log('Deleting certifications...');
      await tx.certification.deleteMany({
        where: { registrationId: registration.id }
      });

      // 4. Hapus registrasi
      console.log('Deleting course registration...');
      await tx.courseRegistration.delete({
        where: { id: registration.id }
      });
    });

    console.log(`Successfully removed participant from course`);
    return NextResponse.json({
      message: 'Participant removed from course successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error removing participant from course:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to remove participant: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
} 