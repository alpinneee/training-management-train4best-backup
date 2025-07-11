import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const secret = process.env.NEXTAUTH_SECRET || "ee242735312254106fe3e96a49c7439e224a303ff71c148eee211ee52b6df1719d261fbf28697c6375bfa1ff473b328d31659d6308da93ea03ae630421a8024e";

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

    // --- MULAI TAMBAHAN: Buat JWT dan set cookie NextAuth ---
    // Buat payload JWT
    const payload = {
      id: user.id,
      email: user.email,
      name: user.username,
      userType: userType
    };
    // Buat JWT pakai jose
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(secret));

    // Siapkan response
    const response = NextResponse.json({
      success: true,
      user: payload,
      message: "Login successful"
    });
    // Set cookie next-auth.session-token
    response.cookies.set("next-auth.session-token", jwt, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    });
    // Jika admin, set juga admin_token
    if (userType.toLowerCase() === "admin") {
      response.cookies.set("admin_token", jwt, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7
      });
    }
    return response;
    // --- END TAMBAHAN ---
  } catch (error) {
    console.error("API login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
} 