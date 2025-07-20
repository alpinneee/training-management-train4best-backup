import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`GET /api/certificate/${params.id} - start`);
  const certificateId = params.id;

  try {
    // Fetch certificate with course info
    const certificate = await prisma.certificate.findUnique({
      where: {
        id: certificateId,
      },
      include: {
        course: {
          select: {
            id: true,
            course_name: true,
          },
        },
      },
    });

    if (!certificate) {
      console.log(`Certificate with ID ${certificateId} not found`);
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Format response
    const response = {
      id: certificate.id,
      name: certificate.name,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      status: certificate.status,
      pdfUrl: certificate.pdfUrl,
      driveLink: certificate.driveLink,
      course: certificate.course
        ? {
            id: certificate.course.id,
            name: certificate.course.course_name,
          }
        : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching certificate ${certificateId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch certificate details" },
      { status: 500 }
    );
  }
}

// PUT /api/certificate/[id] - Update a certificate
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      certificateNumber, 
      name, 
      issueDate, 
      expiryDate, 
      status, 
      participantId, 
      courseId,
      driveLink
    } = body;

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Check if certificate number is being changed and if it already exists
    if (certificateNumber && certificateNumber !== existingCertificate.certificateNumber) {
      const certificateWithSameNumber = await prisma.certificate.findUnique({
        where: { certificateNumber },
      });

      if (certificateWithSameNumber && certificateWithSameNumber.id !== id) {
        return NextResponse.json(
          { error: "Certificate number already exists" },
          { status: 409 }
        );
      }
    }

    // Update certificate
    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        certificateNumber: certificateNumber || undefined,
        name: name || undefined,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: status || undefined,
        driveLink,
        participantId: participantId || undefined,
        courseId: courseId || undefined,
      },
      include: {
        participant: {
          select: {
            full_name: true,
          },
        },
        course: {
          select: {
            course_name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCertificate);
  } catch (error) {
    console.error("Error updating certificate:", error);
    return NextResponse.json(
      { error: "Failed to update certificate" },
      { status: 500 }
    );
  }
}

// DELETE /api/certificate/[id] - Delete a certificate
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Delete certificate
    await prisma.certificate.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Certificate deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json(
      { error: "Failed to delete certificate" },
      { status: 500 }
    );
  }
} 