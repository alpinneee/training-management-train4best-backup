import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[DASHBOARD-ACCESS] ${message}`, data ? JSON.stringify(data) : '');
}

export async function POST(req: Request) {
  try {
    // Dapatkan email dari request
    const { email, userType } = await req.json();
    logDebug(`Dashboard access attempt for: ${email}, userType: ${userType}`);
    
    if (!email || !userType) {
      logDebug('Missing email or userType');
      return NextResponse.json({
        success: false,
        error: "Email dan userType diperlukan"
      }, { status: 400 });
    }
    
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userType: true }
    });
    
    if (!user) {
      logDebug(`User not found: ${email}`);
      return NextResponse.json({
        success: false,
        error: "User tidak ditemukan"
      }, { status: 404 });
    }
    
    // Verifikasi bahwa userType sesuai
    if (user.userType.usertype.toLowerCase() !== userType.toLowerCase()) {
      logDebug(`User type mismatch: expected ${userType}, got ${user.userType.usertype}`);
      return NextResponse.json({
        success: false,
        error: "User type tidak sesuai"
      }, { status: 403 });
    }
    
    logDebug(`User verified: ${email}, userType: ${user.userType.usertype}`);
    
    // Buat token JWT khusus dengan masa berlaku panjang
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    
    // Format userType dengan benar
    let formattedUserType = user.userType.usertype;
    if (formattedUserType.toLowerCase() === 'admin') {
      formattedUserType = 'Admin';
    } else {
      formattedUserType = formattedUserType.charAt(0).toUpperCase() + formattedUserType.slice(1).toLowerCase();
    }
    
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.username,
      userType: formattedUserType,
      isAdmin: formattedUserType.toLowerCase() === 'admin',
      timestamp: Date.now(),
      bypass: true,
      dashboard_access: true
    };
    
    logDebug(`Creating dashboard access token:`, tokenPayload);
    
    const token = sign(
      tokenPayload,
      secret,
      { expiresIn: "30d" } // Token berlaku 30 hari
    );
    
    logDebug(`Dashboard access token generated, length: ${token.length}`);
    
    // Buat response dengan token
    const response = NextResponse.json({
      success: true,
      message: "Dashboard access granted",
      token: token.substring(0, 20) + "...", // Hanya tampilkan sebagian token untuk keamanan
      redirectUrl: "/dashboard-direct"
    });
    
    // Set semua cookie yang diperlukan
    response.cookies.set("dashboard_token", token, {
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
    
    // Jika user adalah admin, set juga admin_token
    if (formattedUserType.toLowerCase() === 'admin') {
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 hari
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
    }
    
    // Hapus cookie redirect_attempt jika ada
    response.cookies.set("redirect_attempt", "", { maxAge: 0 });
    
    logDebug(`Dashboard access cookies set, returning response`);
    return response;
  } catch (error) {
    console.error("Error dashboard access:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal memberikan akses dashboard",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 