import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;  // classId
  };
}

// GET /api/course-schedule/[id]/participant/detail?participantId=XXX - Get participant details for a course
export async function GET(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: {
          select: {
            course_name: true,
            description: true
          }
        }
      }
    });

    if (!classInfo) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Get registration info
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId,
        participantId
      },
      include: {
        participant: {
          select: {
            id: true,
            full_name: true,
            phone_number: true,
            address: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          },
          take: 1,
          select: {
            amount: true,
            paymentMethod: true,
            paymentDate: true,
            paymentProof: true,
            status: true
          }
        }
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Participant registration not found' },
        { status: 404 }
      );
    }

    // Get certificate info
    const certificate = await prisma.certification.findFirst({
      where: {
        registrationId: registration.id
      },
      select: {
        certificate_number: true,
        issue_date: true,
        file_pdf: true
      }
    });

    // Get value reports
    const values = await prisma.valueReport.findMany({
      where: {
        registrationId: registration.id
      },
      select: {
        id: true,
        value_type: true,
        remark: true,
        value: true
      }
    });

    // Format the response
    const detailData = {
      personalInfo: {
        name: registration.participant.full_name,
        email: registration.participant.user?.email || '-',
        phone: registration.participant.phone_number,
        address: registration.participant.address
      },
      courseInfo: {
        presentDays: registration.present_day.toString(),
        totalDays: classInfo.duration_day.toString(),
        paymentStatus: registration.payment_status,
        regStatus: registration.reg_status,
        joinedDate: registration.reg_date.toISOString(),
        payment: registration.payments.length > 0 ? {
          amount: registration.payment,
          total: classInfo.price,
          method: registration.payments[0].paymentMethod,
          date: registration.payments[0].paymentDate?.toISOString(),
          verifiedStatus: registration.payments[0].status
        } : null
      }
      // Progress, certificate, dan test result dihapus sesuai permintaan
    };

    return NextResponse.json(detailData);
  } catch (error) {
    console.error('Error fetching participant details:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch participant details: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch participant details' },
      { status: 500 }
    );
  }
}
