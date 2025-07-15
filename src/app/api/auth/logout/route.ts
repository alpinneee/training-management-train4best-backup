import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // Get all cookies
    const cookieStore = cookies();
    
    // List all potential authentication cookies to clear
    const authCookies = [
      // NextAuth cookies
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      
      // Custom auth tokens
      'admin_token',
      'dashboard_token',
      'participant_token',
      'debug_token',
      
      // Other auth-related cookies
      'userEmail',
      'userName',
      'redirect_attempt'
    ];
    
    // Create response
    const response = NextResponse.json({ 
      success: true,
      message: 'All authentication cookies cleared' 
    });
    
    // Clear all auth cookies
    for (const cookieName of authCookies) {
      if (cookieStore.get(cookieName)) {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to logout properly',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also handle GET for compatibility
export async function GET() {
  return POST(new Request('https://example.com'));
} 