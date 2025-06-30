export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Ambil userType dari query params (default: admin)
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email') || 'admin@example.com';
    
    console.log(`Admin fix attempt for: ${email}`);
    
    // Buat token JWT khusus admin
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    
    const tokenPayload = {
      id: "admin-fix-id",
      email: email,
      name: "Admin User",
      userType: "Admin",
      isAdmin: true,
      timestamp: Date.now()
    };
    
    const token = sign(
      tokenPayload,
      secret,
      { expiresIn: "30d" } // Token berlaku 30 hari
    );
    
    // Buat response dengan token
    const response = NextResponse.json({
      success: true,
      message: "Admin cookies fixed",
      redirectUrl: "/user"
    });
    
    // Set semua cookie yang diperlukan
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    response.cookies.set("debug_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Hapus cookie redirect_attempt jika ada
    response.cookies.set("redirect_attempt", "", { maxAge: 0 });
    
    return response;
  } catch (error) {
    console.error("Error admin fix:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal memperbaiki cookie admin",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 