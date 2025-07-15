import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Debug endpoint to check instructure and certificate relationships
export async function GET(request: NextRequest) {
  const instructureId = request.nextUrl.searchParams.get('id');
  const email = request.nextUrl.searchParams.get('email');
  
  if (!instructureId && !email) {
    return NextResponse.json({
      error: 'Either instructureId or email parameter is required',
      examples: [
        '/api/debug-instructure-certificate?id=instruktur-id',
        '/api/debug-instructure-certificate?email=instructor@example.com'
      ]
    }, { status: 400 });
  }
  
  try {
    // Find instructure either by ID or by email
    let instructure;
    let user;
    
    if (instructureId) {
      // Find by ID
      instructure = await prisma.instructure.findUnique({
        where: { id: instructureId }
      });
      
      // Find linked user if any
      user = await prisma.user.findFirst({
        where: { instructureId: instructureId }
      });
    } else if (email) {
      // Find by email (going through user)
      user = await prisma.user.findUnique({
        where: { email },
        include: { instructure: true }
      });
      
      if (user?.instructure) {
        instructure = user.instructure;
      }
    }
    
    if (!instructure) {
      return NextResponse.json({
        found: false,
        instructureId,
        email,
        userFound: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          hasInstructureId: !!user.instructureId,
          instructureId: user.instructureId
        } : null,
        error: 'Instructure not found'
      }, { status: 404 });
    }
    
    // Find certificates for this instructure
    const certificates = await prisma.certificate.findMany({
      where: { instructureId: instructure.id },
      include: {
        course: {
          select: { id: true, course_name: true }
        }
      },
      orderBy: { issueDate: 'desc' }
    });
    
    // Check for potential issues with instructureId in certificates
    const certificatesByQuery = await prisma.$queryRaw`
      SELECT id, certificate_number, name, course_id, instructure_id
      FROM certificate
      WHERE instructure_id = ${instructure.id}
    `;
    
    // Return comprehensive debug information
    return NextResponse.json({
      found: true,
      instructure: {
        id: instructure.id,
        name: instructure.full_name,
        phone: instructure.phone_number
      },
      userLink: user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: user.userTypeId
      } : 'No user linked',
      certificates: {
        count: certificates.length,
        items: certificates.map(cert => ({
          id: cert.id,
          number: cert.certificateNumber,
          name: cert.name,
          course: cert.course?.course_name,
          issueDate: cert.issueDate.toISOString(),
          hasLink: !!cert.driveLink
        }))
      },
      directQuery: {
        count: Array.isArray(certificatesByQuery) ? certificatesByQuery.length : 0,
        results: certificatesByQuery
      }
    });
    
  } catch (error) {
    console.error('Error debugging instructure certificate:', error);
    return NextResponse.json({
      error: 'Failed to debug instructure certificate',
      message: error instanceof Error ? error.message : 'Unknown error',
      instructureId, 
      email
    }, { status: 500 });
  }
} 