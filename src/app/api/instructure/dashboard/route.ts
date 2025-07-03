export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { verify } from 'jsonwebtoken';

// Helper function to get current instructure
async function getCurrentInstructure() {
  try {
    // Try from session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          instructure: true
        }
      });
      
      if (user && user.instructure) {
        return user.instructure;
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
            instructure: true
          }
        });
        
        if (user && user.instructure) {
          return user.instructure;
        }
      }
    }
    
    // Try from dashboard token
    const dashboardToken = cookieStore.get("dashboard_token")?.value;
    if (dashboardToken) {
      try {
        const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
        const decoded = verify(dashboardToken, secret) as any;
        if (decoded && decoded.email) {
          const user = await prisma.user.findUnique({
            where: { email: decoded.email },
            include: {
              instructure: true
            }
          });
          
          if (user && user.instructure) {
            return user.instructure;
          }
        }
      } catch (error) {
        console.error("Error decoding dashboard token:", error);
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting current instructure:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    let instructure = null;
    
    // If email is provided, look up instructure by email
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          instructure: true
        }
      });
      
      if (user && user.instructure) {
        instructure = user.instructure;
      }
    } else {
      // Otherwise try to get current instructure
      instructure = await getCurrentInstructure();
    }
    
    if (!instructure) {
      return NextResponse.json(
        { error: 'Instructure profile not found' },
        { status: 404 }
      );
    }

    const instructureId = instructure.id;
    const currentDate = new Date();

    // Get classes taught by this instructor
    const instructureClasses = await prisma.instructureClass.findMany({
      where: {
        instructureId: instructureId
      },
      include: {
        class: {
          include: {
            course: true,
            courseregistration: {
              include: {
                participant: true
              }
            }
          }
        }
      }
    });

    // Process classes into teaching courses
    const teachingCourses = instructureClasses.map(ic => {
      const classData = ic.class;
      const startDate = new Date(classData.start_date);
      const endDate = new Date(classData.end_date);
      
      // Determine status
      let status: "active" | "completed" | "upcoming" = "upcoming";
      if (currentDate > endDate) {
        status = "completed";
      } else if (currentDate >= startDate) {
        status = "active";
      }
      
      return {
        id: classData.id,
        name: classData.course.course_name,
        students: classData.courseregistration.length,
        nextSession: status === "completed" ? null : startDate > currentDate ? startDate.toISOString().split('T')[0] : endDate.toISOString().split('T')[0],
        status: status
      };
    });

    // Get student progress data
    const studentProgress = [];
    
    // For active courses, get student progress information
    const activeClasses = instructureClasses.filter(ic => {
      const startDate = new Date(ic.class.start_date);
      const endDate = new Date(ic.class.end_date);
      return currentDate >= startDate && currentDate <= endDate;
    });
    
    for (const activeClass of activeClasses) {
      // Get value reports for students in this class
      const registrations = activeClass.class.courseregistration;
      
      for (const reg of registrations) {
        const valueReports = await prisma.valueReport.findMany({
          where: {
            registrationId: reg.id,
            instructureId: instructureId
          },
          orderBy: {
            id: 'desc'
          },
          take: 1
        });
        
        // If there's a value report, add student to progress list
        if (valueReports.length > 0) {
          const lastReport = valueReports[0];
          const lastActive = new Date();
          
          studentProgress.push({
            id: reg.participantId,
            name: reg.participant.full_name,
            course: activeClass.class.course.course_name,
            progress: lastReport.value, // Using the value as progress percentage
            lastActive: lastActive.toISOString().split('T')[0]
          });
        }
      }
    }

    // Calculate statistics
    const totalStudents = teachingCourses.reduce((sum, course) => sum + course.students, 0);
    const activeCourses = teachingCourses.filter(c => c.status === "active").length;
    const upcomingSessions = teachingCourses.filter(c => c.status === "upcoming").length;
    
    // Get pending reviews (value reports that need to be submitted)
    let pendingReviews = 0;
    for (const activeClass of activeClasses) {
      const registrations = activeClass.class.courseregistration;
      
      for (const reg of registrations) {
        // Check if there's no value report for this registration
        const valueReport = await prisma.valueReport.findFirst({
          where: {
            registrationId: reg.id,
            instructureId: instructureId
          }
        });
        
        if (!valueReport) {
          pendingReviews++;
        }
      }
    }

    const stats = [
      {
        title: "Total Students",
        value: totalStudents.toString(),
        icon: "Users",
        color: "bg-blue-100 text-blue-600"
      },
      {
        title: "Active Courses",
        value: activeCourses.toString(),
        icon: "BookOpen",
        color: "bg-green-100 text-green-600"
      },
      {
        title: "Upcoming Sessions",
        value: upcomingSessions.toString(),
        icon: "Calendar",
        color: "bg-yellow-100 text-yellow-600"
      },
      {
        title: "Pending Reviews",
        value: pendingReviews.toString(),
        icon: "GraduationCap",
        color: "bg-purple-100 text-purple-600"
      }
    ];

    // Get notifications
    const notifications = [];
    
    // Add notification for pending reviews
    if (pendingReviews > 0) {
      notifications.push({
        type: "review",
        message: `${pendingReviews} assignments need your review`,
        icon: "AlertCircle",
        color: "text-yellow-500"
      });
    }
    
    // Add notification for upcoming sessions
    if (upcomingSessions > 0) {
      notifications.push({
        type: "session",
        message: `You have ${upcomingSessions} upcoming training sessions`,
        icon: "Calendar",
        color: "text-blue-500"
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        teachingCourses,
        studentProgress,
        stats,
        notifications
      }
    });
  } catch (error) {
    console.error('Error fetching instructure dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 