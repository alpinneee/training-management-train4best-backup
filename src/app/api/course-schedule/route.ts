import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

// GET /api/course-schedule - Get all course schedules
export async function GET(request: Request) {
  try {
    console.log("API: Fetching course schedules...");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    console.log(`API: Query params - search: "${search}", page: ${page}, limit: ${limit}`);

    // Search in course name, location or room
    const where = search ? {
      OR: [
        { course: { course_name: { contains: search } } },
        { location: { contains: search } },
        { room: { contains: search } },
      ],
    } : {};

    // Get total count
    const total = await prisma.class.count({ where });
    console.log(`API: Found ${total} total schedules`);

    // Get schedules with pagination
    const schedules = await prisma.class.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        start_date: 'desc',
      },
      include: {
        course: {
          select: {
            course_name: true,
            courseType: {
              select: {
                course_type: true
              }
            }
          }
        }
      }
    });
    
    console.log(`API: Found ${schedules.length} schedules for current page`);
    
    // Format response
    const formattedSchedules = schedules.map((schedule, index) => ({
      no: skip + index + 1,
      id: schedule.id,
      className: schedule.course.course_name,
      date: `${formatDate(schedule.start_date)} - ${formatDate(schedule.end_date)}`,
      registrationDate: `${formatDate(schedule.start_reg_date)} - ${formatDate(schedule.end_reg_date)}`,
      location: schedule.location,
      room: schedule.room,
      price: schedule.price,
      quota: schedule.quota,
      status: schedule.status,
      courseType: schedule.course.courseType.course_type,
      courseId: schedule.courseId,
    }));

    return NextResponse.json({
      data: formattedSchedules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching course schedules:', error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: 'Failed to fetch course schedules', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/course-schedule - Create a new course schedule
export async function POST(request: Request) {
  try {
    console.log("API: Creating new course schedule...");
    
    const { 
      courseId,
      quota,
      price,
      status,
      startRegDate,
      endRegDate,
      durationDay,
      startDate,
      endDate,
      location,
      room
    } = await request.json();
    
    console.log("API: Received data:", {
      courseId, quota, price, status, 
      startRegDate, endRegDate, durationDay,
      startDate, endDate, location, room
    });

    // Validate required fields
    if (!courseId || !quota || !price || !status || !startRegDate || 
        !endRegDate || !durationDay || !startDate || !endDate || 
        !location || !room) {
      console.log("API: Validation failed - missing required fields");
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if course exists
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!courseExists) {
      console.log(`API: Course with ID ${courseId} not found`);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Create new course schedule
    console.log("API: Creating new schedule in database");
    const newSchedule = await prisma.class.create({
      data: {
        id: `class_${Date.now()}`,
        courseId,
        quota: Number(quota),
        price: Number(price),
        status,
        start_reg_date: new Date(startRegDate),
        end_reg_date: new Date(endRegDate),
        duration_day: Number(durationDay),
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        location,
        room
      },
      include: {
        course: {
          select: {
            course_name: true,
            courseType: {
              select: {
                course_type: true
              }
            }
          }
        }
      }
    });
    
    console.log(`API: Successfully created schedule with ID: ${newSchedule.id}`);

    return NextResponse.json({
      id: newSchedule.id,
      className: newSchedule.course.course_name,
      date: `${formatDate(newSchedule.start_date)} - ${formatDate(newSchedule.end_date)}`,
      registrationDate: `${formatDate(newSchedule.start_reg_date)} - ${formatDate(newSchedule.end_reg_date)}`,
      location: newSchedule.location,
      room: newSchedule.room,
      price: newSchedule.price,
      quota: newSchedule.quota,
      status: newSchedule.status,
      courseType: newSchedule.course.courseType.course_type,
      courseId: newSchedule.courseId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course schedule:', error);
    if (error instanceof Error) {
      console.error(`API Error details: ${error.message}`);
      console.error(`API Error stack: ${error.stack}`);
      return NextResponse.json(
        { error: `Failed to create course schedule: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create course schedule' },
      { status: 500 }
    );
  }
}

// Helper function to format dates
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
} 