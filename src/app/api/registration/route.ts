import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/registration - Get registrations for a participant
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const limit = Number(url.searchParams.get('limit')) || 10;
    const page = Number(url.searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;
    
    // Filter untuk mencari registrasi
    let whereClause: any = {};
    
    // Filter by user email
    if (email) {
      whereClause.participant = {
        user: { email }
      };
    }
    
    try {
      // Cari registrasi kursus
      const registrations = await prisma.courseRegistration.findMany({
        where: whereClause,
        include: {
          participant: {
            include: {
              user: true
            }
          },
          class: {
            include: {
              course: true
            }
          },
          payments: {
            orderBy: {
              paymentDate: 'desc'
            },
            take: 1
          }
        },
        skip,
        take: limit,
        orderBy: {
          reg_date: 'desc'
        }
      });
      
      // Format respons
      const formattedRegistrations = registrations.map(registration => {
        // Tentukan status pembayaran dari pembayaran terakhir
        const paymentStatus = registration.payments.length > 0 && registration.payments[0].status === 'Paid' 
          ? 'Paid' 
          : 'Unpaid';
        
        const startDate = registration.class.start_date;
        const endDate = registration.class.end_date;
        
        const formatDate = (date: Date) => {
          const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
          return new Date(date).toLocaleDateString('en-US', options);
        };
        
        return {
          id: registration.id,
          courseId: registration.class.course.id,
          courseName: registration.class.course.course_name,
          className: `${registration.class.location} - ${formatDate(startDate)}`,
          schedule: `${formatDate(startDate)} - ${formatDate(endDate)}`,
          registrationDate: registration.reg_date.toISOString().split('T')[0],
          amount: registration.class.price,
          status: paymentStatus
        };
      });
      
      // Jika tidak ada data tersedia, kembalikan data kosong
      if (formattedRegistrations.length === 0) {
        return NextResponse.json({
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            message: "Tidak ada registrasi yang ditemukan"
          }
        });
      }
      
      // Hitung total registrasi untuk pagination
      const totalCount = await prisma.courseRegistration.count({
        where: whereClause
      });
      
      return NextResponse.json({
        data: formattedRegistrations,
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
    console.error("Fatal error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/registration - Create a new registration
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Extract data from request body
    const { participantId, classId } = body;
    
    // Validate required fields
    if (!participantId || !classId) {
      return NextResponse.json(
        { error: "Missing required fields: participantId, classId" },
        { status: 400 }
      );
    }
    
    // Check if registration already exists
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        participantId,
        classId
      }
    });
    
    if (existingRegistration) {
      return NextResponse.json(
        { error: "Registration already exists for this participant and class" },
        { status: 400 }
      );
    }
    
    // Create new registration
    const newRegistration = await prisma.courseRegistration.create({
      data: {
        id: `reg_${Date.now()}_${Math.round(Math.random() * 10000)}`,
        participantId,
        classId,
        reg_date: new Date(),
        reg_status: "Pending",
        payment: 0,
        payment_status: "Unpaid",
        payment_method: "",
        present_day: 0
      }
    });
    
    return NextResponse.json({
      message: "Registration created successfully",
      data: newRegistration
    });
  } catch (error) {
    console.error("Error creating registration:", error);
    return NextResponse.json(
      { error: "Failed to create registration", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 