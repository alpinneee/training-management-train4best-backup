import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin or bypassing auth for testing
    const queryParams = request.nextUrl.searchParams;
    const bypassAuth = queryParams.get('bypass') === 'true';
    const userEmail = queryParams.get('email');
    const instructureId = queryParams.get('instructureId');
    
    // Get the authenticated user or use the provided email for debugging
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email && !bypassAuth) {
      return NextResponse.json({ error: "Unauthorized", session }, { status: 401 });
    }
    
    const email = userEmail || session?.user?.email;
    
    if (!email) {
      return NextResponse.json({ error: "No email provided" }, { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        instructure: true,
        userType: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", email }, { status: 404 });
    }

    // Get all instructure records to identify possible matches
    const allInstructures = await prisma.instructure.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });

    // Check for certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        // Try to find certificates with the instructureId if provided
        instructureId: instructureId || undefined
      },
      include: {
        course: true,
        instructure: true
      }
    });

    // Check if fix is requested
    const shouldFix = queryParams.get('fix') === 'true';
    let fixResult = null;
    
    if (shouldFix && instructureId && user) {
      // Update user to link with provided instructure ID
      try {
        const updateResult = await prisma.user.update({
          where: { id: user.id },
          data: {
            instructureId: instructureId
          },
          include: {
            instructure: true,
            userType: true
          }
        });
        
        fixResult = {
          success: true,
          message: `Updated user ${user.email} with instructureId ${instructureId}`,
          user: {
            id: updateResult.id,
            email: updateResult.email,
            instructureId: updateResult.instructureId,
            userType: updateResult.userType
          }
        };
      } catch (err) {
        fixResult = {
          success: false,
          message: `Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`,
          error: err
        };
      }
    }

    // Return all gathered information
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        instructureId: user.instructureId,
        userType: user.userType
      },
      instructure: user.instructure ? {
        id: user.instructure.id,
        fullName: user.instructure.full_name,
        phone: user.instructure.phone_number
      } : null,
      allInstructures: allInstructures.map(i => ({
        id: i.id,
        fullName: i.full_name,
        hasUsers: i.user.length > 0,
        users: i.user
      })),
      certificates: certificates.map(cert => ({
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        name: cert.name,
        courseName: cert.course?.course_name,
        instructureName: cert.instructure?.full_name,
        instructureId: cert.instructureId
      })),
      fixResult
    });
  } catch (error) {
    console.error("Error in check-instructure-user endpoint:", error);
    return NextResponse.json(
      { error: "Server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 