import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Parse request
    const body = await request.json();
    const { email, password } = body;
    
    console.log("API login attempt:", { email });
    
    // Check required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userType: true,
      },
    });
    
    if (!user) {
      console.error("API login: User not found", { email });
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }
    
    // Verify password
    const isValid = await compare(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Kata sandi salah" },
        { status: 401 }
      );
    }
    
    // Get user type
    const userType = user.userType.usertype;
    console.log("API login: User found with type", { email, userType });
    
    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });
    
    // Return minimal information
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
        userType: userType
      },
      message: "Login successful"
    });
  } catch (error) {
    console.error("API login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
} 