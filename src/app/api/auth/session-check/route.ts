import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { verify } from 'jsonwebtoken';
export const dynamic = "force-dynamic";

function logDebug(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SESSION-CHECK] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

export async function GET(req: NextRequest) {
  try {
    logDebug('Checking session status');
    
    // Check cookies for tokens
    const cookieStore = cookies();
    const dashboardToken = cookieStore.get("dashboard_token")?.value;
    const adminToken = cookieStore.get("admin_token")?.value;
    const participantToken = cookieStore.get("participant_token")?.value;
    const nextAuthToken = cookieStore.get("next-auth.session-token")?.value || 
                         cookieStore.get("__Secure-next-auth.session-token")?.value;
    
    logDebug(`Cookies: dashboardToken=${!!dashboardToken}, adminToken=${!!adminToken}, nextAuthToken=${!!nextAuthToken}, participantToken=${!!participantToken}`);
    
    // Try to verify tokens
    const secret = process.env.NEXTAUTH_SECRET || "ee242735312254106fe3e96a49c7439e224a303ff71c148eee211ee52b6df1719d261fbf28697c6375bfa1ff473b328d31659d6308da93ea03ae630421a8024e";
    let tokenValid = false;
    let userData = null;
    
    // Try NextAuth token first (highest priority)
    if (nextAuthToken) {
      try {
        // Use NextAuth's getToken helper which handles decryption if needed
        const token = await getToken({ 
          req,
          secret
        });
        
        if (token) {
          logDebug("NextAuth token valid", token);
          tokenValid = true;
          userData = {
            id: token.id,
            email: token.email,
            name: token.name,
            userType: token.userType
          };
        }
      } catch (error) {
        logDebug(`NextAuth token invalid: ${(error as Error).message}`);
      }
    }
    
    // Check dashboard token if NextAuth token not valid
    if (!tokenValid && dashboardToken) {
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
    
    // Check admin token if still not valid
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
    
    // Check participant token if still not valid
    if (!tokenValid && participantToken) {
      try {
        const decoded = verify(participantToken, secret) as any;
        if (decoded) {
          logDebug("Participant token valid", decoded);
          tokenValid = true;
          userData = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            userType: "Participant"
          };
        }
      } catch (error) {
        logDebug(`Participant token invalid: ${(error as Error).message}`);
      }
    }
    
    if (tokenValid && userData) {
      return NextResponse.json({
        isAuthenticated: true,
        ...userData
      });
    } else {
      return NextResponse.json({
        isAuthenticated: false
      });
    }
  } catch (error) {
    logDebug(`Error in session check: ${(error as Error).message}`);
    return NextResponse.json({ 
      isAuthenticated: false, 
      error: 'Session check failed' 
    }, { status: 500 });
  }
} 