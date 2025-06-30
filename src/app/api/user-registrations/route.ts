export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/user-registrations - Get registrations for a user by email
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    // Email is required
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching registrations for email: ${email}`);
    
    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        participant: true,
      }
    });
    
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return NextResponse.json(
        { 
          error: 'User not found',
          data: [] // Return empty array instead of error for easier client handling
        },
        { status: 200 } // Use 200 to make it easier to handle on frontend
      );
    }
    
    // Check if user has a participant profile
    if (!user.participant || user.participant.length === 0) {
      console.log(`User ${email} has no participant profile`);
      
      // Debugging: Menampilkan semua data user untuk memahami struktur data
      console.log('User data structure:', JSON.stringify(user, null, 2));
      
      // Coba cara alternatif untuk mendapatkan participant
      const alternativeParticipant = await prisma.participant.findFirst({
        where: { userId: user.id }
      });
      
      if (!alternativeParticipant) {
        return NextResponse.json(
          { 
            message: 'User has no participant profile',
            data: [] 
          },
          { status: 200 }
        );
      }
      
      console.log(`Found participant via alternative method: ${alternativeParticipant.id}`);
      
      // Jika ditemukan, lanjutkan dengan participant ID ini
      const participantId = alternativeParticipant.id;
      
      // Find all registrations for this participant
      const registrations = await prisma.courseRegistration.findMany({
        where: {
          participantId
        },
        include: {
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
        orderBy: {
          reg_date: 'desc'
        }
      });
      
      console.log(`Found ${registrations.length} registrations for participant ${participantId}`);
      
      // Format the response
      const formattedRegistrations = registrations.map(registration => {
        // Determine payment status from most recent payment
        const paymentStatus = registration.payments.length > 0 && registration.payments[0].status === 'Paid' 
          ? 'Paid' 
          : 'Unpaid';
        
        const startDate = registration.class.start_date;
        const endDate = registration.class.end_date;
        
        // Format dates
        const formatDate = (date: Date) => {
          const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
          return new Date(date).toLocaleDateString('id-ID', options);
        };
        
        return {
          id: registration.id,
          courseId: registration.class.course.id,
          courseName: registration.class.course.course_name,
          className: `${registration.class.location} - ${formatDate(startDate)}`,
          schedule: `${formatDate(startDate)} - ${formatDate(endDate)}`,
          registrationDate: registration.reg_date.toISOString().split('T')[0],
          amount: registration.payment,
          status: paymentStatus
        };
      });
      
      return NextResponse.json({
        data: formattedRegistrations,
        meta: {
          email: user.email,
          participantId,
          count: formattedRegistrations.length
        }
      });
    }
    
    // Jika participant ada sebagai array (sesuai dengan include di atas)
    const participantId = user.participant[0].id;
    console.log(`Found participant ID: ${participantId}`);
    
    // Find all registrations for this participant
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        participantId
      },
      include: {
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
      orderBy: {
        reg_date: 'desc'
      }
    });
    
    console.log(`Found ${registrations.length} registrations for participant ${participantId}`);
    
    // Format the response
    const formattedRegistrations = registrations.map(registration => {
      // Determine payment status from most recent payment
      const paymentStatus = registration.payments.length > 0 && registration.payments[0].status === 'Paid' 
        ? 'Paid' 
        : 'Unpaid';
      
      const startDate = registration.class.start_date;
      const endDate = registration.class.end_date;
      
      // Format dates
      const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
      };
      
      return {
        id: registration.id,
        courseId: registration.class.course.id,
        courseName: registration.class.course.course_name,
        className: `${registration.class.location} - ${formatDate(startDate)}`,
        schedule: `${formatDate(startDate)} - ${formatDate(endDate)}`,
        registrationDate: registration.reg_date.toISOString().split('T')[0],
        amount: registration.payment,
        status: paymentStatus
      };
    });
    
    return NextResponse.json({
      data: formattedRegistrations,
      meta: {
        email: user.email,
        participantId,
        count: formattedRegistrations.length
      }
    });
    
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 