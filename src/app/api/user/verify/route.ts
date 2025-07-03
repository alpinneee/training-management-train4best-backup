export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ 
        valid: false, 
        message: "Email parameter is required" 
      }, { status: 400 });
    }
    
    // Find user in the database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        participant: true,
        userType: true
      }
    });
    
    if (user) {
      // Return success with user info
      return NextResponse.json({
        valid: true,
        username: user.username,
        userType: user.userType?.usertype,
        hasProfile: user.participant && user.participant.length > 0
      });
    } else {
      // User not found
      return NextResponse.json({ 
        valid: false,
        message: "User not found" 
      });
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json({ 
      valid: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
} 