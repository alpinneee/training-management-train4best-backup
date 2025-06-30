export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        instructure: true,
        userType: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if instructure profile exists
    if (!user.instructure) {
      return NextResponse.json({ 
        success: true,
        hasProfile: false,
        data: {
          email: user.email,
          name: user.username,
          userType: user.userType?.usertype || 'Instructure'
        }
      });
    }

    // Return instructure profile data
    return NextResponse.json({
      success: true,
      hasProfile: true,
      data: {
        email: user.email,
        full_name: user.instructure.full_name,
        phone_number: user.instructure.phone_number,
        address: user.instructure.address,
        profiency: user.instructure.profiency,
        photo: user.instructure.photo,
        userType: user.userType?.usertype || 'Instructure'
      }
    });

  } catch (error) {
    console.error('Error fetching instructure profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch instructure profile', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 