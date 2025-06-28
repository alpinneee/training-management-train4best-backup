import './globals.css'
import Script from 'next/script';
import { NotificationProvider } from '@/context/NotificationContext';
import Notification from '@/components/common/Notification';
import SessionProvider from '@/components/providers/SessionProvider';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Train4Best",
  description: "Management Training Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-signin-client_id"
          content="913107858333-8csadaquuajoeb3pf7hu2l223ia4u6od.apps.googleusercontent.com"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <meta name="description" content="Train4Best - Management Training Platform" />
        
        {/* Script untuk mencegah reload otomatis yang mengganggu session */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Deteksi reload dan simpan status di localStorage
              window.addEventListener('beforeunload', function() {
                localStorage.setItem('reloading', 'true');
              });
              
              // Cek apakah sedang reload
              if(localStorage.getItem('reloading') === 'true') {
                // Reset status reload
                localStorage.setItem('reloading', 'false');
                
                // Cek cookie next-auth.session-token masih ada
                if(document.cookie.includes('next-auth.session-token') || document.cookie.includes('debug_token')) {
                  console.log('Session token exists after reload');
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 font-sans">
        <Script src="https://apis.google.com/js/platform.js" strategy="afterInteractive" />
        <SessionProvider>
          <AuthProvider>
            <NotificationProvider>
              <LayoutProvider>
                {children}
              </LayoutProvider>
              <Notification />
            </NotificationProvider>
            <Toaster />
          </AuthProvider>
        </SessionProvider>
        
        {/* Script yg dijalankan setelah page dimuat */}
        <Script id="session-maintenance" strategy="afterInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              // Cek validitas session pada startup
              fetch('/api/auth/session-check', {
                headers: {
                  'x-session-id': Math.random().toString(36).substring(2, 15)
                }
              })
              .then(response => response.json())
              .then(data => {
                console.log('Initial session check:', data);
                
                // Jika session tidak valid tapi bukan di login page, refresh token
                if (!data.valid && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                  console.log('Trying to refresh invalid session');
                  fetch('/api/auth/refresh', { method: 'POST' });
                }
              })
              .catch(error => {
                console.error('Error checking session:', error);
              });
            });
          `}
        </Script>
      </body>
    </html>
  )
} 