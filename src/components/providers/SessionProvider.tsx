'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Tambahkan eventListener untuk menangkap peristiwa storage yang mungkin mengindikasikan perubahan session di tab lain
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && (
          event.key.includes('next-auth') || 
          event.key === 'debug_token' || 
          event.key === 'logged-in' ||
          event.key === 'logout'
        )) {
        console.log('AuthStorage changed:', event.key);
        
        // Jika tab lain logout, jangan refresh halaman ini (untuk mencegah logout tak disengaja)
        if (event.key === 'logout' && event.newValue === 'true') {
          console.log('Logout from another tab detected');
          localStorage.setItem('logout', 'false'); // Reset status
          return;
        }
        
        // Jika session di tab lain berubah, coba refresh session disini
        fetch('/api/auth/session-check')
          .then(res => res.json())
          .then(data => {
            console.log('Session check result:', data);
          })
          .catch(err => {
            console.error('Error checking session:', err);
          });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Setiap 5 menit, cek apakah session masih valid untuk menghindari logout tiba-tiba
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        fetch('/api/auth/session-check')
          .then(res => res.json())
          .then(data => {
            console.log('Regular session check:', data);
            if (!data.valid && window.location.pathname !== '/login') {
              // Jika tidak valid dan bukan di halaman login, refresh session
              fetch('/api/auth/refresh', { method: 'POST' })
                .then(res => res.json())
                .then(refreshData => {
                  console.log('Session refreshed:', refreshData);
                })
                .catch(refreshErr => {
                  console.error('Error refreshing session:', refreshErr);
                });
            }
          })
          .catch(err => {
            console.error('Error in regular session check:', err);
          });
      }
    }, 5 * 60 * 1000); // Cek setiap 5 menit

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // Refresh session setiap 5 menit
      refetchOnWindowFocus={true} // Refresh session ketika jendela mendapat fokus
    >
      {children}
    </NextAuthSessionProvider>
  );
} 