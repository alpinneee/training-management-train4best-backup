import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing connection to Laravel...');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    // Test koneksi ke Laravel
    const laravelResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-connection`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    console.log('Laravel response status:', laravelResponse.status);
    console.log('Laravel response headers:', Object.fromEntries(laravelResponse.headers.entries()));

    if (!laravelResponse.ok) {
      const errorText = await laravelResponse.text();
      console.error('Laravel error response:', errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Laravel error: ${laravelResponse.status} - ${errorText}`,
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
        },
        { status: laravelResponse.status }
      );
    }

    const data = await laravelResponse.json();
    console.log('Laravel response data:', data);

    return NextResponse.json({
      success: true,
      message: 'Koneksi ke Laravel berhasil',
      laravelData: data,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    });

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
      },
      { status: 500 }
    );
  }
} 