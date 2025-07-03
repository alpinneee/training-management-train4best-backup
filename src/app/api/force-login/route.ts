import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[FORCE-LOGIN] ${message}`, data ? JSON.stringify(data) : '');
}

export async function GET(request: NextRequest) {
  try {
    // Get userType from query params
    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('userType') || 'admin';
    
    logDebug(`Force login attempt for userType: ${userType}`);
    
    // Create a JWT token
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    const token = jwt.sign(
      {
        id: "force-login-user-id",
        email: `force-${userType}@example.com`,
        name: `Force ${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
        userType: userType,
        isAdmin: userType.toLowerCase() === 'admin',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      secret
    );
    
    // Create response with token in cookies
    const response = NextResponse.json({
      success: true,
      message: `Force login successful as ${userType}`,
      user: {
        id: "force-login-user-id",
        email: `force-${userType}@example.com`,
        name: `Force ${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
        userType: userType,
      }
    });
    
    // Set multiple tokens to ensure one works
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    
    response.cookies.set("dashboard_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    
    response.cookies.set("debug_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    
    // Tentukan redirect URL berdasarkan userType
    let redirectUrl = "/dashboard-static";
    if (userType.toLowerCase() === 'admin') {
      redirectUrl = "/dashboard";
    } else if (userType.toLowerCase() === 'instructure') {
      redirectUrl = "/instructure/dashboard";
    } else if (userType.toLowerCase() === 'participant') {
      redirectUrl = "/participant/dashboard";
    }
    
    // Buat response dengan token
    const responseWithRedirect = NextResponse.json({
      success: true,
      message: "Force login successful",
      redirectUrl: redirectUrl
    });
    
    // Set semua cookie yang diperlukan dengan masa berlaku sangat panjang
    const maxAge = 365 * 24 * 60 * 60; // 1 tahun
    
    // Set semua cookie yang diperlukan
    responseWithRedirect.cookies.set("dashboard_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    responseWithRedirect.cookies.set("debug_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    responseWithRedirect.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Jika user adalah admin, set juga admin_token
    if (userType.toLowerCase() === 'admin') {
      responseWithRedirect.cookies.set("admin_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: maxAge,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
    }
    
    // Set cookie khusus untuk force login
    responseWithRedirect.cookies.set("force_login", "true", {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Hapus cookie redirect_attempt jika ada
    responseWithRedirect.cookies.set("redirect_attempt", "", { maxAge: 0 });
    
    logDebug(`Force login cookies set, returning response`);
    return responseWithRedirect;
  } catch (error) {
    console.error("Force login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create force login token",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get userType from body
    const body = await request.json();
    const userType = body.userType || 'admin';
    
    // Create a JWT token
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    const token = jwt.sign(
      {
        id: "force-login-user-id",
        email: `force-${userType}@example.com`,
        name: `Force ${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
        userType: userType,
        isAdmin: userType.toLowerCase() === 'admin',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      secret
    );
    
    // Create response with token in cookies
    const response = NextResponse.json({
      success: true,
      message: `Force login successful as ${userType}`,
      user: {
        id: "force-login-user-id",
        email: `force-${userType}@example.com`,
        name: `Force ${userType.charAt(0).toUpperCase() + userType.slice(1)} User`,
        userType: userType,
      }
    });
    
    // Set multiple tokens to ensure one works
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    
    response.cookies.set("dashboard_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    
    response.cookies.set("debug_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
    
    // Tentukan redirect URL berdasarkan userType
    let redirectUrl = "/dashboard-static";
    if (userType.toLowerCase() === 'admin') {
      redirectUrl = "/dashboard";
    } else if (userType.toLowerCase() === 'instructure') {
      redirectUrl = "/instructure/dashboard";
    } else if (userType.toLowerCase() === 'participant') {
      redirectUrl = "/participant/dashboard";
    }
    
    // Buat response dengan token
    const responseWithRedirect = NextResponse.json({
      success: true,
      message: "Force login successful",
      redirectUrl: redirectUrl
    });
    
    // Set semua cookie yang diperlukan dengan masa berlaku sangat panjang
    const maxAge = 365 * 24 * 60 * 60; // 1 tahun
    
    // Set semua cookie yang diperlukan
    responseWithRedirect.cookies.set("dashboard_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    responseWithRedirect.cookies.set("debug_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    responseWithRedirect.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Jika user adalah admin, set juga admin_token
    if (userType.toLowerCase() === 'admin') {
      responseWithRedirect.cookies.set("admin_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: maxAge,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
    }
    
    // Set cookie khusus untuk force login
    responseWithRedirect.cookies.set("force_login", "true", {
      httpOnly: true,
      path: "/",
      maxAge: maxAge,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Hapus cookie redirect_attempt jika ada
    responseWithRedirect.cookies.set("redirect_attempt", "", { maxAge: 0 });
    
    logDebug(`Force login cookies set, returning response`);
    return responseWithRedirect;
  } catch (error) {
    console.error("Force login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create force login token",
      },
      { status: 500 }
    );
  }
} 