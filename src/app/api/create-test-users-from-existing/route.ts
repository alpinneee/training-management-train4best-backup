import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Kirim permintaan ke backend Laravel untuk membuat user test dari data yang sudah ada
    const laravelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-test-users-from-existing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!laravelResponse.ok) {
      const errorData = await laravelResponse.json();
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || 'Gagal membuat user test dari data yang sudah ada' 
        },
        { status: laravelResponse.status }
      );
    }

    const data = await laravelResponse.json();

    return NextResponse.json({
      success: true,
      message: 'User test berhasil dibuat dari data yang sudah ada',
      created_users: data.created_users,
      total_created: data.total_created,
    });

  } catch (error) {
    console.error('Create test users from existing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan saat membuat user test dari data yang sudah ada' 
      },
      { status: 500 }
    );
  }
} 