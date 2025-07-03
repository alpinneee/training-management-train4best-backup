export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

// Endpoint untuk debugging sesi
export async function GET() {
  try {
    // Dapatkan sesi dari getServerSession
    const session = await getServerSession(authOptions);
    
    // Dapatkan token dari cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    
    let decodedToken = null;
    if (sessionToken) {
      // Decode token JWT dengan secret yang valid
      try {
        decodedToken = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT"
        });
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
        // Jika gagal decode, lanjutkan dengan token null
      }
    }
    
    // Mengembalikan informasi debug
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      session,
      hasToken: !!sessionToken,
      tokenPreview: sessionToken ? `${sessionToken.substring(0, 15)}...` : null,
      decodedToken
    });
  } catch (error) {
    console.error("Error debugging session:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error checking session",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 