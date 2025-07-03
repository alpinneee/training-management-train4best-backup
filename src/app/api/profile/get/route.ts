export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Dapatkan email dari query parameter
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching profile data for email: ${email}`);
    
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        participant: true,
        userType: true 
      }
    });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Jika user tidak memiliki participant profile, kembalikan data user saja
    if (!user.participant || user.participant.length === 0) {
      console.log(`User found but no participant profile exists`);
      return NextResponse.json({
        data: {
          id: user.id,
          email: user.email,
          name: user.username,
          fullName: user.username,
          userType: user.userType.usertype,
          hasProfile: false
        }
      });
    }
    
    // Ambil data participant
    const participant = user.participant[0];
    
    // Kembalikan data yang telah diformat
    console.log(`Profile data found for ${email}`);
    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.username,
        userType: user.userType.usertype,
        fullName: participant.full_name,
        gender: participant.gender,
        phone_number: participant.phone_number,
        address: participant.address,
        birth_date: participant.birth_date,
        job_title: participant.job_title,
        company: participant.company,
        hasProfile: true
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
} 