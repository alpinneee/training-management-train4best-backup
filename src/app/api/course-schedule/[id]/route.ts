import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/course-schedule/[id] - Get a single course schedule by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    console.log(`API: Fetching course schedule with ID: ${id}`);

    const schedule = await prisma.class.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            course_name: true,
            description: true,
            image: true,
            courseType: {
              select: {
                id: true,
                course_type: true
              }
            }
          }
        },
        courseregistration: {
          include: {
            participant: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                company: true
              }
            }
          }
        },
        instructureclass: {
          include: {
            instructure: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                profiency: true,
                photo: true
              }
            }
          }
        }
      }
    });

    if (!schedule) {
      console.log(`API: Course schedule with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    console.log(`API: Successfully retrieved course schedule ${id}`);

    // Format the schedule data
    const formattedSchedule = {
      id: schedule.id,
      className: schedule.course.course_name,
      courseId: schedule.courseId,
      courseDescription: schedule.course.description || '',
      courseImage: schedule.course.image || '/default-course.jpg',
      date: `${formatDate(schedule.start_date)} - ${formatDate(schedule.end_date)}`,
      registrationDate: `${formatDate(schedule.start_reg_date)} - ${formatDate(schedule.end_reg_date)}`,
      location: schedule.location,
      room: schedule.room,
      price: schedule.price,
      status: schedule.status,
      quota: schedule.quota,
      durationDay: schedule.duration_day,
      // Format raw dates for edit forms
      startDate: schedule.start_date,
      endDate: schedule.end_date,
      startRegDate: schedule.start_reg_date,
      endRegDate: schedule.end_reg_date,
      // Related data
      courseType: schedule.course.courseType.course_type,
      courseTypeId: schedule.course.courseType.id,
      participants: schedule.courseregistration.map(reg => ({
        id: reg.id,
        participantId: reg.participantId,
        name: reg.participant.full_name,
        presentDay: `${reg.present_day} days`,
        paymentStatus: reg.payment_status,
        paymentMethod: reg.payment_method || '-',
        paymentAmount: reg.payment,
        regDate: formatDate(reg.reg_date),
        regStatus: reg.reg_status,
      })),
      instructures: schedule.instructureclass.map(ic => ({
        id: ic.id,
        instructureId: ic.instructureId,
        name: ic.instructure.full_name,
        phoneNumber: ic.instructure.phone_number,
        profiency: ic.instructure.profiency,
        photo: ic.instructure.photo || '/default-avatar.png'
      }))
    };

    return NextResponse.json(formattedSchedule);
  } catch (error) {
    console.error('Error fetching course schedule:', error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: 'Failed to fetch course schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/course-schedule/[id] - Update a course schedule
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
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
    
    console.log(`API: Updating course schedule with ID: ${id}`);

    // Check if schedule exists
    const existingSchedule = await prisma.class.findUnique({
      where: { id }
    });

    if (!existingSchedule) {
      console.log(`API: Course schedule with ID ${id} not found for update`);
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Update schedule
    const updatedSchedule = await prisma.class.update({
      where: { id },
      data: {
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

    console.log(`API: Successfully updated course schedule ${id}`);

    return NextResponse.json({
      id: updatedSchedule.id,
      className: updatedSchedule.course.course_name,
      date: `${formatDate(updatedSchedule.start_date)} - ${formatDate(updatedSchedule.end_date)}`,
      registrationDate: `${formatDate(updatedSchedule.start_reg_date)} - ${formatDate(updatedSchedule.end_reg_date)}`,
      location: updatedSchedule.location,
      room: updatedSchedule.room,
      price: updatedSchedule.price,
      quota: updatedSchedule.quota,
      status: updatedSchedule.status,
      courseType: updatedSchedule.course.courseType.course_type,
      courseId: updatedSchedule.courseId,
    });
  } catch (error) {
    console.error('Error updating course schedule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update course schedule: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update course schedule' },
      { status: 500 }
    );
  }
}

// DELETE /api/course-schedule/[id] - Delete a course schedule
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    console.log(`API: Attempting to delete course schedule with ID: ${id}, force: ${force}`);
    
    // Check if schedule exists
    const existingSchedule = await prisma.class.findUnique({
      where: { id },
      include: {
        courseregistration: {
          take: 1, // Just need to check if any exist
        },
        instructureclass: {
          take: 1, // Just need to check if any exist
        }
      }
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    console.log(`API: Found course schedule: ${existingSchedule.id}`);

    // Check relations if not force delete
    if (!force && (existingSchedule.courseregistration.length > 0 || existingSchedule.instructureclass.length > 0)) {
      return NextResponse.json(
        { 
          error: 'Cannot delete course schedule that has registrations or instructors', 
          hint: 'Add ?force=true to URL to force deletion' 
        },
        { status: 400 }
      );
    }

    // Delete in transaction
    await prisma.$transaction(async (prisma) => {
      // Delete registrations if force delete
      if (force && existingSchedule.courseregistration.length > 0) {
        await prisma.courseRegistration.deleteMany({
          where: { classId: id }
        });
      }

      // Delete instructor assignments if force delete
      if (force && existingSchedule.instructureclass.length > 0) {
        await prisma.instructureClass.deleteMany({
          where: { classId: id }
        });
      }

      // Delete course schedule
      await prisma.class.delete({
        where: { id }
      });
    });

    return NextResponse.json(
      { message: 'Course schedule deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course schedule:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete course schedule: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete course schedule' },
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