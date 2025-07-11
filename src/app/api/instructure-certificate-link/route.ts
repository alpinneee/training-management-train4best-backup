import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Creates a direct link to an instructor's certificate page
export async function GET(request: NextRequest) {
  try {
    const instructureId = request.nextUrl.searchParams.get('id');
    const baseUrl = request.nextUrl.origin;
    
    if (!instructureId) {
      return NextResponse.json({
        error: 'instructureId parameter is required',
        example: '/api/instructure-certificate-link?id=instructor-id'
      }, { status: 400 });
    }
    
    // Check if instructor exists
    const instructor = await prisma.instructure.findUnique({
      where: { id: instructureId }
    });
    
    if (!instructor) {
      return NextResponse.json({
        error: 'Instructor not found',
        instructureId
      }, { status: 404 });
    }
    
    // Check if instructor has certificates
    const certificateCount = await prisma.certificate.count({
      where: { instructureId }
    });
    
    // Generate certificate URL
    const certificateUrl = `${baseUrl}/instructure/certificate?id=${instructureId}`;
    
    return NextResponse.json({
      instructor: {
        id: instructureId,
        name: instructor.full_name
      },
      certificateCount,
      hasCertificates: certificateCount > 0,
      certificateUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(certificateUrl)}`
    });
    
  } catch (error) {
    console.error('Error generating certificate link:', error);
    return NextResponse.json({
      error: 'Failed to generate certificate link',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 