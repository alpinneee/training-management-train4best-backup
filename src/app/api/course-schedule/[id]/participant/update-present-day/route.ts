import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;  // classId
  };
}

// POST /api/course-schedule/[id]/participant/update-present-day
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const body = await request.json();
    const { participantId, presentDay } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Find registration
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId,
        participantId
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Update present_day value
    const updatedRegistration = await prisma.courseRegistration.update({
      where: { id: registration.id },
      data: { present_day: presentDay }
    });

    return NextResponse.json({
      success: true,
      presentDay: updatedRegistration.present_day
    });
  } catch (error) {
    console.error('Error updating present day:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update present day: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update present day' },
      { status: 500 }
    );
  }
} 