import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/debug-instructure-email - Debug instructor email issues
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instructureId = searchParams.get('instructureId');
    const fix = searchParams.get('fix') === 'true';

    if (!instructureId) {
      return NextResponse.json(
        { error: 'Instructor ID is required as query parameter' },
        { status: 400 }
      );
    }

    console.log('Debugging instructor email for ID:', instructureId);

    // Get instructor details
    const instructor = await prisma.instructure.findUnique({
      where: { id: instructureId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            userType: {
              select: {
                usertype: true
              }
            }
          }
        }
      }
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Get certificates for this instructor
    const certificates = await prisma.certificate.findMany({
      where: { instructureId },
      include: {
        course: {
          select: {
            course_name: true
          }
        }
      }
    });

    // Check if there are any users with this instructureId
    const directUser = await prisma.user.findFirst({
      where: { instructureId },
      select: {
        id: true,
        email: true,
        username: true,
        userType: {
          select: {
            usertype: true
          }
        }
      }
    });

    const result = {
      instructor: {
        id: instructor.id,
        full_name: instructor.full_name,
        phone_number: instructor.phone_number,
        profiency: instructor.profiency,
        userCount: instructor.user?.length || 0,
        users: instructor.user?.map(u => ({
          id: u.id,
          email: u.email,
          username: u.username,
          userType: u.userType?.usertype
        })) || []
      },
      directUser: directUser ? {
        id: directUser.id,
        email: directUser.email,
        username: directUser.username,
        userType: directUser.userType?.usertype
      } : null,
      certificates: certificates.map(cert => ({
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        courseName: cert.course?.course_name,
        issueDate: cert.issueDate
      })),
      emailIssues: {
        hasEmailInRelation: instructor.user && instructor.user.length > 0 && instructor.user[0].email,
        hasDirectUserEmail: directUser?.email,
        recommendedEmail: directUser?.email || (instructor.user && instructor.user.length > 0 ? instructor.user[0].email : null)
      }
    };

    // If fix is requested, try to create a user account for the instructor
    if (fix && !directUser && !instructor.user?.length) {
      try {
        // Get instructor user type
        const instructorUserType = await prisma.userType.findFirst({
          where: { usertype: 'Instructure' }
        });

        if (!instructorUserType) {
          return NextResponse.json({
            ...result,
            fixAttempted: true,
            fixError: 'Instructor user type not found'
          });
        }

        // Create a user account for the instructor
        const email = `${instructor.full_name.toLowerCase().replace(/\s+/g, '.')}@train4best.com`;
        const username = instructor.full_name.toLowerCase().replace(/\s+/g, '.');

        const newUser = await prisma.user.create({
          data: {
            id: `user_${Date.now()}`,
            email,
            username,
            password: '$2a$10$dummy.hash.for.instructor', // Dummy password
            userTypeId: instructorUserType.id,
            instructureId: instructor.id
          }
        });

        return NextResponse.json({
          ...result,
          fixAttempted: true,
          fixSuccess: true,
          newUser: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username
          },
          message: 'User account created for instructor'
        });
      } catch (fixError) {
        console.error('Error creating user for instructor:', fixError);
        return NextResponse.json({
          ...result,
          fixAttempted: true,
          fixError: fixError instanceof Error ? fixError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error debugging instructor email:', error);
    return NextResponse.json(
      { error: 'Failed to debug instructor email' },
      { status: 500 }
    );
  }
} 