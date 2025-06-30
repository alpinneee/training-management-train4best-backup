import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/course - Redirects to /api/courses
export async function GET(request: Request) {
  try {
    console.log("Course API called, fetching courses directly...");
    
    // Get all courses without pagination for the certificate edit page
    const courses = await prisma.course.findMany({
      orderBy: {
        course_name: 'asc',
      },
      include: {
        courseType: {
          select: {
            id: true,
            course_type: true
          }
        }
      }
    });
    
    // Format response
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      course_name: course.course_name,
      description: course.description,
      image: course.image,
      courseTypeId: course.courseTypeId,
      courseType: course.courseType.course_type
    }));

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 