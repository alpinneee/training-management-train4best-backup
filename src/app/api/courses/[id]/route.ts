import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";
interface Params {
  params: {
    id: string;
  };
}

// GET /api/courses/[id] - Get a single course by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        courseType: {
          select: {
            id: true,
            course_type: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: course.id,
      course_name: course.course_name,
      courseTypeId: course.courseTypeId,
      courseType: course.courseType.course_type,
      description: course.description,
      image: course.image
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a course
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const { course_name, courseTypeId, description, image } = body;
    
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided
    if (course_name !== undefined) updateData.course_name = course_name;
    if (courseTypeId !== undefined) updateData.courseTypeId = courseTypeId;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        courseType: {
          select: {
            course_type: true
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedCourse.id,
      course_name: updatedCourse.course_name,
      courseTypeId: updatedCourse.courseTypeId,
      courseType: updatedCourse.courseType.course_type,
      description: updatedCourse.description,
      image: updatedCourse.image
    });
  } catch (error) {
    console.error('Error updating course:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update course: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete a course
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        class: {
          take: 1, // Just need to check if any exist
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if there are classes using this course and not force delete
    if (!force && existingCourse.class.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete course that has scheduled classes', 
          hint: 'Add ?force=true to URL to force deletion' 
        },
        { status: 400 }
      );
    }

    // Delete in transaction if force delete
    if (force && existingCourse.class.length > 0) {
      await prisma.$transaction(async (prisma) => {
        // Delete all related classes first
        await prisma.class.deleteMany({
          where: { courseId: id }
        });

        // Then delete the course
        await prisma.course.delete({
          where: { id }
        });
      });
    } else {
      // Simple delete if no related records
      await prisma.course.delete({
        where: { id }
      });
    }

    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete course: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
} 