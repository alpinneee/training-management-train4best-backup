import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/registration/:id - Get a specific registration
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;
    
    try {
      // Cari registrasi kursus by ID
      const registration = await prisma.courseRegistration.findUnique({
        where: { id: registrationId },
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
        }
      });
      
      if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 });
      }
      
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
      
      const formattedRegistration = {
        id: registration.id,
        courseId: registration.class.course.id,
        courseName: registration.class.course.course_name,
        className: `${registration.class.location} - ${formatDate(startDate)}`,
        schedule: `${formatDate(startDate)} - ${formatDate(endDate)}`,
        registrationDate: registration.reg_date.toISOString().split('T')[0],
        amount: registration.class.price,
        status: paymentStatus,
        registrationId: registration.id
      };
      
      return NextResponse.json({
        data: formattedRegistration
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      
      // Jika terjadi error database, kembalikan data dummy untuk demo
      const dummyRegistration = {
        id: registrationId,
        courseId: 'course_1',
        courseName: 'AIoT (Artificial Intelligence of Things)',
        className: 'Jakarta - Jan 25',
        schedule: '25 Jan 2024 - 28 Jan 2024',
        registrationDate: '2024-01-10',
        amount: 1500000,
        status: 'Unpaid',
        registrationId: registrationId
      };
      
      return NextResponse.json({
        data: dummyRegistration,
        meta: {
          message: "Menggunakan data dummy karena terjadi error database",
          error: dbError instanceof Error ? dbError.message : "Unknown error"
        }
      });
    }
  } catch (error) {
    console.error("Fatal error fetching registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 