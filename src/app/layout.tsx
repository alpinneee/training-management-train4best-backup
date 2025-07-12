import './globals.css'
import { Inter } from "next/font/google";
import Script from 'next/script';
import { NotificationProvider } from '@/context/NotificationContext';
import Notification from '@/components/common/Notification';
import SessionProvider from '@/components/providers/SessionProvider';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

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
        
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <Script src="https://apis.google.com/js/platform.js" strategy="afterInteractive" />
        <SessionProvider>
          <NotificationProvider>
            <LayoutProvider>
              {children}
            </LayoutProvider>
            <Notification />
          </NotificationProvider>
          <Toaster />
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