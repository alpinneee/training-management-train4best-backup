import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { v4 as uuidv4 } from 'uuid';

// Ensure default unassigned role exists
async function ensureDefaultRolesExist() {
  try {
    const roles = [
      { id: 'utype_unassigned', usertype: 'unassigned', description: 'Default role for new users' },
      { id: 'utype_participant', usertype: 'participant', description: 'Training participant' }
    ];
    
    for (const role of roles) {
      const existingRole = await prisma.userType.findFirst({
        where: { usertype: role.usertype }
      });
      
      if (!existingRole) {
        await prisma.userType.create({
          data: role
        });
        console.log(`Created default role: ${role.usertype}`);
      }
    }
  } catch (error) {
    console.error("Failed to ensure default roles exist:", error);
  }
}

export async function POST(req: Request) {
  try {
    // Ensure default roles exist before registration
    await ensureDefaultRolesExist();
    
    const { fullName, email, password } = await req.json();
    
    // Validasi input
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Dapatkan userType default/unassigned
    const defaultUserType = await prisma.userType.findFirst({
      where: { usertype: 'unassigned' }
    });

    if (!defaultUserType) {
      return NextResponse.json(
        { error: "Tipe user default tidak ditemukan" },
        { status: 500 }
      );
    }

    // Gunakan fullName sebagai username, bukan email
    const username = fullName;

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate unique ID
    const userId = uuidv4();

    // Buat user baru dengan role default/unassigned
    const user = await prisma.user.create({
      data: {
        id: userId,
        username,
        email,
        password: hashedPassword,
        userTypeId: defaultUserType.id
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: fullName,
        isNewUser: true
      }
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
} 