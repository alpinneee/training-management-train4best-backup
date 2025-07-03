export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth/next";

export async function GET() {
  try {
    // Get the debug_token
    const debugToken = cookies().get("debug_token")?.value;
    let debugTokenData = null;
    
    if (debugToken) {
      try {
        debugTokenData = jwt.verify(
          debugToken,
          process.env.NEXTAUTH_SECRET || "rahasia_debug"
        );
      } catch (error) {
        console.error("Failed to verify debug token:", error);
      }
    }
    
    // Get session cookies for debugging
    const sessionCookies = {
      debugToken: cookies().get("debug_token")?.value ? "Present" : "Not found",
      sessionToken: cookies().get("next-auth.session-token")?.value ? "Present" : "Not found",
      csrfToken: cookies().get("next-auth.csrf-token")?.value ? "Present" : "Not found",
      callbackUrl: cookies().get("next-auth.callback-url")?.value ? "Present" : "Not found",
    };
    
    // Return all debug information
    return NextResponse.json({
      debugToken: (debugTokenData && typeof debugTokenData === 'object' && 'userType' in debugTokenData) ? {
        userType: debugTokenData.userType,
        email: debugTokenData.email,
        id: debugTokenData.id,
        exp: debugTokenData.exp,
      } : null,
      cookies: sessionCookies,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ 
      error: "An error occurred",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 