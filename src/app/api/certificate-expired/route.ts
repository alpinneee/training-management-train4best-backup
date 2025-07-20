import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
// GET /api/certificate-expired - Get all expired certificates
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = Number(url.searchParams.get('limit')) || 10;
    const page = Number(url.searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;
    
    console.log("Fetching expired certificates with params:", { search, startDate, endDate });
    
    // Get current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    // Build the where clause
    const whereClause: any = {
      // Certificates with expiry date before today
      expiryDate: {
        lt: today
      }
    };
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { certificateNumber: { contains: search } },
        { participant: { full_name: { contains: search } } },
        { course: { course_name: { contains: search } } }
      ];
    }
    
    // Add date range filters if provided
    if (startDate) {
      whereClause.expiryDate = {
        ...whereClause.expiryDate,
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // Set to end of day
      
      whereClause.expiryDate = {
        ...whereClause.expiryDate,
        lte: endDateObj
      };
    }
    
    console.log("Where clause:", JSON.stringify(whereClause));
    
    // Fetch expired certificates
    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      include: {
        participant: true,
        course: true
      },
      skip,
      take: limit,
      orderBy: {
        expiryDate: 'desc'
      }
    });
    
    console.log(`Found ${certificates.length} expired certificates`);
    
    // Format certificates for response
    const formattedCertificates = certificates.map((cert, index) => {
      // Debug log to see what's in the course object
      console.log(`Certificate ${cert.id} course:`, cert.course);
      
      return {
        id: cert.id,
        no: skip + index + 1,
        name: cert.name,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate.toISOString().split('T')[0],
        expiryDate: cert.expiryDate.toISOString().split('T')[0],
        status: cert.status,
        course: cert.course?.course_name || "Not Assigned"
      };
    });
    
    // Count total for pagination
    const total = await prisma.certificate.count({
      where: whereClause
    });
    
    return NextResponse.json(formattedCertificates);
  } catch (error) {
    console.error("Error fetching expired certificates:", error);
    return NextResponse.json(
      { error: "Failed to fetch expired certificates", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 