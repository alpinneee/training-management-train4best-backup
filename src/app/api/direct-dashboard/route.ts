export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[DIRECT-DASHBOARD] ${message}`, data ? JSON.stringify(data) : '');
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userType = url.searchParams.get('userType') || 'Admin';
    const email = url.searchParams.get('email') || 'admin@example.com';
    
    logDebug(`Direct dashboard access attempt for: ${email}, userType: ${userType}`);
    
    // Buat token JWT khusus dengan masa berlaku panjang
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    
    // Format userType dengan benar
    let formattedUserType = userType;
    if (formattedUserType.toLowerCase() === 'admin') {
      formattedUserType = 'Admin';
    } else {
      formattedUserType = formattedUserType.charAt(0).toUpperCase() + formattedUserType.slice(1).toLowerCase();
    }
    
    const tokenPayload = {
      id: "direct-access-" + Date.now(),
      email: email,
      name: "Direct Access User",
      userType: formattedUserType,
      isAdmin: formattedUserType.toLowerCase() === 'admin',
      timestamp: Date.now(),
      bypass: true,
      dashboard_access: true
    };
    
    logDebug(`Creating direct dashboard token:`, tokenPayload);
    
    const token = sign(
      tokenPayload,
      secret,
      { expiresIn: "30d" } // Token berlaku 30 hari
    );
    
    // Tentukan redirect URL berdasarkan userType
    let redirectUrl = "/dashboard-static";
    if (formattedUserType.toLowerCase() === 'admin') {
      redirectUrl = "/admin-dashboard"; // Gunakan halaman khusus untuk admin
    } else if (formattedUserType.toLowerCase() === 'instructure') {
      redirectUrl = "/instructure-dashboard"; // Gunakan halaman khusus untuk instructure
    } else if (formattedUserType.toLowerCase() === 'participant') {
      redirectUrl = "/participant-dashboard"; // Gunakan halaman khusus untuk participant
    }
    
    // Buat response dengan token
    const response = NextResponse.json({
      success: true,
      message: "Direct dashboard access granted",
      redirectUrl: redirectUrl
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
    
    logDebug(`Direct dashboard cookies set, returning response`);
    return response;
  } catch (error) {
    console.error("Error direct dashboard access:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal memberikan akses dashboard",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 