import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cron/update-expired-certificates - Update expired certificates
export async function GET(req: Request) {
  try {
    // Get current date
    const today = new Date();
    
    // Find certificates that have expired but still have Valid status
    const expiredCertificates = await prisma.certificate.findMany({
      where: {
        expiryDate: {
          lt: today
        },
        status: "Valid"
      }
    });
    
    console.log(`Found ${expiredCertificates.length} certificates that need status update`);
    
    if (expiredCertificates.length === 0) {
      return NextResponse.json({ 
        message: "No expired certificates to update",
        updated: 0
      });
    }
    
    // Update all expired certificates
    const updateResult = await prisma.certificate.updateMany({
      where: {
        id: {
          in: expiredCertificates.map(cert => cert.id)
        }
      },
      data: {
        status: "Expired"
      }
    });
    
    console.log(`Updated ${updateResult.count} certificates to Expired status`);
    
    return NextResponse.json({ 
      message: "Certificates updated successfully",
      updated: updateResult.count
    });
  } catch (error) {
    console.error("Error updating expired certificates:", error);
    return NextResponse.json(
      { error: "Failed to update expired certificates", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 