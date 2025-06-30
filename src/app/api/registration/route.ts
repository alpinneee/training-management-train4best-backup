import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      
      // Jika tidak ada data tersedia, kembalikan data dummy untuk testing
      if (formattedRegistrations.length === 0) {
        const dummyRegistrations = [
          {
            id: 'reg_1',
            courseId: 'course_1',
            courseName: 'AIoT (Artificial Intelligence of Things)',
            className: 'Jakarta - Jan 25',
            schedule: '25 Jan 2024 - 28 Jan 2024',
            registrationDate: '2024-01-10',
            amount: 1500000,
            status: 'Unpaid'
          },
          {
            id: 'reg_2',
            courseId: 'course_2',
            courseName: 'Full Stack Web Development',
            className: 'Online - Feb 5',
            schedule: '5 Feb 2024 - 10 Feb 2024',
            registrationDate: '2024-01-15',
            amount: 1200000,
            status: 'Paid'
          },
          {
            id: 'reg_3',
            courseId: 'course_3',
            courseName: 'Data Science Fundamentals',
            className: 'Bandung - Mar 15',
            schedule: '15 Mar 2024 - 20 Mar 2024',
            registrationDate: '2024-02-01',
            amount: 1800000,
            status: 'Unpaid'
          }
        ];
        
        return NextResponse.json({
          data: dummyRegistrations,
          meta: {
            total: dummyRegistrations.length,
            page,
            limit,
            totalPages: 1,
            message: "Menampilkan data dummy karena tidak ada registrasi yang ditemukan"
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
      
      // Jika terjadi error database, kembalikan data dummy
      const dummyRegistrations = [
        {
          id: 'reg_1',
          courseId: 'course_1',
          courseName: 'AIoT (Artificial Intelligence of Things)',
          className: 'Jakarta - Jan 25',
          schedule: '25 Jan 2024 - 28 Jan 2024',
          registrationDate: '2024-01-10',
          amount: 1500000,
          status: 'Unpaid'
        },
        {
          id: 'reg_2',
          courseId: 'course_2',
          courseName: 'Full Stack Web Development',
          className: 'Online - Feb 5',
          schedule: '5 Feb 2024 - 10 Feb 2024',
          registrationDate: '2024-01-15',
          amount: 1200000,
          status: 'Paid'
        }
      ];
      
      return NextResponse.json({
        data: dummyRegistrations,
        meta: {
          total: dummyRegistrations.length,
          page,
          limit,
          totalPages: 1,
          error: "Database error, menggunakan data dummy",
          details: dbError instanceof Error ? dbError.message : "Unknown error"
        }
      });
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