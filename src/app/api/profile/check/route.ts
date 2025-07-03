export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    // Get user from session
    const session = await getServerSession(authOptions);
    
    // Check for userEmail cookie
    const cookieStore = cookies();
    const userEmailCookie = cookieStore.get("userEmail");
    
    // Create the response
    let response;
    
    if (!session || !session.user) {
      // If no session, check if we have userEmail cookie
      if (userEmailCookie) {
        // Return a response with the email from cookie
        response = NextResponse.json(
          { 
            userType: 'unassigned',
            redirectToProfile: true,
            hasCompletedProfile: false,
            emailSource: 'cookie'
          }
        );
        
        // Add the email to the response header
        response.headers.set("X-User-Email", userEmailCookie.value);
        return response;
      }
      
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 }
      );
    }
    
    // Find the user to check role and participant profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { participant: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get user type
    const userType = await prisma.userType.findUnique({
      where: { id: user.userTypeId },
    });
    
    // Check if user needs to complete profile
    let redirectToProfile = false;
    
    // Conditions to redirect to profile:
    // 1. User has 'unassigned' role
    // 2. User doesn't have a participant profile
    // 3. User's participant profile has incomplete required fields
    if (userType?.usertype === 'unassigned') {
      redirectToProfile = true;
    } else if (!user.participant || user.participant.length === 0) {
      // If user doesn't have a participant profile yet and isn't an admin or instructor
      if (userType?.usertype !== 'admin' && userType?.usertype !== 'instructor') {
        redirectToProfile = true;
      }
    } else if (user.participant.length > 0) {
      // Check for incomplete required fields in participant profile
      const participant = user.participant[0];
      if (!participant.phone_number || !participant.address || !participant.gender) {
        redirectToProfile = true;
      }
    }
    
    response = NextResponse.json({
      userType: userType?.usertype || 'unassigned',
      redirectToProfile,
      hasCompletedProfile: !redirectToProfile,
      emailSource: 'session'
    });
    
    // Add user email to response header
    if (user.email) {
      response.headers.set("X-User-Email", user.email);
    }
    
    // Add username to response header
    if (user.username) {
      response.headers.set("X-Username", user.username);
    }
    
    return response;
    
  } catch (error) {
    console.error('Error checking profile:', error);
    return NextResponse.json(
      { error: "Failed to check profile status" },
      { status: 500 }
    );
  }
} 