import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

// POST /api/course-schedule/[id]/participant/certificate - Add a certificate for a participant
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { participantId, certificateNumber, issueDate, pdfUrl, driveLink } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
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

    // Check if certificate already exists for this participant and course
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        participant: {
          id: participantId
        },
        course: {
          id: classExists.courseId
        }
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
        }
      });

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
        participant: {
          connect: { id: participantId }
        },
        course: {
          connect: { id: classExists.courseId }
        },
        pdfUrl: pdfUrl || null,
        driveLink: driveLink || null
      }
    });

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

// GET /api/course-schedule/[id]/participant/certificate?participantId=XXX - Get certificate for a participant
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

    // Find registration
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

    // Find class to get courseId
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classData) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Find certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        participantId: participantId,
        courseId: classData.courseId
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found for this participant' },
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

// DELETE /api/course-schedule/[id]/participant/certificate?participantId=XXX - Delete certificate for a participant
export async function DELETE(request: Request, { params }: Params) {
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

    // Find registration
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

    // Find class to get courseId
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });
    
    if (!classData) {
      return NextResponse.json(
        { error: 'Course schedule not found' },
        { status: 404 }
      );
    }

    // Find certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        participantId: participantId,
        courseId: classData.courseId
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found for this participant' },
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