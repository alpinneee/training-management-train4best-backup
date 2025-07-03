import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, fullName, phone, address, profiency } = data;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { instructure: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let instructureId = user.instructureId;
    let instructure;

    // If instructure profile exists, update it
    if (instructureId) {
      instructure = await prisma.instructure.update({
        where: { id: instructureId },
        data: {
          full_name: fullName,
          phone_number: phone,
          address,
          profiency
        }
      });
    } 
    // If instructure profile doesn't exist, create it
    else {
      // Generate new ID for instructure
      const newInstructureId = uuidv4();
      
      // Create instructure record
      instructure = await prisma.instructure.create({
        data: {
          id: newInstructureId,
          full_name: fullName,
          phone_number: phone,
          address,
          profiency
        }
      });

      // Update user with instructureId
      await prisma.user.update({
        where: { id: user.id },
        data: { instructureId: newInstructureId }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Instructure profile updated successfully',
      data: instructure
    });

  } catch (error) {
    console.error('Error updating instructure profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update instructure profile', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 