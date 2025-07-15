'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle storage events for session changes
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key) return;
      
      const isAuthEvent = event.key.includes('next-auth') || 
                          ['debug_token', 'logged-in', 'logout'].includes(event.key);
      
      if (!isAuthEvent) return;
      
      // Handle logout from another tab
      if (event.key === 'logout' && event.newValue === 'true') {
        localStorage.setItem('logout', 'false');
        return;
      }
      
      // Check session status
      try {
        fetch('/api/auth/session-check')
          .then(res => res.json())
          .catch(err => {
            console.error('Error checking session:', err);
          });
      } catch (error) {
        console.error('Failed to check session:', error);
      }
    };

    // Set up periodic session check
    const checkSession = () => {
      try {
        fetch('/api/auth/session-check')
          .then(res => res.json())
          .then(data => {
            if (!data.valid && window.location.pathname !== '/login') {
              fetch('/api/auth/refresh', { method: 'POST' })
                .catch(refreshErr => {
                  console.error('Error refreshing session:', refreshErr);
                });
            }
          })
          .catch(err => {
            console.error('Error in session check:', err);
          });
      } catch (error) {
        console.error('Failed to run session check:', error);
      }
    };

    // Set up event listeners and intervals
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkSession, 5 * 60 * 1000); // 5 minutes

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
} 