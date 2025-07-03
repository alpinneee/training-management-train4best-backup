import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sign, verify } from "jsonwebtoken";

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[REFRESH] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export async function GET(req: Request) {
  try {
    // Get the redirect URL from query params
    const { searchParams } = new URL(req.url);
    const redirectPath = searchParams.get('redirect') || '/';
    
    logDebug(`Token refresh requested with redirect to: ${redirectPath}`);
    
    // Get cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    const debugToken = cookieStore.get("debug_token")?.value;
    const adminToken = cookieStore.get("admin_token")?.value;
    
    logDebug(`Cookies found: sessionToken=${!!sessionToken}, debugToken=${!!debugToken}, adminToken=${!!adminToken}`);
    
    // Check if we have any token
    if (!sessionToken && !debugToken && !adminToken) {
      logDebug(`No tokens found, redirecting to login`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // Try to verify and refresh the token
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    const token = adminToken || debugToken || sessionToken;
    
    try {
      // Verify the token
      const decoded = verify(token as string, secret) as any;
      logDebug(`Token verified successfully`, decoded);
      
      // Jika token valid dan user adalah admin dan mencoba akses dashboard, redirect ke user
      if (decoded.userType && decoded.userType.toLowerCase() === 'admin' && 
          (redirectPath === '/dashboard' || redirectPath === '/dashboard/')) {
        logDebug(`Admin user trying to access dashboard, redirecting to /user`);
        return NextResponse.redirect(new URL("/user", req.url));
      }
      
      // If token is valid, just redirect to the original path
      // We don't need to refresh it if it's still valid
      logDebug(`Token is valid, redirecting to: ${redirectPath}`);
      
      // Create response with redirect
      const response = NextResponse.redirect(new URL(redirectPath, req.url));
      
      return response;
    } catch (verifyError) {
      logDebug(`Token verification failed: ${(verifyError as Error).message}`);
      
      try {
        // Try to decode without verification to get user info
        const decodedWithoutVerify = JSON.parse(Buffer.from(token!.split('.')[1], 'base64').toString());
        logDebug(`Decoded token payload without verification:`, decodedWithoutVerify);
        
        if (decodedWithoutVerify && decodedWithoutVerify.id && decodedWithoutVerify.userType) {
          // Pastikan format userType konsisten
          let userType = decodedWithoutVerify.userType;
          
          // Penanganan khusus untuk Admin
          if (typeof userType === 'string' && userType.toLowerCase() === 'admin') {
            userType = 'Admin'; // Pastikan format Admin dengan A kapital
            logDebug(`Normalized Admin userType to: ${userType}`);
            
            // Jika admin mencoba akses dashboard, redirect ke user
            if (redirectPath === '/dashboard' || redirectPath === '/dashboard/') {
              logDebug(`Admin user trying to access dashboard, redirecting to /user`);
              return NextResponse.redirect(new URL("/user", req.url));
            }
          }
          
          // Create a new token
          const newToken = sign(
            {
              id: decodedWithoutVerify.id,
              email: decodedWithoutVerify.email,
              name: decodedWithoutVerify.name,
              userType: userType,
              isAdmin: userType.toLowerCase() === 'admin' // Add isAdmin flag
            },
            secret,
            { expiresIn: "1d" }
          );
          
          logDebug(`New token created`);
          
          // Create response with redirect
          const response = NextResponse.redirect(new URL(redirectPath, req.url));
          
          // Set the new token in cookies
          response.cookies.set("debug_token", newToken, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
          });
          
          response.cookies.set("next-auth.session-token", newToken, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
          });
          
          // If user is admin, set admin_token too
          if (userType.toLowerCase() === 'admin') {
            const adminToken = sign(
              {
                id: decodedWithoutVerify.id,
                email: decodedWithoutVerify.email,
                name: decodedWithoutVerify.name,
                userType: 'Admin',
                isAdmin: true,
                timestamp: Date.now()
              },
              secret,
              { expiresIn: "7d" }
            );
            
            response.cookies.set("admin_token", adminToken, {
              httpOnly: true,
              path: "/",
              maxAge: 7 * 24 * 60 * 60, // 7 days
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production"
            });
            
            logDebug(`Admin token set`);
          }
          
          logDebug(`New cookies set, redirecting to: ${redirectPath}`);
          return response;
        }
      } catch (decodeError) {
        logDebug(`Failed to decode token: ${(decodeError as Error).message}`);
      }
      
      // If we can't refresh the token, redirect to login
      logDebug(`Cannot refresh token, redirecting to login`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } catch (error) {
    logDebug(`Error in refresh route: ${(error as Error).message}`);
    return NextResponse.redirect(new URL("/login", req.url));
  }
} 