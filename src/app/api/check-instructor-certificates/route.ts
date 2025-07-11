import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// A simplified debug endpoint to check if an instructor has any certificates
export async function GET(request: NextRequest) {
  console.log('GET /api/check-instructor-certificates - start');
  
  try {
    const instructureId = request.nextUrl.searchParams.get('id');
    
    if (!instructureId) {
      return NextResponse.json({
        error: 'instructureId is required as a query parameter',
        example: '/api/check-instructor-certificates?id=instructor-id'
      }, { status: 400 });
    }
    
    // First check if instructor exists
    const instructor = await prisma.instructure.findUnique({
      where: { id: instructureId }
    });
    
    if (!instructor) {
      return NextResponse.json({
        error: 'Instructor not found',
        instructureId,
        exists: false
      }, { status: 404 });
    }
    
    // Check for certificates
    const certificateCount = await prisma.certificate.count({
      where: { instructureId }
    });
    
    // Get all certificates for debugging
    const certificates = await prisma.certificate.findMany({
      where: { instructureId },
      include: {
        course: {
          select: {
            id: true, 
            course_name: true
          }
        }
      }
    });
    
    return NextResponse.json({
      instructor: {
        id: instructor.id,
        name: instructor.full_name
      },
      hasCertificates: certificateCount > 0,
      certificateCount,
      certificates: certificates.map(cert => ({
        id: cert.id,
        number: cert.certificateNumber,
        course: cert.course?.course_name || 'Unknown',
        status: cert.status,
        issueDate: cert.issueDate,
        hasDriveLink: !!cert.driveLink,
        hasPdfUrl: !!cert.pdfUrl
      }))
    });
    
  } catch (error) {
    console.error('Error checking instructor certificates:', error);
    return NextResponse.json({
      error: 'Failed to check instructor certificates',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 