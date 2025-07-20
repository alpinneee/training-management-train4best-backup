import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from "bcryptjs";
export const dynamic = "force-dynamic";

// Ensure default roles exist
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

// GET /api/participant - Mendapatkan semua participants
export async function GET(request: Request) {
  try {
    console.log("API: Fetching participants...");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    console.log(`API: Query params - search: "${search}", page: ${page}, limit: ${limit}`);

    // Filter berdasarkan nama, perusahaan atau nomor telepon
    const where = {
      OR: [
        { full_name: { contains: search } },
        { phone_number: { contains: search } },
        { company: { contains: search } },
      ],
    };

    console.log(`API: Counting total participants with filter...`);
    // Mendapatkan total jumlah data
    const total = await prisma.participant.count({ where });
    console.log(`API: Found ${total} total participants`);

    console.log(`API: Fetching participants with pagination...`);
    try {
      // Mendapatkan data participants
      const participants = await prisma.participant.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          full_name: 'asc',
        }
      });
      
      console.log(`API: Found ${participants.length} participants for current page`);
      
      // Format respons without depending on user relation
      const formattedParticipants = participants.map((participant, index) => ({
        no: skip + index + 1,
        id: participant.id,
        name: participant.full_name,
        role: 'Participant',  // Default role
        gender: participant.gender,
        address: participant.address,
        phone_number: participant.phone_number,
        birth_date: participant.birth_date,
        job_title: participant.job_title || '',
        company: participant.company || '',
        photo: participant.photo || '/default-avatar.png',
        userId: participant.userId,
        email: '',  // Will be filled if we can get user data
      }));

      console.log(`API: Successfully formatted participants data`);
      return NextResponse.json({
        data: formattedParticipants,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (participantError) {
      console.error('Error fetching participants:', participantError);
      if (participantError instanceof Error) {
        console.error(`Error details: ${participantError.message}`);
        console.error(`Error stack: ${participantError.stack}`);
      }
      throw participantError; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error fetching participants:', error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: 'Failed to fetch participants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/participant - Membuat participant baru
export async function POST(request: Request) {
  try {
    // Ensure default roles exist before creating participant
    await ensureDefaultRolesExist();
    
    const { 
      name, 
      email, 
      username, 
      password, 
      gender, 
      phone_number, 
      address, 
      birth_date, 
      job_title, 
      company, 
      photo,
      userTypeId 
    } = await request.json();

    // Validasi data yang wajib
    if (!name || !email || !username || !password || !gender || !phone_number || !address || !birth_date) {
      return NextResponse.json(
        { error: 'Name, email, username, password, gender, phone number, address, and birth date are required' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Cek apakah email atau username sudah ada
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      },
      include: {
        userType: true
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
    }

    // Dapatkan user type ID untuk participant jika tidak diberikan
    let roleId = userTypeId;
    if (!roleId) {
      const participantRole = await prisma.userType.findFirst({
        where: {
          usertype: 'participant'
        }
      });
      
      if (!participantRole) {
        return NextResponse.json(
          { error: 'Participant role not found' },
          { status: 500 }
        );
      }
      
      roleId = participantRole.id;
    }

    // Check if user already exists but has unassigned role
    let existingUnassignedUser = null;
    if (existingUser && existingUser.userType?.usertype === 'unassigned') {
      console.log(`Found existing user with unassigned role: ${existingUser.id}`);
      existingUnassignedUser = existingUser;
    }

    // Buat transaksi untuk membuat user dan participant
    const result = await prisma.$transaction(async (prisma) => {
      let newUser;
      
      // If user exists with unassigned role, update their role to participant
      if (existingUnassignedUser) {
        newUser = await prisma.user.update({
          where: { id: existingUnassignedUser.id },
          data: {
            userTypeId: roleId,
            // Update password if provided
            ...(hashedPassword && { password: hashedPassword }),
          }
        });
      } else {
        // Buat user baru
        newUser = await prisma.user.create({
          data: {
            id: `user_${Date.now()}`,
            email,
            username,
            password: hashedPassword,
            userTypeId: roleId,
            last_login: new Date(),
          },
        });
      }

      // Buat participant baru
      const newParticipant = await prisma.participant.create({
        data: {
          id: `participant_${Date.now()}`,
          full_name: name,
          gender,
          phone_number,
          address,
          birth_date: new Date(birth_date),
          job_title,
          company,
          photo,
          userId: newUser.id,
        },
      });

      return { user: newUser, participant: newParticipant };
    });

    return NextResponse.json({
      id: result.participant.id,
      name: result.participant.full_name,
      role: 'Participant',
      gender: result.participant.gender,
      address: result.participant.address,
      phone_number: result.participant.phone_number,
      birth_date: result.participant.birth_date,
      job_title: result.participant.job_title,
      company: result.participant.company,
      photo: result.participant.photo || '/default-avatar.png',
      userId: result.participant.userId,
      email: result.user.email,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create participant: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create participant' },
      { status: 500 }
    );
  }
} 