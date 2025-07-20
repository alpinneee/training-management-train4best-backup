export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

// Helper function to get current user
async function getCurrentUser() {
  try {
    // Try from session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          participant: true
        }
      });
      
      if (user && user.participant && user.participant.length > 0) {
        return user.participant[0];
      }
    }
    
    // Try from session token
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    
    if (sessionToken) {
      const decoded = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET || ""
      });
      
      if (decoded && typeof decoded === 'object' && decoded.email) {
        const user = await prisma.user.findUnique({
          where: { email: decoded.email as string },
          include: {
            participant: true
          }
        });
        
        if (user && user.participant && user.participant.length > 0) {
          return user.participant[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    let participant = null;
    
    // If email is provided, look up participant by email
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          participant: true
        }
      });
      
      if (user && user.participant && user.participant.length > 0) {
        participant = user.participant[0];
      }
    } else {
      // Otherwise try to get current user
      participant = await getCurrentUser();
    }
    
    // If still no participant found, try to create a demo participant
    if (!participant) {
      console.log('No participant found, creating demo participant');
      
      // First, ensure we have the correct userType
      let userType = await prisma.userType.findFirst({
        where: { usertype: 'Participant' }
      });
      
      if (!userType) {
        userType = await prisma.userType.create({
          data: {
            id: `usertype_${Date.now()}`,
            usertype: 'Participant',
            description: 'Participant user type',
            status: 'Active'
          }
        });
      }
      
      // Try to find or create a demo user
      let demoUser = await prisma.user.findUnique({
        where: { email: 'demo@example.com' }
      });
      
      if (!demoUser) {
        demoUser = await prisma.user.create({
          data: {
            id: `user_${Date.now()}`,
            email: 'demo@example.com',
            username: 'Demo User',
            password: 'demo123', // Add required password field
            userTypeId: userType.id
          }
        });
      }
      
      // Create demo participant if it doesn't exist
      const existingParticipant = await prisma.participant.findFirst({
        where: { userId: demoUser.id }
      });
      
      if (!existingParticipant) {
        participant = await prisma.participant.create({
          data: {
            id: `participant_${Date.now()}`,
            full_name: 'Demo Participant',
            phone_number: '+6281234567890',
            address: 'Demo Address',
            gender: 'Male',
            birth_date: new Date('1990-01-01'),
            job_title: 'Demo Job',
            company: 'Demo Company',
            userId: demoUser.id
          }
        });
      } else {
        participant = existingParticipant;
      }
    }
    
    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }
    
    // Get participant's course registrations
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        participantId: participant.id
      },
      include: {
        class: {
          include: {
            course: true
          }
        },
        certification: true
      }
    });
    
    // Get certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        participantId: participant.id
      },
      include: {
        course: true
      }
    });
    
    // Process registrations into courses
    const courses = registrations.map(reg => {
      const startDate = new Date(reg.class.start_date);
      const endDate = new Date(reg.class.end_date);
      const now = new Date();
      
      // Calculate progress
      let progress = 0;
      let status: "active" | "completed" | "upcoming" = "upcoming";
      
      if (now > endDate) {
        progress = 100;
        status = "completed";
      } else if (now >= startDate) {
        // Calculate progress as percentage of days passed
        const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const daysPassed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        progress = Math.round((daysPassed / totalDays) * 100);
        status = "active";
      }
      
      return {
        id: reg.id,
        name: reg.class.course.course_name,
        progress: progress,
        nextSession: startDate > now ? startDate.toISOString().split('T')[0] : endDate.toISOString().split('T')[0],
        status: status
      };
    });
    
    // Process certificates
    const processedCertificates = certificates.map(cert => {
      const now = new Date();
      const expiryDate = new Date(cert.expiryDate);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      let status: "valid" | "expired" | "expiring" = "valid";
      
      if (expiryDate < now) {
        status = "expired";
      } else if (expiryDate < oneMonthFromNow) {
        status = "expiring";
      }
      
      return {
        id: cert.id,
        courseName: cert.course?.course_name || "Unknown Course",
        issueDate: cert.issueDate.toISOString().split('T')[0],
        expiryDate: cert.expiryDate.toISOString().split('T')[0],
        status: status
      };
    });
    
    // Calculate stats
    const activeCourses = courses.filter(c => c.status === "active").length;
    const certificateCount = processedCertificates.length;
    const pendingPayments = registrations.filter(r => r.payment_status === "Unpaid").length;
    const upcomingSessions = courses.filter(c => c.status === "upcoming").length;
    
    // Get notifications
    const notifications = [];
    
    // Payment notifications
    const unpaidRegistrations = registrations.filter(r => r.payment_status === "Unpaid");
    for (const reg of unpaidRegistrations) {
      notifications.push({
        type: "payment",
        icon: "CreditCard",
        title: "Payment Due",
        message: `Payment for ${reg.class.course.course_name} course is due`,
        color: "yellow"
      });
    }
    
    // Certificate notifications
    const validCertificates = processedCertificates.filter(c => c.status === "valid");
    for (const cert of validCertificates) {
      notifications.push({
        type: "certificate",
        icon: "CheckCircle2",
        title: "Certificate Available",
        message: `Your ${cert.courseName} certificate is ready to download`,
        color: "green"
      });
    }
    
    // Expiring certificates
    const expiringCertificates = processedCertificates.filter(c => c.status === "expiring");
    for (const cert of expiringCertificates) {
      notifications.push({
        type: "certificate",
        icon: "AlertCircle",
        title: "Certificate Expiring",
        message: `Your ${cert.courseName} certificate expires on ${cert.expiryDate}`,
        color: "yellow"
      });
    }
    
    return NextResponse.json({
      data: {
        courses,
        certificates: processedCertificates,
        stats: [
          {
            title: "Active Courses",
            value: activeCourses.toString(),
            icon: "BookOpen",
            color: "bg-blue-100 text-blue-600"
          },
          {
            title: "Certificates",
            value: certificateCount.toString(),
            icon: "FileText",
            color: "bg-green-100 text-green-600"
          },
          {
            title: "Pending Payments",
            value: pendingPayments.toString(),
            icon: "CreditCard",
            color: "bg-yellow-100 text-yellow-600"
          },
          {
            title: "Upcoming Sessions",
            value: upcomingSessions.toString(),
            icon: "Calendar",
            color: "bg-purple-100 text-purple-600"
          }
        ],
        notifications
      }
    });
  } catch (error) {
    console.error("Error fetching participant dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
} 