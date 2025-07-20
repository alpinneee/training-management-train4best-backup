import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    const { userId, fullName, phoneNumber, address, profiency } = await req.json();
    
    // Validate the user ID
    const authenticatedUserId = session?.user?.id;
    const targetUserId = userId || authenticatedUserId;
    
    if (!targetUserId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
    
    // Security check: Only allow users to update their own profile
    // unless they are an admin (could add this check)
    if (authenticatedUserId && authenticatedUserId !== targetUserId) {
      // Check if current user is admin
      const currentUser = await prisma.user.findUnique({
        where: { id: authenticatedUserId },
        include: { userType: true }
      });
      
      if (!currentUser || currentUser.userType.usertype !== "Admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Find the user and check if they're an instructure
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { 
        userType: true,
        instructure: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.userType.usertype !== "Instructure") {
      return NextResponse.json(
        { error: "User is not an instructure" },
        { status: 400 }
      );
    }
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      let instructureId = user.instructureId;
      let instructure;
      
      if (instructureId) {
        // Update existing instructure record
        instructure = await tx.instructure.update({
          where: { id: instructureId },
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            address,
            profiency
          }
        });
      } else {
        // Create new instructure record
        instructureId = uuidv4();
        instructure = await tx.instructure.create({
          data: {
            id: instructureId,
            full_name: fullName,
            phone_number: phoneNumber,
            address,
            profiency
          }
        });
        
        // Update user with instructureId
        await tx.user.update({
          where: { id: targetUserId },
          data: { instructureId }
        });
      }
      
      return instructure;
    });
    
    return NextResponse.json({
      success: true,
      instructure: result
    });
  } catch (error) {
    console.error("Error updating instructure profile:", error);
    return NextResponse.json(
      { error: "Failed to update instructure profile" },
      { status: 500 }
    );
  }
} 