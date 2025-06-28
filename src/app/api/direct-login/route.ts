import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password diperlukan' },
        { status: 400 }
      );
    }

    // Kirim permintaan ke backend Laravel
    const laravelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ email, password }),
    });

    const laravelData = await laravelResponse.json();

    if (!laravelResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: laravelData.message || 'Login gagal' 
        },
        { status: laravelResponse.status }
      );
    }

    // Login berhasil
    const user = laravelData.user;
    const token = laravelData.token;

    // Tentukan redirect URL berdasarkan tipe user
    let redirectUrl = '/dashboard';
    const userType = user.user_type?.toLowerCase();

    if (userType === 'admin') {
      redirectUrl = '/dashboard';
    } else if (userType === 'instructure') {
      redirectUrl = '/instructure/dashboard';
    } else if (userType === 'participant') {
      redirectUrl = '/participant/dashboard';
    } else if (userType === 'unassigned') {
      redirectUrl = '/profile';
    }

    // Set cookie untuk autentikasi
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.user_type,
        },
        redirectUrl,
        message: 'Login berhasil',
      },
      { status: 200 }
    );

    // Set cookie untuk token
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    // Set header untuk redirect
    response.headers.set('X-Redirect-URL', redirectUrl);

    return response;

  } catch (error) {
    console.error('Direct login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Terjadi kesalahan pada server' 
      },
      { status: 500 }
    );
  }
} 