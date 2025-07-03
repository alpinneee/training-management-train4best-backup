import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/participant/[id] - Mendapatkan participant berdasarkan ID
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    console.log(`API: Fetching participant with ID: ${id}`);

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
        certificates: {
          include: {
            course: {
              select: {
                course_name: true
              }
            }
          }
        },
        courseregistration: {
          include: {
            class: {
              include: {
                course: true
              }
            },
            payments: true
          }
        }
      },
    });

    if (!participant) {
      console.log(`API: Participant with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Format courses data from courseregistration
    const courses = participant.courseregistration.map(reg => ({
      id: reg.classId,
      course_name: reg.class.course.course_name,
      start_date: reg.class.start_date,
      end_date: reg.class.end_date,
      status: reg.reg_status,
      present_day: reg.present_day,
      location: reg.class.location
    }));
    
    // Flatten payments from all course registrations
    const payments = participant.courseregistration
      .flatMap(reg => reg.payments)
      .map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        status: payment.status,
        registrationId: payment.registrationId
      }));
    
    console.log(`API: Successfully retrieved participant ${participant.full_name}`);
    
    return NextResponse.json({
      id: participant.id,
      full_name: participant.full_name,
      photo: participant.photo,
      address: participant.address,
      phone_number: participant.phone_number,
      birth_date: participant.birth_date,
      job_title: participant.job_title,
      company: participant.company,
      gender: participant.gender,
      email: participant.user.email,
      username: participant.user.username,
      certificates: participant.certificates,
      courses: courses,
      payments: payments
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: 'Failed to fetch participant details' },
      { status: 500 }
    );
  }
}

// PUT /api/participant/[id] - Memperbarui participant
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
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

    console.log(`API: Updating participant with ID: ${id}`);

    // Periksa apakah participant ada
    const existingParticipant = await prisma.participant.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!existingParticipant) {
      console.log(`API: Participant with ID ${id} not found for update`);
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Jika mengubah email atau username, periksa apakah sudah ada yang menggunakan
    if ((email && email !== existingParticipant.user?.email) || 
        (username && username !== existingParticipant.user?.username)) {
      
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : {},
            username ? { username } : {}
          ],
          id: { not: existingParticipant.userId }
        }
      });

      if (existingUser) {
        if (email && existingUser.email === email) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }
        if (username && existingUser.username === username) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 409 }
          );
        }
      }
    }

    // Perbarui dalam transaksi
    const result = await prisma.$transaction(async (prisma) => {
      // Perbarui user jika perlu
      if (existingParticipant.userId) {
        const updateUserData: any = {};
        
        if (email) updateUserData.email = email;
        if (username) updateUserData.username = username;
        if (password) updateUserData.password = password;
        if (userTypeId) updateUserData.userTypeId = userTypeId;
        
        if (Object.keys(updateUserData).length > 0) {
          await prisma.user.update({
            where: { id: existingParticipant.userId },
            data: updateUserData
          });
        }
      }

      // Perbarui participant
      const updateParticipantData: any = {};
      
      if (name) updateParticipantData.full_name = name;
      if (gender) updateParticipantData.gender = gender;
      if (phone_number) updateParticipantData.phone_number = phone_number;
      if (address) updateParticipantData.address = address;
      if (birth_date) updateParticipantData.birth_date = new Date(birth_date);
      if (job_title !== undefined) updateParticipantData.job_title = job_title;
      if (company !== undefined) updateParticipantData.company = company;
      if (photo !== undefined) updateParticipantData.photo = photo;
      
      const updatedParticipant = await prisma.participant.update({
        where: { id },
        data: updateParticipantData
      });

      const user = updatedParticipant.userId ? await prisma.user.findUnique({
        where: { id: updatedParticipant.userId },
        include: {
          userType: true
        }
      }) : null;

      return updatedParticipant;
    });

    console.log(`API: Successfully updated participant ${result.full_name}`);

    return NextResponse.json({
      id: result.id,
      name: result.full_name,
      role: 'Participant',
      gender: result.gender,
      address: result.address,
      phone_number: result.phone_number,
      birth_date: result.birth_date,
      job_title: result.job_title || '',
      company: result.company || '',
      photo: result.photo || '/default-avatar.png',
      userId: result.userId,
      email: '',  // We're not fetching user info to avoid Prisma errors
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to update participant: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    );
  }
}

// DELETE /api/participant/[id] - Menghapus participant
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    console.log(`Attempting to delete participant with ID: ${id}, force: ${force}`);
    
    // Periksa apakah participant ada
    const existingParticipant = await prisma.participant.findUnique({
      where: { id },
      include: {
        courseregistration: {
          take: 1, // Hanya perlu memeriksa apakah ada courseregistration
        }
      }
    });

    if (!existingParticipant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    console.log(`Found participant: ${existingParticipant.full_name}`);

    // Jika tidak force delete, periksa relasi
    if (!force && existingParticipant.courseregistration.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete participant that has course registrations', 
          hint: 'Add ?force=true to URL to force deletion' 
        },
        { status: 400 }
      );
    }

    // Hapus dalam transaksi
    await prisma.$transaction(async (prisma) => {
      // Hapus registrasi kursus jika force delete
      if (force && existingParticipant.courseregistration.length > 0) {
        await prisma.courseRegistration.deleteMany({
          where: { participantId: id }
        });
      }

      // Hapus participant
      await prisma.participant.delete({
        where: { id }
      });

      // Hapus user jika ada
      if (existingParticipant.userId) {
        await prisma.user.delete({
          where: { id: existingParticipant.userId }
        });
      }
    });

    return NextResponse.json(
      { message: 'Participant deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting participant:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete participant: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: 500 }
    );
  }
} 