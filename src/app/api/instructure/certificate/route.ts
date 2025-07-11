import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('POST /api/instructure/certificate - start');
  
  try {
    // Get instructure ID and pagination params from request body
    const { instructureId, page = 1, pageSize = 6 } = await request.json();
    
    // Validate pagination parameters  
    const currentPage = Number(page) || 1;
    const itemsPerPage = Number(pageSize) || 6;
    const skip = (currentPage - 1) * itemsPerPage;
    
    if (!instructureId) {
      console.log('No instructureId provided');
      return NextResponse.json({ 
        error: "instructureId is required",
        certificates: []
      }, { status: 400 });
    }
    
    console.log('Finding certificates for instructure ID:', instructureId);
    
    try {
      const instructure = await prisma.instructure.findUnique({
        where: { id: instructureId }
      });
      
      if (!instructure) {
        console.log('Instructure not found');
        return NextResponse.json({ 
          error: "Instructure not found",
          certificates: []
        }, { status: 404 });
      }
      
      // Get total count for pagination
      const totalCount = await prisma.certificate.count({
        where: {
          instructureId: instructureId
        }
      });
      
      // Get paginated certificates
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
        },
        skip,
        take: itemsPerPage
      });
      
      console.log(`Found ${certificates.length} certificates (page ${currentPage}, total: ${totalCount})`);
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      
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
        pagination: {
          currentPage,
          totalPages,
          totalItems: totalCount,
          itemsPerPage
        }
      };
      
      console.log('Returning JSON response with certificates:', response.certificates.length);
      return NextResponse.json(response);
    } catch (certificateError) {
      console.error('Error querying certificates:', certificateError);
      return NextResponse.json({
        certificates: [],
        error: "Error querying certificates"
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error getting instructure certificates:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: `Failed to get certificates: ${error.message}`,
          certificates: []
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to get certificates',
        certificates: []
      },
      { status: 500 }
    );
  }
} 