import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCertificateEmail } from '@/lib/email';

interface Params {
  params: {
    id: string;  // classId
  };
}

// POST /api/course-schedule/[id]/instructure/certificate/send-email - Send certificate email to instructor
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { instructureId } = await request.json();

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    console.log('Looking up instructor with ID:', instructureId);

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

    // Check if instructor is assigned to this class
    const instructorAssignment = await prisma.instructureClass.findFirst({
      where: {
        classId,
        instructureId
      }
    });

    if (!instructorAssignment) {
      return NextResponse.json(
        { error: 'Instructor is not assigned to this course' },
        { status: 404 }
      );
    }

    // Find certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        instructureId: instructureId,
        courseId: classExists.courseId
      },
      include: {
        instructure: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        },
        course: true
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found for this instructor' },
        { status: 404 }
      );
    }

    console.log('Certificate found:', {
      id: certificate.id,
      instructureName: certificate.instructure?.full_name,
      userCount: certificate.instructure?.user?.length || 0
    });

    // Check if instructor has email - handle the one-to-many relationship properly
    const instructorEmail = certificate.instructure?.user && certificate.instructure.user.length > 0 
      ? certificate.instructure.user[0].email 
      : null;

    if (!instructorEmail) {
      console.log('No email found for instructor:', {
        instructureId: certificate.instructureId,
        instructureName: certificate.instructure?.full_name,
        userCount: certificate.instructure?.user?.length || 0,
        users: certificate.instructure?.user?.map(u => ({ id: u.id, email: u.email, username: u.username }))
      });

      // Try to find user directly by instructureId
      const directUser = await prisma.user.findFirst({
        where: { instructureId: instructureId },
        select: { email: true, username: true }
      });

      if (directUser?.email) {
        console.log('Found email through direct user lookup:', directUser.email);
        // Use the email found through direct lookup
        const certificateLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/instructure/my-certificate`;
        const emailResult = await sendCertificateEmail(
          directUser.email,
          certificate.instructure?.full_name || 'Instructor',
          certificate.name || `${certificate.course?.course_name || 'Course'} Certificate`,
          certificate.course?.course_name || 'Unknown Course',
          certificate.certificateNumber,
          new Date(certificate.issueDate).toLocaleDateString('id-ID'),
          certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString('id-ID') : 'No expiry',
          certificateLink,
          certificate.driveLink || certificate.pdfUrl || undefined
        );

        if (emailResult?.success) {
          console.log('Certificate email sent successfully to:', directUser.email);
          return NextResponse.json({
            success: true,
            message: 'Certificate email sent successfully',
            email: directUser.email
          }, { status: 200 });
        } else {
          console.error('Failed to send certificate email:', emailResult?.error);
          return NextResponse.json({
            error: 'Failed to send certificate email',
            details: emailResult?.error
          }, { status: 500 });
        }
      }

      return NextResponse.json(
        { 
          error: 'Instructor does not have an email address',
          details: {
            instructureId: certificate.instructureId,
            instructureName: certificate.instructure?.full_name,
            userCount: certificate.instructure?.user?.length || 0,
            directUserEmail: directUser?.email || null
          }
        },
        { status: 400 }
      );
    }

    // Send email using the found email
    try {
      const certificateLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/instructure/my-certificate`;
      const emailResult = await sendCertificateEmail(
        instructorEmail,
        certificate.instructure?.full_name || 'Instructor',
        certificate.name || `${certificate.course?.course_name || 'Course'} Certificate`,
        certificate.course?.course_name || 'Unknown Course',
        certificate.certificateNumber,
        new Date(certificate.issueDate).toLocaleDateString('id-ID'),
        certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString('id-ID') : 'No expiry',
        certificateLink,
        certificate.driveLink || certificate.pdfUrl || undefined
      );

      if (emailResult?.success) {
        console.log('Certificate email sent successfully to:', instructorEmail);
        return NextResponse.json({
          success: true,
          message: 'Certificate email sent successfully',
          email: instructorEmail
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