import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get instructure ID from request body
    const { instructureId } = await request.json();
    
    if (!instructureId) {
      return NextResponse.json({ 
        error: "instructureId is required",
        certificates: []
      }, { status: 400 });
    }
    
    try {
      // First, check if the instructor exists
      const instructure = await prisma.instructure.findUnique({
        where: { id: instructureId }
      });
      
      if (!instructure) {
        // Try to get instructure from user
        const userWithInstructor = await prisma.user.findFirst({
          where: { instructureId: instructureId },
          include: { instructure: true }
        });
        
        if (userWithInstructor?.instructure) {
          const certificates = await getCertificatesForInstructor(userWithInstructor.instructure.id);
          
          return NextResponse.json({
            instructure: {
              id: userWithInstructor.instructure.id,
              name: userWithInstructor.instructure.full_name
            },
            certificates: certificates
          });
        }
        
        return NextResponse.json({ 
          error: "Instructor not found",
          certificates: []
        }, { status: 404 });
      }
      
      const certificates = await getCertificatesForInstructor(instructureId);
      
      // If no certificates are found, return an empty array but with status 200
      return NextResponse.json({
        instructure: {
          id: instructure.id,
          name: instructure.full_name
        },
        certificates: certificates,
        message: certificates.length === 0 ? "No certificates found for this instructor" : undefined
      });
    } catch (certificateError) {
      console.error('Error querying certificates:', certificateError);
      return NextResponse.json({
        certificates: [],
        error: "Error querying certificates"
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error getting instructure certificates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get certificates',
        certificates: []
      },
      { status: 500 }
    );
  }
}

// Helper function to get certificates for an instructor
async function getCertificatesForInstructor(instructureId: string) {
  // Get all certificates for this instructor
  const certificates = await prisma.certificate.findMany({
    where: {
      instructureId: instructureId
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
  
  return certificates.map(cert => ({
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
  }));
} 