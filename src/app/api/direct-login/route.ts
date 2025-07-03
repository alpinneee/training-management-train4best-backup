import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
}

export async function POST(req: Request) {
  try {
    // Dapatkan email dan password dari request
    const { email, password } = await req.json();
    logDebug(`Login attempt for: ${email}`);
    
    if (!email || !password) {
      logDebug('Missing email or password');
      return NextResponse.json({
        success: false,
        error: "Email dan password diperlukan"
      }, { status: 400 });
    }
    
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userType: true, participant: true }
    });
    
    if (!user) {
      logDebug(`User not found: ${email}`);
      return NextResponse.json({
        success: false,
        error: "User tidak ditemukan"
      }, { status: 404 });
    }
    
    logDebug(`User found: ${email}, userType: ${user.userType.usertype}`);
    
    // Verifikasi password
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      logDebug(`Invalid password for: ${email}`);
      return NextResponse.json({
        success: false,
        error: "Password tidak valid"
      }, { status: 401 });
    }
    
    logDebug(`Password valid for: ${email}`);
    
    // Pastikan userType dalam format yang konsisten (kapital di awal)
    let userTypeFormatted = user.userType.usertype;
    
    // Penanganan khusus untuk tipe Admin
    if (userTypeFormatted.toLowerCase() === 'admin') {
      userTypeFormatted = 'Admin'; // Pastikan format Admin dengan A kapital
    } else if (userTypeFormatted.toLowerCase() === 'participant') {
      userTypeFormatted = 'Participant'; // Pastikan format Participant dengan P kapital
      // Add extra log to debug participant login
      logDebug(`Participant user detected, userType: ${userTypeFormatted}`);
    } else {
      // Format lainnya (kapital di awal)
      userTypeFormatted = userTypeFormatted.charAt(0).toUpperCase() + userTypeFormatted.slice(1).toLowerCase();
    }
    
    logDebug(`Formatted userType: ${userTypeFormatted} (original: ${user.userType.usertype})`);
    
    // Buat token JWT manual dengan secret yang valid
    const secret = process.env.NEXTAUTH_SECRET || "e78d5a16cb1781adedf7dec940c51b54c97009a615dc7bafe078cb82c1b17fac";
    logDebug(`Using secret: ${secret.substring(0, 5)}...`);
    
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.username,
      userType: userTypeFormatted
    };
    
    logDebug(`Token payload:`, tokenPayload);
    
    const token = sign(
      tokenPayload,
      secret,
      { expiresIn: "1d" }
    );
    
    logDebug(`Token generated, length: ${token.length}`);
    
    // Tentukan redirect URL berdasarkan userType
    let redirectUrl = '/dashboard';
    const userTypeLower = userTypeFormatted.toLowerCase();
    
    if (userTypeLower === 'admin') {
      redirectUrl = '/dashboard'; // Admin ke dashboard
      logDebug(`Admin user, setting redirect URL to: ${redirectUrl}`);
    } else if (userTypeLower === 'instructure') {
      redirectUrl = '/instructure/dashboard';
      logDebug(`Instructure user, setting redirect URL to: ${redirectUrl}`);
    } else if (userTypeLower === 'participant') {
      // Cek apakah user sudah memiliki profil lengkap
      if (user.participant && user.participant.length > 0) {
        redirectUrl = '/participant/dashboard';
        logDebug(`Participant user with complete profile, setting redirect URL to: ${redirectUrl}`);
      } else {
        // Jika belum memiliki profil lengkap, arahkan ke halaman profil
        redirectUrl = '/profile';
        logDebug(`Participant user without complete profile, redirecting to profile page: ${redirectUrl}`);
      }
      
      console.log(`CRITICAL: Participant user ${user.email} is being redirected to ${redirectUrl}`);
    } else if (userTypeLower === 'unassigned') {
      // Redirect unassigned users to profile page to complete their profile
      redirectUrl = '/profile';
      logDebug(`Unassigned user, redirecting to profile page: ${redirectUrl}`);
    }
    
    logDebug(`Redirect URL set to: ${redirectUrl} for userType: ${userTypeFormatted}`);
    
    // Kembalikan info user dan token dengan header redirect
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        userType: userTypeFormatted,
        hasProfile: user.participant && user.participant.length > 0
      },
      redirectUrl // Include redirect URL in the response body
    });
    
    // Store user email in cookie for all users to ensure profile page can access it
    response.cookies.set("userEmail", user.email, {
      httpOnly: false, // Allow JavaScript access
      path: "/",
      maxAge: 3600, // 1 hour
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Also store username in cookie
    response.cookies.set("username", user.username, {
      httpOnly: false, // Allow JavaScript access
      path: "/",
      maxAge: 3600, // 1 hour
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Add a script to store email and username in localStorage
    const storageScript = `
      localStorage.setItem('userEmail', '${user.email}');
      localStorage.setItem('username', '${user.username}');
      console.log('Stored user data in localStorage:', { email: '${user.email}', username: '${user.username}' });
    `;
    
    // Set a cookie with the script to execute
    response.headers.set(
      "Set-Cookie", 
      `login_success=true; Path=/; Max-Age=60; userEmailScript=${encodeURIComponent(storageScript)}`
    );
    
    // Add headers with the email and username for the frontend to use
    response.headers.set("X-User-Email", user.email);
    response.headers.set("X-Username", user.username);
    
    logDebug(`Set user cookies for user: ${user.email}`);
    
    // Store user email in cookie if user is unassigned
    if (userTypeLower === 'unassigned') {
      logDebug(`Unassigned user, special handling for: ${user.email}`);
    }
    
    // Log untuk debugging khusus admin
    if (userTypeLower === 'admin') {
      logDebug(`ADMIN LOGIN: Setting up cookies and headers for admin user: ${user.email}`);
      logDebug(`ADMIN LOGIN: Redirect URL: ${redirectUrl}`);
    }
    
    // Hapus cookie lama jika ada untuk menghindari konflik
    response.cookies.set("debug_token", "", { maxAge: 0 });
    response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    response.cookies.set("redirect_attempt", "", { maxAge: 0 });
    response.cookies.set("admin_token", "", { maxAge: 0 });
    
    logDebug(`Old cookies cleared`);
    
    // Penanganan khusus untuk admin
    if (userTypeLower === 'admin') {
      // Buat token khusus admin dengan expiry yang lebih lama
      const adminToken = sign(
        {
          ...tokenPayload,
          isAdmin: true,
          timestamp: Date.now()
        },
        secret,
        { expiresIn: "7d" } // Token admin berlaku 7 hari
      );
      
      // Set cookie admin_token
      response.cookies.set("admin_token", adminToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 hari
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      // Set juga cookie biasa untuk kompatibilitas
      response.cookies.set("debug_token", adminToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 hari
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      response.cookies.set("next-auth.session-token", adminToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 hari
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      logDebug(`ADMIN LOGIN: Special admin cookies set`);
    } else if (userTypeLower === 'participant') {
      // Set participant-specific cookies
      console.log(`Setting participant-specific cookies for user: ${user.email}`);
      
      const participantToken = sign(
        {
          ...tokenPayload,
          isParticipant: true,
          timestamp: Date.now()
        },
        secret,
        { expiresIn: "3d" } // Token participant berlaku 3 hari
      );
      
      // Set cookie participant_token
      response.cookies.set("participant_token", participantToken, {
        httpOnly: true,
        path: "/",
        maxAge: 3 * 24 * 60 * 60, // 3 hari
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      // Set also standard cookies
      response.cookies.set("debug_token", participantToken, {
        httpOnly: true,
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      response.cookies.set("next-auth.session-token", participantToken, {
        httpOnly: true,
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      console.log(`Participant cookies set for: ${user.email}`);
    } else {
      // Set cookie debug_token untuk non-admin
      response.cookies.set("debug_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 1 hari
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
      
      // Set cookie untuk next-auth juga sebagai fallback
      response.cookies.set("next-auth.session-token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
      });
    }
    
    logDebug(`Cookies set: debug_token and next-auth.session-token`);
    
    // Set header untuk redirect
    response.headers.set(
      "Set-Cookie", 
      `login_success=true; Path=/; Max-Age=60;`
    );
    
    // Tambahkan info redirect URL ke respons header
    response.headers.set("X-Redirect-URL", redirectUrl);
    
    // Log khusus admin
    if (userTypeLower === 'admin') {
      logDebug(`ADMIN LOGIN: Final response headers:`, Object.fromEntries(response.headers.entries()));
      logDebug(`ADMIN LOGIN: Final cookies:`, response.cookies);
    }
    
    logDebug(`Response headers set, returning response`);
    return response;
  } catch (error) {
    console.error("Error login:", error);
    return NextResponse.json({
      success: false,
      error: "Gagal melakukan login",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 