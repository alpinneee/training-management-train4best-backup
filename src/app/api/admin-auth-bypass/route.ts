import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[ADMIN-BYPASS] ${message}`, data ? JSON.stringify(data) : '');
}

export async function POST(req: Request) {
  try {
    // Dapatkan email dari request
    const { email } = await req.json();
    logDebug(`Admin bypass attempt for: ${email}`);
    
    if (!email) {
      logDebug('Missing email');
      return NextResponse.json({
        success: false,
        error: "Email diperlukan"
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
    
    // Verifikasi bahwa user adalah admin
    if (user.userType.usertype.toLowerCase() !== 'admin') {
      logDebug(`User is not admin: ${email}, userType: ${user.userType.usertype}`);
      return NextResponse.json({
        success: false,
        error: "User bukan admin"
      }, { status: 403 });
    }
    
    logDebug(`Admin user verified: ${email}`);
    
    // Buat token JWT khusus admin dengan masa berlaku panjang
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.username,
      userType: "Admin",
      isAdmin: true,
      timestamp: Date.now(),
      bypass: true
    };
    
    logDebug(`Creating admin bypass token:`, tokenPayload);
    
    const token = sign(
      tokenPayload,
      secret,
      { expiresIn: "30d" } // Token berlaku 30 hari
    );
    
    logDebug(`Admin bypass token generated, length: ${token.length}`);
    
    // Buat response dengan token
    const response = NextResponse.json({
      success: true,
      message: "Admin bypass berhasil",
      token: token.substring(0, 20) + "...", // Hanya tampilkan sebagian token untuk keamanan
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
    
    logDebug(`Admin bypass cookies set, returning response`);
    return response;
  } catch (error) {
    console.error("Error admin bypass:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal melakukan admin bypass",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 