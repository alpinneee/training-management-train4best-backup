export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    console.log("Current user API called");
    
    // Ambil data dari berbagai sumber autentikasi
    let userData = null;
    let userId = null;
    let userEmail = null;
    
    // 1. Coba dari URL query parameter (untuk compatibility)
    const url = new URL(req.url);
    const emailParam = url.searchParams.get('email');
    
    if (emailParam) {
      console.log(`Email parameter found: ${emailParam}`);
      userEmail = emailParam;
    }
    
    // 2. Coba dari session NextAuth
    if (!userData) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          console.log("User found in NextAuth session");
          userId = session.user.id;
          userEmail = userEmail || session.user.email;
        }
      } catch (sessionError) {
        console.log("NextAuth session error:", sessionError);
      }
    }
    
    // 3. Coba dari debug token
    if (!userId) {
      try {
        const cookieStore = cookies();
        const debugToken = cookieStore.get("debug_token")?.value;
        
        if (debugToken) {
          const decoded = jwt.verify(
            debugToken, 
            process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT"
          );
          
          if (decoded && typeof decoded === 'object') {
            console.log("User found in debug token");
            userId = decoded.id as string;
            userEmail = userEmail || decoded.email as string;
          }
        }
      } catch (tokenError) {
        console.log("Debug token error:", tokenError);
      }
    }
    
    // 4. Coba dari session token
    if (!userId && !userEmail) {
      try {
        const cookieStore = cookies();
        const sessionToken = cookieStore.get("next-auth.session-token")?.value;
        
        if (sessionToken) {
          const decoded = await decode({
            token: sessionToken,
            secret: process.env.NEXTAUTH_SECRET || ""
          });
          
          if (decoded) {
            console.log("User found in session token");
            userId = decoded.id as string;
            userEmail = userEmail || decoded.email as string;
          }
        }
      } catch (tokenError) {
        console.log("Session token error:", tokenError);
      }
    }
    
    // Jika tidak ada user ID atau email, kembalikan error
    if (!userId && !userEmail) {
      console.log("No user identification found");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Cari user di database
    let user = null;
    
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          participant: true,
          userType: true
        }
      });
    }
    
    if (!user && userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          participant: true,
          userType: true
        }
      });
    }
    
    if (!user) {
      console.log("User not found in database");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Format respons
    const participantData = user.participant && user.participant.length > 0 
      ? user.participant[0] 
      : null;
    
    console.log(`User data found for ${user.email}`);
    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: user.userType.usertype,
        participant: participantData ? {
          id: participantData.id,
          fullName: participantData.full_name,
          gender: participantData.gender,
          phone_number: participantData.phone_number,
          address: participantData.address,
          birth_date: participantData.birth_date,
          job_title: participantData.job_title,
          company: participantData.company
        } : null,
        hasParticipantProfile: !!participantData
      }
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 }
    );
  }
} 