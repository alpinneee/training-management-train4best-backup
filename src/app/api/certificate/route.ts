import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

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
          participant: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true
                }
              }
            }
          },
          instructure: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true
                }
              }
            }
          },
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
        console.log(`Certificate ${cert.id} participant:`, cert.participant);
        console.log(`Certificate ${cert.id} instructure:`, cert.instructure);
        console.log(`Certificate ${cert.id} participantId:`, cert.participantId);
        console.log(`Certificate ${cert.id} instructureId:`, cert.instructureId);
        
        // Get recipient name from multiple sources
        let recipientName = "Unknown";
        let recipientType = "Unknown";
        
        // Check if certificate belongs to a participant
        if (cert.participant) {
          if (cert.participant.full_name) {
            recipientName = cert.participant.full_name;
            recipientType = "Participant";
            console.log(`Using participant full_name: ${recipientName}`);
          } else if (cert.participant.user?.username) {
            recipientName = cert.participant.user.username;
            recipientType = "Participant";
            console.log(`Using participant user username: ${recipientName}`);
          }
        }
        // Check if certificate belongs to an instructor
        else if (cert.instructure) {
          if (cert.instructure.full_name) {
            recipientName = cert.instructure.full_name;
            recipientType = "Instructor";
            console.log(`Using instructure full_name: ${recipientName}`);
          } else if (cert.instructure.user && cert.instructure.user.length > 0) {
            recipientName = cert.instructure.user[0].username;
            recipientType = "Instructor";
            console.log(`Using instructure user username: ${recipientName}`);
          }
        }
        // Fallback to certificate name if no participant or instructor found
        else if (cert.name && !cert.name.includes("Certificate")) {
          recipientName = cert.name;
          recipientType = "Unknown";
          console.log(`Using certificate name: ${recipientName}`);
        } else {
          console.log(`No recipient name found for certificate ${cert.id}`);
        }
        
        console.log(`Certificate ${cert.id} final recipientName: ${recipientName} (${recipientType})`);
        
        return {
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          issueDate: cert.issueDate,
          courseName: cert.course?.course_name || "Not Assigned",
          courseType: "Training", // Default value since courseType might not be directly accessible
          location: "Online", // Default value
          startDate: cert.issueDate,
          endDate: cert.expiryDate,
          participantName: recipientName,
          recipientType: recipientType,
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
        console.log("No certificates found, returning empty data");
        return NextResponse.json({
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            message: "Tidak ada sertifikat yang ditemukan"
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
      
      // Return error with empty data
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }
      }, { status: 500 });
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