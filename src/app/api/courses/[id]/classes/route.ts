import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/courses/[id]/classes - Get classes for a specific course
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Build filter conditions
    const where: any = { courseId: id };
    
    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Query for classes
    const classes = await prisma.class.findMany({
      where,
      orderBy: [
        { start_date: 'asc' },
        { price: 'asc' }
      ]
    });

    // For each class, calculate remaining quota
    const classesWithQuota = await Promise.all(
      classes.map(async (classItem) => {
        const registrations = await prisma.courseRegistration.count({
          where: { classId: classItem.id }
        });
        
        const remainingQuota = classItem.quota - registrations;
        
        return {
          ...classItem,
          remainingQuota
        };
      })
    );

    return NextResponse.json({
      data: classesWithQuota
    });
    
  } catch (error) {
    console.error("Error fetching classes:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch classes", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 