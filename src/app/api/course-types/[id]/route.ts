import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/course-types/[id] - Get a single course type by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    const courseType = await prisma.courseType.findUnique({
      where: { id }
    });

    if (!courseType) {
      return NextResponse.json(
        { error: 'Course type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: courseType.id,
      course_type: courseType.course_type
    });
  } catch (error) {
    console.error('Error fetching course type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course type', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/course-types/[id] - Update a course type
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { course_type } = await request.json();
    
    // Validate required fields
    if (!course_type) {
      return NextResponse.json(
        { error: 'Course type name is required' },
        { status: 400 }
      );
    }
    
    // Check if course type exists
    const existingCourseType = await prisma.courseType.findUnique({
      where: { id }
    });

    if (!existingCourseType) {
      return NextResponse.json(
        { error: 'Course type not found' },
        { status: 404 }
      );
    }

    // Check if another course type with the same name exists
    const allCourseTypes = await prisma.courseType.findMany({
      where: {
        id: { not: id }
      }
    });

    // Manual case-insensitive check
    const duplicateExists = allCourseTypes.some(
      type => type.course_type.toLowerCase() === course_type.toLowerCase()
    );

    if (duplicateExists) {
      return NextResponse.json(
        { error: 'Another course type with this name already exists' },
        { status: 409 }
      );
    }

    // Update course type
    const updatedCourseType = await prisma.courseType.update({
      where: { id },
      data: {
        course_type
      }
    });

    return NextResponse.json({
      id: updatedCourseType.id,
      course_type: updatedCourseType.course_type
    });
  } catch (error) {
    console.error('Error updating course type:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update course type: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update course type' },
      { status: 500 }
    );
  }
}

// DELETE /api/course-types/[id] - Delete a course type
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    // Check if course type exists
    const existingCourseType = await prisma.courseType.findUnique({
      where: { id },
      include: {
        course: {
          take: 1, // Just need to check if any exist
        }
      }
    });

    if (!existingCourseType) {
      return NextResponse.json(
        { error: 'Course type not found' },
        { status: 404 }
      );
    }

    // Check if there are courses using this course type and not force delete
    if (!force && existingCourseType.course.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete course type that is being used by courses', 
          hint: 'Add ?force=true to URL to force deletion of the course type and all related courses' 
        },
        { status: 400 }
      );
    }

    // Delete in transaction if force delete
    if (force && existingCourseType.course.length > 0) {
      await prisma.$transaction(async (prisma) => {
        // Delete all related courses first
        await prisma.course.deleteMany({
          where: { courseTypeId: id }
        });

        // Then delete the course type
        await prisma.courseType.delete({
          where: { id }
        });
      });
    } else {
      // Simple delete if no related records
      await prisma.courseType.delete({
        where: { id }
      });
    }

    return NextResponse.json(
      { message: 'Course type deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course type:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete course type: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete course type' },
      { status: 500 }
    );
  }
} 