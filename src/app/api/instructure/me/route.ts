import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic";

// Endpoint to get current instructure information from session
export async function GET(request: NextRequest) {
  console.log("Cookies in API:", request.cookies.getAll());
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        authenticated: false 
      }, { status: 401 });
    }
    
    console.log("Session user:", session.user);
    
    // Find user with instructure relationship
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        instructure: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: "User not found",
        authenticated: true,
        hasInstructureId: false
      }, { status: 404 });
    }
    
    // Check if user has an instructure ID
    if (!user.instructureId || !user.instructure) {
      return NextResponse.json({
        error: "User is not an instructor",
        authenticated: true,
        hasInstructureId: false,
        userType: user.userTypeId
      }, { status: 400 });
    }
    
    // Return instructure info
    return NextResponse.json({
      authenticated: true,
      hasInstructureId: true,
      instructure: {
        id: user.instructure.id,
        name: user.instructure.full_name,
        email: user.email,
        userId: user.id
      }
    });
    
  } catch (error) {
    console.error("Error getting current instructure:", error);
    return NextResponse.json({
      error: "Failed to get instructure info",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 