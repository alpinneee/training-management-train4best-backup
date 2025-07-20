import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

// Define interfaces for history detail types
interface RegistrationDetails {
  fullName: string;
  proficiency: string;
}

interface ClassAssignmentDetails {
  courseId?: string;
  courseName?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
}

interface ValueReportDetails {
  value?: number;
  valueType?: string;
  remark?: string;
  participantName?: string;
  courseName?: string;
}

// GET /api/instructure/[id]/history - Get instructor history
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    // Check if instructor exists
    const instructor = await prisma.instructure.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Get user creation date from the user table
    const user = instructor.user[0]; // Get the first associated user
    const creationDate = user?.last_login || new Date(); // Use last_login as fallback

    // For a real application, you would have a dedicated history/audit table
    // For now, we'll create a simulated history based on available data
    const history: any[] = [
      {
        id: '1',
        type: 'Registration',
        description: 'New instructor added',
        date: creationDate,
        changedBy: 'Admin',
        details: {
          fullName: instructor.full_name,
          proficiency: instructor.profiency
        }
      }
    ];

    // Add classes taught by this instructor as history items
    const instructureClasses = await prisma.instructureClass.findMany({
      where: {
        instructureId: id
      },
      include: {
        class: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Add class assignments to history
    instructureClasses.forEach(instructureClass => {
      const details: any = {
        courseName: instructureClass.class.course.course_name,
        startDate: instructureClass.class.start_date,
        endDate: instructureClass.class.end_date,
        location: instructureClass.class.location
      };
      
      if (instructureClass.class.courseId) {
        details.courseId = instructureClass.class.courseId;
      }
      
      history.push({
        id: `class-${instructureClass.id}`,
        type: 'Class Assignment',
        description: `Assigned to class: ${instructureClass.class.course.course_name}`,
        date: instructureClass.class.start_date,
        changedBy: 'System',
        details
      });
    });

    // Get value reports submitted by this instructor
    const valueReports = await prisma.valueReport.findMany({
      where: {
        instructureId: id
      },
      include: {
        courseregistration: {
          include: {
            participant: true,
            class: {
              include: {
                course: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Add value reports to history
    valueReports.forEach(report => {
      const participantName = report.courseregistration.participant.full_name;
      const courseName = report.courseregistration.class.course.course_name;
      
      history.push({
        id: `report-${report.id}`,
        type: 'Value Report',
        description: `Submitted report for ${participantName} in ${courseName}`,
        date: new Date(), // No date in the schema, using current date as fallback
        changedBy: instructor.full_name,
        details: {
          value: report.value,
          valueType: report.value_type,
          remark: report.remark,
          participantName: participantName,
          courseName: courseName
        }
      });
    });

    // Sort history by date (newest first)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching instructor history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructor history' },
      { status: 500 }
    );
  }
} 