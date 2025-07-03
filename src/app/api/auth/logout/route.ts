import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Clear all auth cookies
    const cookieStore = cookies();
    
    // Clear NextAuth cookies
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("next-auth.csrf-token");
    
    // Clear debug token
    cookieStore.delete("debug_token");
    
    // Clear other auth tokens
    cookieStore.delete("admin_token");
    cookieStore.delete("participant_token");
    cookieStore.delete("dashboard_token");
    cookieStore.delete("force_login");
    
    console.log("All authentication cookies cleared");
    
    const response = NextResponse.json({ 
      success: true,
      message: "Logged out successfully"
    });
    
    // Set expired cookies to ensure they're removed
    response.cookies.set("admin_token", "", { expires: new Date(0) });
    response.cookies.set("participant_token", "", { expires: new Date(0) });
    response.cookies.set("dashboard_token", "", { expires: new Date(0) });
    response.cookies.set("debug_token", "", { expires: new Date(0) });
    response.cookies.set("next-auth.session-token", "", { expires: new Date(0) });
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      success: false,
      message: "Error during logout"
    }, { status: 500 });
  }
} 