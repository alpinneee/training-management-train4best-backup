import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Kirim permintaan ke backend Laravel untuk mengambil data user
    const laravelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-existing-users`, {
      method: 'GET',
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
          error: errorData.message || 'Gagal mengambil data user' 
        },
        { status: laravelResponse.status }
      );
    }

    const data = await laravelResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Data user berhasil diambil',
      user_counts: data.user_counts,
      users: data.users,
    });

  } catch (error) {
    console.error('Get existing users error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan saat mengambil data user' 
      },
      { status: 500 }
    );
  }
} 