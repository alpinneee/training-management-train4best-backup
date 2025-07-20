import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    console.log("Debug instructure login API called");
    
    // Find the debug instructure user
    const user = await prisma.user.findUnique({
      where: { email: "debug.instructure@example.com" },
      include: {
        userType: true,
        instructure: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Debug instructure user not found" },
        { status: 404 }
      );
    }

    // Create a session token
    const secret = process.env.NEXTAUTH_SECRET || "RAHASIA_FALLBACK_YANG_AMAN_DAN_PANJANG_UNTUK_DEVELOPMENT";
    const token = sign(
      {
        id: user.id,
        email: user.email,
        name: user.username,
        userType: user.userType.usertype
      },
      secret,
      { expiresIn: '1d' }
    );

    // Set cookies
    const cookieStore = cookies();
    cookieStore.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/"
    });
    
    cookieStore.set("debug_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/"
    });
    
    // Set cookies for client-side use
    cookieStore.set("userEmail", user.email, {
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/"
    });
    
    cookieStore.set("userName", user.username, {
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/"
    });

    console.log("[DEBUG] Cookies set: debug_token and next-auth.session-token");

    // Redirect to dashboard
    const response = NextResponse.redirect(new URL('/instructure/dashboard', request.url));
    
    // Add script to set localStorage
    const html = `
      <html>
        <head>
          <title>Redirecting...</title>
          <script>
            localStorage.setItem('userEmail', '${user.email}');
            localStorage.setItem('userName', '${user.username}');
            window.location.href = '/instructure/dashboard';
          </script>
        </head>
        <body>
          <p>Redirecting to dashboard...</p>
        </body>
      </html>
    `;
    
    return new Response(html, {
      headers: {
        "Content-Type": "text/html"
      }
    });
  } catch (error) {
    console.error("Error logging in debug instructure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to login debug instructure" },
      { status: 500 }
    );
  }
} 