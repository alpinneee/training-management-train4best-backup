import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { NextRequestWithAuth } from "next-auth/middleware"
import jwt from "jsonwebtoken"
import type { NextRequest } from 'next/server'

// Fungsi untuk logging
console.log('=== MIDDLEWARE MASUK ===');
function logDebug(message: string, data?: any) {
  console.log(`[MIDDLEWARE] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Daftar rute publik yang tidak memerlukan autentikasi


// Rute yang hanya bisa diakses admin
const adminRoutes = [
  '/user',
  '/usertype',
  '/user-rule',
  '/instructure', // Halaman manajemen instructor
  '/courses',
  '/course-type',
  '/course-schedule',
  '/payment-report',
  '/list-certificate',
  '/certificate-expired',
  '/participant',
  '/dashboard'  // Admin boleh mengakses dashboard
];

// Rute untuk instructor
const instructorRoutes = [
  '/instructure/dashboard',
  '/instructure/courses', 
  '/instructure/students', 
  '/instructure/assignment'
];

// Rute untuk participant
const participantRoutes = [
  '/participant/dashboard',
  '/participant/my-course',
  '/participant/my-certificate',
  '/participant/payment'
];

export default async function middleware(request: NextRequest) {
  // Handle special headers for localStorage
  const userEmail = request.headers.get('X-User-Email');
  const userName = request.headers.get('X-User-Name');
  const response = NextResponse.next();
  
  if (userEmail) {
    response.cookies.set('userEmail', userEmail, {
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
  }
  
  if (userName) {
    response.cookies.set('userName', userName, {
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
  }

  // Skip auth check for routes that only need header processing
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/favicon.ico') ||
      request.nextUrl.pathname.startsWith('/img')) {
    return response;
  }

  const path = request.nextUrl.pathname;
  logDebug(`Middleware dipanggil untuk path: ${path}`);

  // Izinkan akses ke rute publik tanpa autentikasi


  try {
    // Cek apakah ini adalah percobaan login berulang untuk mencegah loop
    const isRedirectLoop = request.cookies.get("redirect_attempt")?.value === "true";
    if (isRedirectLoop) {
      logDebug(`Terdeteksi redirect loop untuk ${path}, membersihkan cookies dan melanjutkan`);
      response.cookies.set("redirect_attempt", "", { maxAge: 0 });
      return response;
    }

    // Cek token dari berbagai sumber
    const adminToken = request.cookies.get("admin_token")?.value;
    const dashboardToken = request.cookies.get("dashboard_token")?.value;
    const debugToken = request.cookies.get("debug_token")?.value;
    const participantToken = request.cookies.get("participant_token")?.value;
    
    // Coba verifikasi token
    const secret = process.env.NEXTAUTH_SECRET || "ee242735312254106fe3e96a49c7439e224a303ff71c148eee211ee52b6df1719d261fbf28697c6375bfa1ff473b328d31659d6308da93ea03ae630421a8024e";
    let userType = null;
    let userId = null;
    let userEmail = null;

    // Cek semua token yang tersedia
    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, secret) as jwt.JwtPayload;
        if (decoded) {
          logDebug(`Admin token valid`);
          userType = "Admin";
          userId = decoded.id;
          userEmail = decoded.email;
        }
      } catch (error) {
        logDebug(`Admin token invalid: ${(error as Error).message}`);
      }
    }

    // Check participant token if no admin token found
    if (!userType && participantToken) {
      try {
        const decoded = jwt.verify(participantToken, secret) as jwt.JwtPayload;
        if (decoded) {
          logDebug(`Participant token valid`);
          userType = "Participant";
          userId = decoded.id;
          userEmail = decoded.email;
        }
      } catch (error) {
        logDebug(`Participant token invalid: ${(error as Error).message}`);
      }
    }

    if (!userType && dashboardToken) {
      try {
        const decoded = jwt.verify(dashboardToken, secret) as jwt.JwtPayload;
        if (decoded) {
          logDebug(`Dashboard token valid`);
          userType = decoded.userType;
          userId = decoded.id;
          userEmail = decoded.email;
        }
      } catch (error) {
        logDebug(`Dashboard token invalid: ${(error as Error).message}`);
      }
    }

    if (!userType && debugToken) {
      try {
        const decoded = jwt.verify(debugToken, secret) as jwt.JwtPayload;
        if (decoded) {
          logDebug(`Debug token valid`);
          userType = decoded.userType;
          userId = decoded.id;
          userEmail = decoded.email;
        }
      } catch (error) {
        logDebug(`Debug token invalid: ${(error as Error).message}`);
      }
    }

    if (!userType) {
      try {
        const token = await getToken({ 
          req: request,
          secret: secret
        });
        
        if (token) {
          logDebug(`NextAuth token valid`);
          userType = token.userType as string;
          userId = token.id as string;
          userEmail = token.email as string;
        }
      } catch (error) {
        logDebug(`Error saat verifikasi NextAuth token: ${(error as Error).message}`);
      }
    }

    // Jika tidak ada token valid, redirect ke login
    if (!userType) {
      logDebug(`Tidak ada token valid untuk ${path}, redirect ke login`);
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
      redirectResponse.cookies.set("redirect_attempt", "true", { maxAge: 60 });
      return redirectResponse;
    }

    // Verifikasi akses berdasarkan userType
    const userTypeLower = typeof userType === 'string' ? userType.toLowerCase() : '';
    logDebug(`User type: ${userTypeLower}, path: ${path}`);

    // Cek akses berdasarkan tipe pengguna
    if (userTypeLower === 'admin') {
      // Admin dapat mengakses semua rute admin
      if (adminRoutes.some(route => path === route || path.startsWith(route + '/'))) {
        logDebug(`Admin mengakses rute admin: ${path}, akses diizinkan`);
        return response;
      } else {
        logDebug(`Admin mencoba akses non-admin route: ${path}, redirect ke /dashboard`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else if (userTypeLower === 'instructure') {
      // Instructor hanya dapat mengakses rute instructor
      if (instructorRoutes.some(route => path === route || path.startsWith(route + '/'))) {
        logDebug(`Instructor mengakses rute instructor: ${path}, akses diizinkan`);
        return response;
      } else {
        logDebug(`Instructor mencoba akses non-instructor route: ${path}, redirect ke /instructure-dashboard`);
        return NextResponse.redirect(new URL('/instructure-dashboard', request.url));
      }
    } else if (userTypeLower === 'participant') {
      // Participant hanya dapat mengakses rute participant
      if (participantRoutes.some(route => path === route || path.startsWith(route + '/'))) {
        logDebug(`Participant mengakses rute participant: ${path}, akses diizinkan`);
        return response;
      } else {
        logDebug(`Participant mencoba akses non-participant route: ${path}, redirect ke /participant-dashboard`);
        return NextResponse.redirect(new URL('/participant-dashboard', request.url));
      }
    }

    // Jika tidak memiliki akses yang sesuai, redirect ke dashboard berdasarkan userType
    let redirectPath = '/dashboard-static';
    if (userTypeLower === 'admin') redirectPath = '/dashboard';
    if (userTypeLower === 'instructure') redirectPath = '/instructure-dashboard';
    if (userTypeLower === 'participant') redirectPath = '/participant-dashboard';
    if (userTypeLower === 'unassigned') redirectPath = '/profile';

    logDebug(`User ${userTypeLower} tidak memiliki akses ke ${path}, redirect ke ${redirectPath}`);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error) {
    logDebug(`Error dalam middleware: ${(error as Error).message}`);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Konfigurasi rute yang akan diproteksi oleh middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}; 