/**
 * API Interceptor untuk Menangani Refresh Token dan Session Handling
 * File ini berfungsi untuk menangani permintaan API dan memastikan session tetap aktif
 */
import { getSession, signOut } from 'next-auth/react';

let isRefreshing = false;

/**
 * Fungsi wrapper untuk fetch yang menangani refresh token dan error session
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    // Tambahkan headers authorization jika perlu
    const session = await getSession();
    
    // Siapkan headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Tambahkan header Authorization jika ada session
    if (session) {
      // Bisa ditambahkan logic untuk menambahkan token ke header jika diperlukan
      // contoh: headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    // Lakukan request
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Jika response unauthorized (401) dan belum dalam proses refresh
    if (response.status === 401 && !isRefreshing) {
      console.log('Sesi tidak valid, mencoba refresh...');
      isRefreshing = true;
      
      try {
        // Coba refresh token/session
        const refreshedSession = await refreshSession();
        
        if (refreshedSession) {
          // Jika berhasil refresh, coba request lagi
          console.log('Sesi berhasil di-refresh, mencoba request ulang');
          isRefreshing = false;
          
          return fetchWithAuth(url, options);
        } else {
          // Jika gagal refresh, logout
          console.log('Gagal refresh sesi, melakukan logout');
          await handleLogout();
          throw new Error('Sesi telah berakhir, silahkan login kembali');
        }
      } catch (refreshError) {
        isRefreshing = false;
        console.error('Error refreshing session:', refreshError);
        
        // Logout jika gagal refresh
        await handleLogout();
        throw new Error('Sesi berakhir, silahkan login kembali');
      }
    }
    
    // Periksa jika response error (bukan 2xx)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

/**
 * Fungsi untuk mencoba refresh token/session
 */
async function refreshSession() {
  try {
    // Panggil endpoint untuk refresh session
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Penting untuk mengirim cookies
    });
    
    if (response.ok) {
      // Jika berhasil, ambil session baru
      return await getSession();
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
}

/**
 * Fungsi untuk menangani logout
 */
async function handleLogout() {
  try {
    // Clear cookies dulu via API
    await fetch('/api/auth/logout', {
      method: 'GET',
      credentials: 'include',
    });
    
    // Lalu logout via NextAuth
    signOut({ redirect: false });
    
    // Redirect ke halaman login jika berada di client side
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
} 