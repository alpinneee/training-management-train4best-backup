"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutModal from '@/components/common/LogoutModal';

export default function DebugLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    user?: {
      id?: string;
      email?: string;
      name?: string;
      userType?: string;
    }
  } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Get email from URL query param and check login status
  useEffect(() => {
    // Handle URL query parameters
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Check if user is already logged in
    handleDebugSessionCheck(true);
  }, []);

  const handleDebugSessionCheck = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }
      
      const response = await fetch('/api/debug-session');
      const data = await response.json();
      
      if (!silent) {
        setResult(data);
      }
      
      // Update login status
      setLoggedIn(data.hasSession || data.hasToken);
    } catch (error: any) {
      if (!silent) {
        setError('Error checking session: ' + (error?.message || 'Unknown error'));
      }
      console.error("Session check error:", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Bersihkan sesi yang mungkin ada terlebih dahulu
      try {
        await fetch('/api/logout');
      } catch (error) {
        // Ignore error, just continue
      }
      
      // Lakukan login langsung
      const response = await fetch('/api/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          ...data,
          message: data.message + " - Mengarahkan ke halaman profil dalam 2 detik..."
        });
        
        // Verifikasi login berhasil dengan cek sesi
        const sessionCheck = await fetch('/api/debug-session');
        const sessionData = await sessionCheck.json();
        
        if (sessionData.hasToken || sessionData.hasSession || data.user?.email) {
          // Login berhasil, alihkan ke halaman profil dengan parameter email
          // Gunakan email dari response jika tersedia
          const emailToUse = data.user?.email || email;
          console.log("Login berhasil, mengalihkan ke halaman profil...");
          setTimeout(() => {
            window.location.href = `/profile?email=${encodeURIComponent(emailToUse)}`;
          }, 1500);
        } else {
          // Login gagal, tampilkan pesan error
          setError('Login berhasil tapi sesi tidak tersimpan. Silakan coba lagi.');
          console.error("Login failed: Session not stored");
        }
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (error: any) {
      setError('Error login: ' + (error?.message || 'Unknown error'));
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Add direct profile access function
  const goToProfile = () => {
    if (result?.user?.email) {
      window.location.href = `/profile?email=${encodeURIComponent(result.user.email)}`;
    } else {
      window.location.href = '/profile';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
          <h1 className="text-xl font-semibold text-gray-800 mb-6">Debug Login</h1>
          
          {loggedIn ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
              <p className="font-medium">Status: <span className="text-green-600">Sudah Login</span></p>
              <p className="text-sm mt-1">Anda dapat langsung mengakses halaman profil.</p>
              <button
                onClick={goToProfile}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Langsung ke Profil &rarr;
              </button>
            </div>
          ) : null}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="flex gap-2">
              {!loggedIn ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  {loading ? 'Memproses...' : 'Login Langsung'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  {loading ? 'Memproses...' : 'Logout'}
                </button>
              )}
              
              <button
                type="button"
                onClick={(e) => handleDebugSessionCheck(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Cek Sesi
              </button>
            </div>
          </form>
          
          {loggedIn && (
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={goToProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full"
              >
                Lanjut ke Halaman Profil
              </button>
            </div>
          )}
          
          {result && (
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Hasil:</h3>
              <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.success && result.user && result.user.email && (
                <button
                  onClick={() => window.location.href = `/profile?email=${encodeURIComponent(result.user!.email!)}`}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Akses Profil Sekarang
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => router.push('/profile')}
            className="text-sm text-blue-600 hover:underline"
          >
            Kembali ke Profile
          </button>
        </div>
      </div>
      
      {/* Modal Logout */}
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
} 