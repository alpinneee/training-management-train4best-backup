import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get the user session or validate userId from query
    const session = await getServerSession(authOptions);
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId') || session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with user type and instructure relation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        userType: true,
        instructure: true
      }
    });

    // If not an instructure user, return no setup needed
    if (!user || user.userType.usertype !== "Instructure") {
      return NextResponse.json({ needsSetup: false });
    }

    // Check if instructure relation exists and profile is complete
    let needsSetup = true;
    let instructure = null;
    
    if (user.instructureId) {
      // Get the instructure directly
      instructure = user.instructure;
      
      if (instructure) {
        // Check if any required fields are empty
        needsSetup = !instructure.phone_number || 
                    !instructure.address || 
                    !instructure.profiency;
      }
    }

    return NextResponse.json({
      needsSetup,
      instructure
    });
  } catch (error) {
    console.error("Error checking instructure profile:", error);
    return NextResponse.json(
      { error: "Failed to check instructure profile" },
      { status: 500 }
    );
  }
} 