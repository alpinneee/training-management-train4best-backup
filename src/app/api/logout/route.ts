export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    
    // Hapus semua cookie yang terkait dengan autentikasi
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("debug_token");
    cookieStore.delete("admin_token");
    cookieStore.delete("participant_token");
    cookieStore.delete("dashboard_token");
    cookieStore.delete("force_login");
    
    // Perbarui response dengan setting cookie kosong
    const response = NextResponse.json({
      success: true,
      message: "Berhasil logout"
    });
    
    // Tambahan: set cookie dengan expired date di masa lalu untuk memastikan browser hapus
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