import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Ambil token dari cookie
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { authenticated: false, message: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    // Verifikasi token dengan backend Laravel
    const laravelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!laravelResponse.ok) {
      return NextResponse.json(
        { authenticated: false, message: 'Token tidak valid' },
        { status: 401 }
      );
    }

    const laravelData = await laravelResponse.json();
    const user = laravelData.user;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type,
      },
      message: 'User terautentikasi',
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'Terjadi kesalahan saat verifikasi' },
      { status: 500 }
    );
  }
} 