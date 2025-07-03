import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;  // classId
  };
}

// POST /api/course-schedule/[id]/instructure - Add an instructor to a course schedule
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { instructureId } = await request.json();

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
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

    // Check if instructor exists
    const instructure = await prisma.instructure.findUnique({
      where: { id: instructureId }
    });

    if (!instructure) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.instructureClass.findFirst({
      where: {
        classId,
        instructureId
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Instructor is already assigned to this course' },
        { status: 409 }
      );
    }

    // Create assignment
    const assignment = await prisma.instructureClass.create({
      data: {
        id: `instr_class_${Date.now()}`,
        classId,
        instructureId
      },
      include: {
        instructure: {
          select: {
            full_name: true,
            phone_number: true,
            profiency: true,
            photo: true
          }
        }
      }
    });

    return NextResponse.json({
      id: assignment.id,
      instructureId: assignment.instructureId,
      name: assignment.instructure.full_name,
      phoneNumber: assignment.instructure.phone_number,
      profiency: assignment.instructure.profiency,
      photo: assignment.instructure.photo || '/default-avatar.png'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding instructor to course schedule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to add instructor: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add instructor' },
      { status: 500 }
    );
  }
}

// DELETE /api/course-schedule/[id]/instructure?assignmentId=XXX - Remove an instructor from a course schedule
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.instructureClass.findFirst({
      where: {
        id: assignmentId,
        classId
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Instructor assignment not found' },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.instructureClass.delete({
      where: {
        id: assignmentId
      }
    });

    return NextResponse.json(
      { message: 'Instructor removed from course successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing instructor from course schedule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to remove instructor: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to remove instructor' },
      { status: 500 }
    );
  }
} 