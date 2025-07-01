import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
interface Params {
  params: {
    id: string; // classId
  };
}

// POST /api/course-schedule/[id]/instructure/certificate - Add a certificate for an instructure
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { instructureId, certificateNumber, issueDate, pdfUrl, driveLink } = await request.json();

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructure ID is required' },
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

    // Check if instructure is assigned to this class
    const instructureClass = await prisma.instructureClass.findFirst({
      where: {
        classId,
        instructureId
      },
      include: {
        instructure: true
      }
    });
    if (!instructureClass) {
      return NextResponse.json(
        { error: 'Instructure is not assigned to this course' },
        { status: 404 }
      );
    }

    // Check if certificate already exists for this instructure and course
    const existingCertificate = await prisma.certificate.findFirst({ 
      where: {
        instructureId: instructureId,
        courseId: classExists.courseId,
      }
    });

    if (existingCertificate) {
      // Update existing certificate
      const updatedCertificate = await prisma.certificate.update({
        where: { id: existingCertificate.id },
        data: {
          certificateNumber: certificateNumber || existingCertificate.certificateNumber,
          issueDate: issueDate ? new Date(issueDate) : existingCertificate.issueDate,
          pdfUrl: pdfUrl || existingCertificate.pdfUrl,
          driveLink: driveLink || existingCertificate.driveLink
        }
      });
      return NextResponse.json({
        id: updatedCertificate.id,
        certificateNumber: updatedCertificate.certificateNumber,
        issueDate: updatedCertificate.issueDate,
        pdfUrl: updatedCertificate.pdfUrl,
        driveLink: updatedCertificate.driveLink,
        message: 'Certificate updated successfully'
      }, { status: 200 });
    }

    // Create new certificate
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Default expiry is 1 year
    
    // Generate unique certificate number if not provided
    const uniqueCertNumber = certificateNumber || `INST/${classExists.course.course_name.substring(0, 3).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Get instructor name
    const instructureName = instructureClass.instructure.full_name;
    
    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber: uniqueCertNumber,
        name: `${instructureName} - ${classExists.course.course_name} Instructor Certificate`,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate,
        status: "Valid",
        instructureId: instructureId,
        courseId: classExists.courseId,
        pdfUrl: pdfUrl || null,
        driveLink: driveLink || null,
      }
    });
    return NextResponse.json({
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      pdfUrl: certificate.pdfUrl,
      driveLink: certificate.driveLink,
      message: 'Certificate created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding instructure certificate:', error);
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

// GET /api/course-schedule/[id]/instructure/certificate?instructureId=XXX - Get certificate for an instructure
export async function GET(request: Request, { params }: Params) {
  try {
    const { id: classId } = params;
    const { searchParams } = new URL(request.url);
    const instructureId = searchParams.get('instructureId');

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructure ID is required as a query parameter' },
        { status: 400 }
      );
    }

    // Check if instructure is assigned to this class
    const instructureClass = await prisma.instructureClass.findFirst({
      where: {
        classId,
        instructureId
      }
    });
    if (!instructureClass) {
      return NextResponse.json(
        { error: 'Instructure is not assigned to this course' },
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
        instructureId: instructureId,
        courseId: classData.courseId,
      }
    });
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Error getting instructure certificate:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to get certificate: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get certificate' },
      { status: 500 }
    );
  }
} 