'use client';

import Script from 'next/script';

export default function SessionMaintenance() {
  return (
    <Script id="session-maintenance" strategy="afterInteractive">
      {`
        function checkSession() {
          try {
            fetch('/api/auth/session-check', {
              headers: {
                'x-session-id': Math.random().toString(36).substring(2, 15)
              }
            })
            .then(response => response.json())
            .then(data => {
              if (!data.valid && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                fetch('/api/auth/refresh', { method: 'POST' });
              }
            })
            .catch(error => {
              console.error('Error checking session:', error);
            });
          } catch (e) {
            console.error('Session check error:', e);
          }
        }

        if (document.readyState === 'complete') {
          checkSession();
        } else {
          window.addEventListener('load', checkSession);
        }
      `}
    </Script>
  );
} 