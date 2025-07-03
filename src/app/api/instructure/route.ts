import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/instructure - Mendapatkan semua instruktur
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const proficiency = searchParams.get('proficiency') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filter berdasarkan nama dan proficiency
    const where: any = {
      OR: [
        { full_name: { contains: search } },
        { phone_number: { contains: search } },
      ],
    };

    if (proficiency && proficiency !== 'all') {
      where.profiency = proficiency;
    }

    // Mendapatkan total jumlah data
    const total = await prisma.instructure.count({ where });

    // Mendapatkan data instruktur
    const instructures = await prisma.instructure.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        full_name: 'asc',
      },
      include: {
        user: {
          select: {
            email: true
          },
          take: 1 // Limit to first user
        }
      }
    });

    // Format respons
    const formattedInstructures = instructures.map((instructure, index) => ({
      no: skip + index + 1,
      id: instructure.id,
      fullName: instructure.full_name,
      phoneNumber: instructure.phone_number,
      proficiency: instructure.profiency,
      address: instructure.address,
      photo: instructure.photo || null,
      email: instructure.user && instructure.user.length > 0 ? instructure.user[0].email : null,
    }));

    return NextResponse.json({
      data: formattedInstructures,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching instructures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructures' },
      { status: 500 }
    );
  }
}

// POST /api/instructure - Membuat instruktur baru
export async function POST(request: Request) {
  try {
    const { fullName, phoneNumber, proficiency, address, photo } = await request.json();

    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // Membuat instruktur baru
    const newInstructure = await prisma.instructure.create({
      data: {
        id: Date.now().toString(), // Generate ID sederhana
        full_name: fullName,
        phone_number: phoneNumber || "", // Boleh kosong, akan diisi nanti oleh instruktur
        profiency: proficiency || "", // Boleh kosong, akan diisi nanti oleh instruktur
        address: address || "", // Boleh kosong, akan diisi nanti oleh instruktur
        photo: photo || null,
      },
    });

    return NextResponse.json({
      id: newInstructure.id,
      fullName: newInstructure.full_name,
      phoneNumber: newInstructure.phone_number,
      proficiency: newInstructure.profiency,
      address: newInstructure.address,
      photo: newInstructure.photo,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating instructure:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create instructure: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create instructure' },
      { status: 500 }
    );
  }
} 