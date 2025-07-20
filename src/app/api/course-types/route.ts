import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

// GET /api/course-types - Get all course types
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Search in course type name
    const where = search ? {
      course_type: { contains: search }
    } : {};
    
    const courseTypes = await prisma.courseType.findMany({
      where,
      orderBy: {
        course_type: 'asc',
      }
    });
    
    // Format response
    const formattedTypes = courseTypes.map((type) => ({
      id: type.id,
      course_type: type.course_type
    }));

    return NextResponse.json(formattedTypes);
  } catch (error) {
    console.error('Error fetching course types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course types', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/course-types - Create a new course type
export async function POST(request: Request) {
  try {
    const { course_type } = await request.json();

    // Validate required fields
    if (!course_type) {
      return NextResponse.json(
        { error: 'Course type name is required' },
        { status: 400 }
      );
    }

    // Check if course type with same name already exists - using manual case-insensitive check
    const existingTypes = await prisma.courseType.findMany();
    
    const courseTypeExists = existingTypes.some(
      type => type.course_type.toLowerCase() === course_type.toLowerCase()
    );

    if (courseTypeExists) {
      return NextResponse.json(
        { error: 'Course type with this name already exists' },
        { status: 409 }
      );
    }

    // Create new course type
    const newCourseType = await prisma.courseType.create({
      data: {
        id: `ctype_${Date.now()}`,
        course_type
      }
    });

    return NextResponse.json({
      id: newCourseType.id,
      course_type: newCourseType.course_type
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course type:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create course type: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create course type' },
      { status: 500 }
    );
  }
} 