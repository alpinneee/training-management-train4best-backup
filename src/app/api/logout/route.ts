export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    
    // Remove all authentication-related cookies
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("debug_token");
    cookieStore.delete("admin_token");
    cookieStore.delete("participant_token");
    cookieStore.delete("dashboard_token");
    
    // Update response with empty cookie settings
    const response = NextResponse.json({
      success: true,
      message: "Successfully logged out"
    });
    
    // Set cookies with expired date to ensure browser removes them
    response.cookies.set("next-auth.session-token", "", { expires: new Date(0) });
    response.cookies.set("debug_token", "", { expires: new Date(0) });
    response.cookies.set("admin_token", "", { expires: new Date(0) });
    response.cookies.set("participant_token", "", { expires: new Date(0) });
    response.cookies.set("dashboard_token", "", { expires: new Date(0) });
    
    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({
      error: "Failed to logout"
    }, { status: 500 });
  }
} 