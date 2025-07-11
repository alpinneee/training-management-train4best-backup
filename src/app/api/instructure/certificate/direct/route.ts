import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is a simplified version of the certificate API without pagination
// It's designed for direct access and debugging purposes

export async function POST(request: NextRequest) {
  console.log('POST /api/instructure/certificate/direct - start');
  
  try {
    // Get instructure ID from request body
    const { instructureId } = await request.json();
    
    if (!instructureId) {
      console.log('No instructureId provided');
      return NextResponse.json({ 
        error: "instructureId is required",
        certificates: []
      }, { status: 400 });
    }
    
    console.log('Finding certificates for instructure ID:', instructureId);
    
    try {
      // First, check if the instructor exists
      const instructure = await prisma.instructure.findUnique({
        where: { id: instructureId }
      });
      
      if (!instructure) {
        console.log('Instructure not found with ID:', instructureId);
        return NextResponse.json({ 
          error: "Instructor not found",
          certificates: [],
          debug: { instructureId, lookup: 'failed' }
        }, { status: 404 });
      }
      
      console.log('Found instructor:', instructure.full_name);
      
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
      
      console.log(`Found ${certificates.length} certificates for instructor ${instructure.full_name} (${instructureId})`);
      
      // If no certificates are found, return an empty array but with status 200
      if (certificates.length === 0) {
        return NextResponse.json({
          instructure: {
            id: instructure.id,
            name: instructure.full_name
          },
          certificates: [],
          message: "No certificates found for this instructor",
          debug: { instructureId, lookup: 'success', certificatesFound: 0 }
        });
      }
      
      const response = {
        instructure: {
          id: instructure.id,
          name: instructure.full_name
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
        })),
        debug: { 
          instructureId,
          instructureName: instructure.full_name,
          lookup: 'success',
          certificatesFound: certificates.length
        }
      };
      
      console.log('Returning JSON response with certificates:', response.certificates.length);
      return NextResponse.json(response);
    } catch (certificateError) {
      console.error('Error querying certificates:', certificateError);
      return NextResponse.json({
        certificates: [],
        error: "Error querying certificates",
        debug: { 
          instructureId,
          error: certificateError instanceof Error ? certificateError.message : 'Unknown error'
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error getting instructure certificates:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: `Failed to get certificates: ${error.message}`,
          certificates: [],
          debug: { error: error.message }
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to get certificates',
        certificates: [],
        debug: { error: 'Unknown error' }
      },
      { status: 500 }
    );
  }
} 