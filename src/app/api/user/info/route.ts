export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Get email from query parameter
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching user info for email: ${email}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        userTypeId: true,
        userType: {
          select: {
            usertype: true
          }
        }
      }
    });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Return basic user info
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      userType: user.userType?.usertype || 'unassigned'
    });
    
  } catch (error) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
} 