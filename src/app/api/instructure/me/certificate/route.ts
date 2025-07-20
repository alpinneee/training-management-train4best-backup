import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log('GET /api/instructure/me/certificate - start');
  
  // Check authentication first
  console.log('Getting server session...');
  const session = await getServerSession(authOptions);
  console.log('Session:', session?.user ? `User: ${session.user.email}` : 'No session');
  
  if (!session?.user?.email) {
    console.log('No authenticated session found');
    // Alih-alih error 401, kembalikan response sukses dengan array kosong
    return NextResponse.json({ 
      message: "Silahkan login untuk melihat sertifikat", 
      certificates: [] 
    }, { status: 200 });
  }
  
  try {
    // Find the user by email
    console.log('Finding user by email:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        instructure: true
      }
    });
    console.log('User found:', user ? `ID: ${user.id}, Instructure ID: ${user.instructureId}` : 'No user');

    if (!user) {
      console.log('User not found');
      return NextResponse.json({ 
        error: "User not found",
        certificates: []
      }, { status: 404 });
    }

    if (!user.instructureId) {
      console.log('User is not an instructure');
      return NextResponse.json({ 
        instructure: {
          id: null,
          name: user.username
        },
        certificates: [],
        message: "User is not an instructor"
      }, { status: 200 });
    }

    // Find certificates for this instructure
    console.log('Finding certificates for instructure ID:', user.instructureId);
    try {
      const certificates = await prisma.certificate.findMany({
        where: {
          instructureId: user.instructureId
        },
        include: {
          course: {
            select: {
              id: true,
              course_name: true,
              description: true,
              image: true
            }
          }
        },
        orderBy: {
          issueDate: 'desc'
        }
      });
      console.log(`Found ${certificates.length} certificates`);
      
      const response = {
        instructure: {
          id: user.instructureId,
          name: user.instructure?.full_name || user.username
        },
        certificates: certificates.map(cert => ({
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          name: cert.name,
          courseName: cert.course?.course_name,
          courseId: cert.courseId,
          courseImage: cert.course?.image,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          status: cert.status,
          pdfUrl: cert.pdfUrl,
          driveLink: cert.driveLink,
          email: user.email
        }))
      };
      
      console.log('Returning JSON response with certificates:', response.certificates.length);
      return NextResponse.json(response);
    } catch (certificateError) {
      console.error('Error querying certificates:', certificateError);
      return NextResponse.json({
        instructure: {
          id: user.instructureId,
          name: user.instructure?.full_name || user.username
        },
        certificates: [],
        error: "Error querying certificates"
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error getting instructure certificates:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: `Failed to get certificates: ${error.message}`,
          certificates: []
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to get certificates',
        certificates: []
      },
      { status: 200 }
    );
  }
} 