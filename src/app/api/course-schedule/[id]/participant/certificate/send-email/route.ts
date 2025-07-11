import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendParticipantCertificateEmail } from '@/lib/email';

interface Params {
  params: {
    id: string;  // classId
  };
}

// POST /api/course-schedule/[id]/participant/certificate/send-email - Send certificate email to participant
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { participantId } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: true
      }
    });

    if (!classExists) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Check if registration exists
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        classId,
        participantId
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Participant is not registered for this course' },
        { status: 404 }
      );
    }

    // Find certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        participantId: participantId,
        courseId: classExists.courseId
      },
      include: {
        participant: {
          include: {
            user: true
          }
        },
        course: true
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found for this participant' },
        { status: 404 }
      );
    }

    // Check if participant has email
    if (!certificate.participant?.user?.email) {
      return NextResponse.json(
        { error: 'Participant does not have an email address' },
        { status: 400 }
      );
    }

    // Send email
    try {
      const certificateLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/participant/my-certificate`;
      const emailResult = await sendParticipantCertificateEmail(
        certificate.participant.user.email,
        certificate.participant.full_name,
        certificate.course?.course_name || 'Unknown Course',
        certificate.certificateNumber,
        new Date(certificate.issueDate).toLocaleDateString('id-ID'),
        certificateLink,
        certificate.driveLink || certificate.pdfUrl || undefined
      );

      if (emailResult?.success) {
        console.log('Certificate email sent successfully to:', certificate.participant.user.email);
        return NextResponse.json({
          success: true,
          message: 'Certificate email sent successfully',
          email: certificate.participant.user.email
        }, { status: 200 });
      } else {
        console.error('Failed to send certificate email:', emailResult?.error);
        return NextResponse.json({
          error: 'Failed to send certificate email',
          details: emailResult?.error
        }, { status: 500 });
      }
    } catch (emailError) {
      console.error('Error sending certificate email:', emailError);
      return NextResponse.json({
        error: 'Error sending certificate email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send certificate email:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to send certificate email: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send certificate email' },
      { status: 500 }
    );
  }
} 