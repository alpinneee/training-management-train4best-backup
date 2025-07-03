import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/certificate/[id]/drive-link - Get certificate drive link
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        certificateNumber: true,
        name: true,
        driveLink: true,
        participant: {
          select: {
            id: true,
            full_name: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      name: certificate.name,
      driveLink: certificate.driveLink,
      participant: certificate.participant
    });
  } catch (error) {
    console.error("Error fetching certificate drive link:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate drive link" },
      { status: 500 }
    );
  }
}

// PUT /api/certificate/[id]/drive-link - Update certificate drive link
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { driveLink } = await request.json();

    if (!driveLink) {
      return NextResponse.json(
        { error: "Drive link is required" },
        { status: 400 }
      );
    }

    // Validate if certificate exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id }
    });

    if (!existingCertificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Update certificate with drive link
    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: { driveLink }
    });

    return NextResponse.json({
      id: updatedCertificate.id,
      certificateNumber: updatedCertificate.certificateNumber,
      name: updatedCertificate.name,
      driveLink: updatedCertificate.driveLink,
      message: "Certificate drive link updated successfully"
    });
  } catch (error) {
    console.error("Error updating certificate drive link:", error);
    return NextResponse.json(
      { error: "Failed to update certificate drive link" },
      { status: 500 }
    );
  }
} 