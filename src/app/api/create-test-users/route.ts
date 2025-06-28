import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Kirim permintaan ke backend Laravel untuk membuat user test
    const laravelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-test-users`, {
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
          error: errorData.message || 'Gagal membuat user test' 
        },
        { status: laravelResponse.status }
      );
    }

    const data = await laravelResponse.json();

    return NextResponse.json({
      success: true,
      message: 'User test berhasil dibuat',
      users: data.users,
    });

  } catch (error) {
    console.error('Create test users error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan saat membuat user test' 
      },
      { status: 500 }
    );
  }
} 