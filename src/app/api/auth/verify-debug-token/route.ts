import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    // Ambil token dari cookie
    const token = cookies().get("debug_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, message: "Token tidak ditemukan" });
    }

    // Verifikasi token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "rahasia_debug"
    );

    // Return info user
    return NextResponse.json({
      authenticated: true,
      user: decoded,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json({ 
      authenticated: false, 
      message: "Token tidak valid" 
    });
  }
} 