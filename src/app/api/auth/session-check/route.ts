import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[SESSION-CHECK] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export async function GET(req: Request) {
  try {
    logDebug('Checking session status');
    
    // Check cookies for tokens
    const cookieStore = cookies();
    const dashboardToken = cookieStore.get("dashboard_token")?.value;
    const adminToken = cookieStore.get("admin_token")?.value;
    const debugToken = cookieStore.get("debug_token")?.value;
    const sessionToken = cookieStore.get("next-auth.session-token")?.value;
    
    logDebug(`Cookies: dashboardToken=${!!dashboardToken}, adminToken=${!!adminToken}, debugToken=${!!debugToken}, sessionToken=${!!sessionToken}`);
    
    // Try to verify tokens
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    let tokenValid = false;
    let userData = null;
    
    // Check dashboard token first (highest priority)
    if (dashboardToken) {
      try {
        const decoded = verify(dashboardToken, secret) as any;
        if (decoded) {
          logDebug("Dashboard token valid", decoded);
          tokenValid = true;
          userData = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            userType: decoded.userType
          };
        }
      } catch (error) {
        logDebug(`Dashboard token invalid: ${(error as Error).message}`);
      }
    }
    
    // If dashboard token not valid, check admin token
    if (!tokenValid && adminToken) {
      try {
        const decoded = verify(adminToken, secret) as any;
        if (decoded) {
          logDebug("Admin token valid", decoded);
          tokenValid = true;
          userData = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            userType: "Admin"
          };
        }
      } catch (error) {
        logDebug(`Admin token invalid: ${(error as Error).message}`);
      }
    }
    
    // If still not valid, check debug token
    if (!tokenValid && debugToken) {
      try {
        const decoded = verify(debugToken, secret) as any;
        if (decoded) {
          logDebug("Debug token valid", decoded);
          tokenValid = true;
          userData = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            userType: decoded.userType
          };
        }
      } catch (error) {
        logDebug(`Debug token invalid: ${(error as Error).message}`);
      }
    }
    
    // If still not valid, check session token
    if (!tokenValid && sessionToken) {
      try {
        const decoded = verify(sessionToken, secret) as any;
        if (decoded) {
          logDebug("Session token valid", decoded);
          tokenValid = true;
          userData = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            userType: decoded.userType
          };
        }
      } catch (error) {
        logDebug(`Session token invalid: ${(error as Error).message}`);
      }
    }
    
    // Return result
    if (tokenValid) {
      logDebug("Session check successful");
      return NextResponse.json({
        valid: true,
        user: userData
      });
    } else {
      logDebug("Session check failed, no valid token");
      return NextResponse.json({
        valid: false
      });
    }
  } catch (error) {
    console.error("Error checking session:", error);
    return NextResponse.json({
      valid: false,
      error: "Failed to check session",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 