import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Fetch courses with their images
    const courses = await prisma.course.findMany({
      include: {
        courseType: true
      }
    });

    // Fetch classes with course info
    const classes = await prisma.class.findMany({
      take: 5,
      include: {
        course: {
          include: {
            courseType: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      courses: courses.map(course => ({
        id: course.id,
        name: course.course_name,
        type: course.courseType?.course_type,
        image: course.image,
        description: course.description
      })),
      classes: classes.map(classItem => ({
        id: classItem.id,
        location: classItem.location,
        course: {
          name: classItem.course.course_name,
          type: classItem.course.courseType?.course_type,
          image: classItem.course.image
        }
      }))
    });
    
  } catch (error) {
    console.error('Error fetching debug data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch debug data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 