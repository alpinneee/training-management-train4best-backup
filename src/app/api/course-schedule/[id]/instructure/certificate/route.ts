import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCertificateEmail } from '@/lib/email';

interface Params {
  params: {
    id: string;  // classId
  };
}

// Function to generate unique certificate number
async function generateUniqueCertificateNumber(): Promise<string> {
  // Generate random 10-digit number
  const randomNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  
  // Check if it already exists
  const existingCert = await prisma.certificate.findUnique({
    where: { certificateNumber: randomNum }
  });
  
  // If exists, recursively try again
  if (existingCert) {
    return generateUniqueCertificateNumber();
  }
  
  return randomNum;
}

// Helper function to get instructor email
async function getInstructorEmail(instructureId: string): Promise<string | null> {
  // First try to get email through the certificate's instructure relation
  const certificate = await prisma.certificate.findFirst({
    where: { instructureId },
    include: {
      instructure: {
        include: {
          user: {
            select: { email: true }
          }
        }
      }
    }
  });

  if (certificate?.instructure?.user && certificate.instructure.user.length > 0) {
    return certificate.instructure.user[0].email;
  }

  // If not found, try direct user lookup
  const directUser = await prisma.user.findFirst({
    where: { instructureId },
    select: { email: true }
  });

  return directUser?.email || null;
}

// POST /api/course-schedule/[id]/instructure/certificate - Add a certificate for an instructor
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { instructureId, certificateNumber, issueDate, pdfUrl, driveLink } = await request.json();

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Check if instructor is assigned to this class using InstructureClass model
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

    // Check if certificate already exists for this instructor and course
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        instructureId,
        courseId: classExists.courseId
      }
    });

    if (existingCertificate) {
      // Update existing certificate
      const updatedCertificate = await prisma.certificate.update({
        where: {
          id: existingCertificate.id
        },
        data: {
          certificateNumber: certificateNumber || existingCertificate.certificateNumber,
          issueDate: issueDate ? new Date(issueDate) : existingCertificate.issueDate,
          // Use current date + 1 year for expiryDate if not set
          expiryDate: existingCertificate.expiryDate,
          pdfUrl: pdfUrl || existingCertificate.pdfUrl,
          driveLink: driveLink || existingCertificate.driveLink
        },
        include: {
          instructure: {
            include: {
              user: {
                select: { email: true }
              }
            }
          },
          course: true
        }
      });

      // Get instructor email and send notification
      const instructorEmail = await getInstructorEmail(instructureId);
      if (instructorEmail) {
        try {
          const certificateLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/instructure/my-certificate`;
          await sendCertificateEmail(
            instructorEmail,
            updatedCertificate.instructure?.full_name || 'Instructor',
            updatedCertificate.name || `${updatedCertificate.course?.course_name || 'Course'} Certificate`,
            updatedCertificate.course?.course_name || 'Unknown Course',
            updatedCertificate.certificateNumber,
            new Date(updatedCertificate.issueDate).toLocaleDateString('id-ID'),
            updatedCertificate.expiryDate ? new Date(updatedCertificate.expiryDate).toLocaleDateString('id-ID') : 'No expiry',
            certificateLink,
            updatedCertificate.driveLink || updatedCertificate.pdfUrl
          );
          console.log('Certificate update email sent successfully to:', instructorEmail);
        } catch (emailError) {
          console.error('Error sending certificate update email:', emailError);
        }
      } else {
        console.log('No email found for instructor:', instructureId);
      }

      return NextResponse.json({
        id: updatedCertificate.id,
        certificateNumber: updatedCertificate.certificateNumber,
        issueDate: updatedCertificate.issueDate,
        expiryDate: updatedCertificate.expiryDate,
        pdfUrl: updatedCertificate.pdfUrl,
        driveLink: updatedCertificate.driveLink,
        message: 'Certificate updated successfully'
      }, { status: 200 });
    }

    // Create new certificate
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Default expiry is 1 year
    
    // Generate unique certificate number if not provided
    const uniqueCertNumber = certificateNumber || await generateUniqueCertificateNumber();
    
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber: uniqueCertNumber,
        name: `${classExists.courseId} Certificate`,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate,
        status: "Valid",
        instructure: {
          connect: { id: instructureId }
        },
        course: {
          connect: { id: classExists.courseId }
        },
        pdfUrl: pdfUrl || null,
        driveLink: driveLink || null
      },
      include: {
        instructure: {
          include: {
            user: {
              select: { email: true }
            }
          }
        },
        course: true
      }
    });

    // Get instructor email and send notification
    const instructorEmail = await getInstructorEmail(instructureId);
    if (instructorEmail) {
      try {
        const certificateLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/instructure/my-certificate`;
        await sendCertificateEmail(
          instructorEmail,
          certificate.instructure?.full_name || 'Instructor',
          certificate.name || `${certificate.course?.course_name || 'Course'} Certificate`,
          certificate.course?.course_name || 'Unknown Course',
          certificate.certificateNumber,
          new Date(certificate.issueDate).toLocaleDateString('id-ID'),
          certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString('id-ID') : 'No expiry',
          certificateLink,
          certificate.driveLink || certificate.pdfUrl
        );
        console.log('Certificate creation email sent successfully to:', instructorEmail);
      } catch (emailError) {
        console.error('Error sending certificate creation email:', emailError);
      }
    } else {
      console.log('No email found for instructor:', instructureId);
    }

    return NextResponse.json({
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      pdfUrl: certificate.pdfUrl,
      driveLink: certificate.driveLink,
      message: 'Certificate created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to add certificate: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add certificate' },
      { status: 500 }
    );
  }
}

// GET /api/course-schedule/[id]/instructure/certificate?instructureId=XXX - Get certificate for an instructor
export async function GET(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const instructureId = searchParams.get('instructureId');

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructor ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classData) {
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
        courseId: classData.courseId
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found for this instructor' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      pdfUrl: certificate.pdfUrl,
      driveLink: certificate.driveLink
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to fetch certificate: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}

// DELETE /api/course-schedule/[id]/instructure/certificate?instructureId=XXX - Delete certificate for an instructor
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const instructureId = searchParams.get('instructureId');

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructor ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classData) {
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
        courseId: classData.courseId
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found for this instructor' },
        { status: 404 }
      );
    }

    // Delete certificate
    await prisma.certificate.delete({
      where: {
        id: certificate.id
      }
    });

    return NextResponse.json(
      { message: 'Certificate deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete certificate: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete certificate' },
      { status: 500 }
    );
  }
}
