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
        const secret = process.env.NEXTAUTH_SECRET || "";
        const decoded = verify(dashboardToken, secret);
        
        if (typeof decoded === 'object' && decoded.email) {
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
      } catch (error) {
        console.error('Error decoding dashboard token:', error);
      }
    }
    
    // Try from email parameter in URL
    return null;
  } catch (error) {
    console.error('Error getting current instructure:', error);
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
            course: {
              include: {
                courseType: true
              }
            },
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
        courseName: classData.course.course_name,
        courseType: classData.course.courseType.course_type,
        location: classData.location,
        room: classData.room,
        startDate: classData.start_date,
        endDate: classData.end_date,
        students: classData.courseregistration.length,
        quota: classData.quota,
        price: classData.price,
        status: status
      };
    });

    return NextResponse.json({
      success: true,
      data: teachingCourses
    });
  } catch (error) {
    console.error('Error fetching instructure courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses data' },
      { status: 500 }
    );
  }
} 