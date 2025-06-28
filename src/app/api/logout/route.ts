import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Ambil token dari cookie
    const authToken = request.cookies.get('auth_token')?.value;

    if (authToken) {
      // Kirim permintaan logout ke backend Laravel
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
      } catch (error) {
        console.error('Error calling Laravel logout:', error);
        // Lanjutkan meskipun ada error dari Laravel
      }
    }

    // Hapus semua cookie autentikasi
    const response = NextResponse.json(
      { success: true, message: 'Logout berhasil' },
      { status: 200 }
    );

    // Hapus cookie autentikasi
    response.cookies.set('auth_token', '', { maxAge: 0 });
    response.cookies.set('userEmail', '', { maxAge: 0 });
    response.cookies.set('username', '', { maxAge: 0 });
    response.cookies.set('admin_token', '', { maxAge: 0 });
    response.cookies.set('dashboard_token', '', { maxAge: 0 });
    response.cookies.set('debug_token', '', { maxAge: 0 });
    response.cookies.set('participant_token', '', { maxAge: 0 });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    );
  }
} 