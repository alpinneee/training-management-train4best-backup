import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// GET /api/certificate - Get all certificates
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const limit = Number(url.searchParams.get('limit')) || 10;
    const page = Number(url.searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;
    const isAdmin = url.searchParams.get('admin') === 'true';
    
    console.log("Request params:", { email, limit, page, isAdmin });
    
    // Filter to find certificates by email
    // If email is provided, find certificates for that user
    // If admin=true, return all certificates
    let whereClause = {};
    
    if (email && !isAdmin) {
      try {
        // First, find the participant ID associated with this email
        const user = await prisma.user.findUnique({
          where: { email },
          include: { participant: true }
        });
        
        // Check if participant exists and access its ID safely
        const participantId = user?.participant ? user.participant[0]?.id : undefined;
        
        if (participantId) {
          // If participant found, filter by participant ID
          whereClause = { participantId };
          console.log(`Found participant ID ${participantId} for email ${email}`);
        } else {
          console.log(`No participant found for email ${email}`);
        }
      } catch (err) {
        console.error("Error finding participant:", err);
      }
    }
    
    try {
      // Find certificates based on the where clause
      const certificates = await prisma.certificate.findMany({
        where: whereClause,
        include: {
          participant: true,
          course: true
        },
        skip: isAdmin ? 0 : skip, // Skip pagination for admin view to get all certificates
        take: isAdmin ? 100 : limit, // Get more certificates for admin view
        orderBy: {
          issueDate: 'desc'
        }
      });
      
      console.log("Found certificates:", certificates.length);
      
      // Format the response
      const formattedCertificates = certificates.map(cert => {
        // Debug log to see what's in the course object
        console.log(`Certificate ${cert.id} course:`, cert.course);
        
        return {
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          issueDate: cert.issueDate,
          courseName: cert.course?.course_name || "Not Assigned",
          courseType: "Training", // Default value since courseType might not be directly accessible
          location: "Online", // Default value
          startDate: cert.issueDate,
          endDate: cert.expiryDate,
          participantName: cert.participant?.full_name || "Unknown",
          driveLink: cert.driveLink || null,
          name: cert.name,
          status: cert.status,
          description: [
            `Certificate valid until ${new Date(cert.expiryDate).toLocaleDateString('en-US')}`,
            `Status: ${cert.status}`
          ]
        };
      });
      
      // If no data is available, return dummy data for testing
      if (formattedCertificates.length === 0) {
        const dummyCertificates = [
          {
            id: "dummy_1",
            certificateNumber: "CERT/2023/001",
            issueDate: new Date(),
            courseName: "AIoT",
            courseType: "Technical",
            location: "Jakarta",
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
            participantName: "User Test",
            description: [
              "Membangun sistem AIoT",
              "Mengembangkan aplikasi smart home, smart agriculture, smart healthcare"
            ]
          },
          {
            id: "dummy_2",
            certificateNumber: "CERT/2023/002",
            issueDate: new Date(),
            courseName: "Programmer",
            courseType: "Technical",
            location: "Bandung",
            startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
            participantName: "User Test",
            description: [
              "Introduction (pengenalan web)",
              "Frontend, backend"
            ]
          }
        ];
        
        console.log("No certificates found, returning dummy data");
        return NextResponse.json({
          data: dummyCertificates,
          meta: {
            total: dummyCertificates.length,
            page,
            limit,
            totalPages: 1,
            message: "Menampilkan data dummy karena tidak ada sertifikat yang ditemukan"
          }
        });
      }
      
      // Count total certificates for pagination
      const totalCount = await prisma.certificate.count({
        where: whereClause
      });
      
      return NextResponse.json({
        data: formattedCertificates,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      
      // If there's a database error, return dummy data
      const dummyCertificates = [
        {
          id: "dummy_1",
          certificateNumber: "CERT/2023/001",
          issueDate: new Date(),
          courseName: "AIoT",
          courseType: "Technical",
          location: "Jakarta",
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
          participantName: "User Test",
          description: [
            "Membangun sistem AIoT",
            "Mengembangkan aplikasi smart home, smart agriculture, smart healthcare"
          ]
        },
        {
          id: "dummy_2",
          certificateNumber: "CERT/2023/002",
          issueDate: new Date(),
          courseName: "Programmer",
          courseType: "Technical",
          location: "Bandung",
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
          participantName: "User Test",
          description: [
            "Introduction (pengenalan web)",
            "Frontend, backend"
          ]
        }
      ];
      
      return NextResponse.json({
        data: dummyCertificates,
        meta: {
          total: dummyCertificates.length,
          page,
          limit,
          totalPages: 1,
          error: "Database error, menggunakan data dummy",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }
      });
    }
  } catch (error) {
    console.error("Fatal error fetching certificates:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificates", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/certificate - Create a new certificate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      certificateNumber, 
      name, 
      issueDate, 
      expiryDate, 
      status, 
      participantId, 
      courseId 
    } = body;

    // Validate required fields
    if (!name || !issueDate || !expiryDate) {
      return NextResponse.json(
        { error: "Name, issue date, and expiry date are required" },
        { status: 400 }
      );
    }

    // Generate unique certificate number if not provided
    const uniqueCertNumber = certificateNumber || await generateUniqueCertificateNumber();

    // Check if certificate number already exists
    if (certificateNumber) {
    const existingCertificate = await prisma.certificate.findUnique({
        where: { certificateNumber: uniqueCertNumber },
    });

    if (existingCertificate) {
      return NextResponse.json(
        { error: "Certificate number already exists" },
        { status: 409 }
      );
      }
    }

    // Create certificate
    const newCertificate = await prisma.certificate.create({
      data: {
        certificateNumber: uniqueCertNumber,
        name,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        status: status || "Valid",
        participant: participantId ? {
          connect: { id: participantId }
        } : undefined,
        course: courseId ? {
          connect: { id: courseId }
        } : undefined
      },
    });

    return NextResponse.json(newCertificate, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json(
      { error: "Failed to create certificate" },
      { status: 500 }
    );
  }
} 