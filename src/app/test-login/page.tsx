'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

export default function TestLoginPage() {
  const { user, loading, authenticated, login, logout } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginResult, setLoginResult] = useState<any>(null);
  const [createUsersResult, setCreateUsersResult] = useState<any>(null);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [existingUsersResult, setExistingUsersResult] = useState<any>(null);
  const [createFromExistingResult, setCreateFromExistingResult] = useState<any>(null);
  const [testConnectionResult, setTestConnectionResult] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginResult(null);

    const result = await login(email, password);
    setLoginResult(result);

    if (result.success) {
      console.log('Login berhasil, redirect ke:', result.redirectUrl);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    setLoginResult(result);
  };

  const handleGetExistingUsers = async () => {
    try {
      const response = await fetch('/api/get-existing-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setExistingUsersResult(data);

      if (data.success) {
        console.log('Data user berhasil diambil:', data.users);
      }
    } catch (error) {
      console.error('Error getting existing users:', error);
      setExistingUsersResult({
        success: false,
        error: 'Terjadi kesalahan saat mengambil data user',
      });
    }
  };

  const handleCreateFromExisting = async () => {
    try {
      const response = await fetch('/api/create-test-users-from-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setCreateFromExistingResult(data);

      if (data.success) {
        console.log('User test berhasil dibuat dari data yang sudah ada:', data.created_users);
      }
    } catch (error) {
      console.error('Error creating test users from existing:', error);
      setCreateFromExistingResult({
        success: false,
        error: 'Terjadi kesalahan saat membuat user test dari data yang sudah ada',
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/test-connection', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setTestConnectionResult(data);

      if (data.success) {
        console.log('Test koneksi berhasil:', data);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestConnectionResult({
        success: false,
        error: 'Terjadi kesalahan saat test koneksi',
      });
    }
  };

  const handleSetupUserTypes = async () => {
    try {
      const response = await fetch('/api/setup-user-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setSetupResult(data);

      if (data.success) {
        console.log('User types berhasil dibuat:', data.user_types);
      }
    } catch (error) {
      console.error('Error setting up user types:', error);
      setSetupResult({
        success: false,
        error: 'Terjadi kesalahan saat setup user types',
      });
    }
  };

  const handleCreateTestUsers = async () => {
    try {
      const response = await fetch('/api/create-test-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setCreateUsersResult(data);

      if (data.success) {
        console.log('User test berhasil dibuat:', data.users);
      }
    } catch (error) {
      console.error('Error creating test users:', error);
      setCreateUsersResult({
        success: false,
        error: 'Terjadi kesalahan saat membuat user test',
      });
    }
  };

  const fillTestCredentials = (type: string) => {
    switch (type) {
      case 'admin':
        setEmail('admin@test.com');
        setPassword('password123');
        break;
      case 'instructor':
        setEmail('instructor@test.com');
        setPassword('password123');
        break;
      case 'participant':
        setEmail('participant@test.com');
        setPassword('password123');
        break;
      case 'unassigned':
        setEmail('unassigned@test.com');
        setPassword('password123');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <h1 className="text-2xl font-bold text-center mb-8">
            Test Integrasi Login dengan Laravel
          </h1>

          {/* Status Autentikasi */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Status Autentikasi:</h2>
            <p>Loading: {loading ? 'Ya' : 'Tidak'}</p>
            <p>Terautentikasi: {authenticated ? 'Ya' : 'Tidak'}</p>
            {user && (
              <div className="mt-2">
                <p>User: {user.name}</p>
                <p>Email: {user.email}</p>
                <p>Tipe: {user.userType}</p>
              </div>
            )}
          </div>

          {/* Tombol Test Koneksi */}
          <div className="mb-6">
            <button
              onClick={handleTestConnection}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 mb-2"
            >
              Test Koneksi ke Laravel
            </button>
            {testConnectionResult && (
              <div className={`p-3 rounded-md text-sm ${
                testConnectionResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <pre className="text-xs">
                  {JSON.stringify(testConnectionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tombol Ambil Data User yang Sudah Ada */}
          <div className="mb-6">
            <button
              onClick={handleGetExistingUsers}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-2"
            >
              Ambil Data User yang Sudah Ada
            </button>
            {existingUsersResult && (
              <div className={`p-3 rounded-md text-sm ${
                existingUsersResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <pre className="text-xs">
                  {JSON.stringify(existingUsersResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tombol Buat User Test dari Data yang Sudah Ada */}
          <div className="mb-6">
            <button
              onClick={handleCreateFromExisting}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 mb-2"
            >
              Buat User Test dari Data yang Sudah Ada
            </button>
            {createFromExistingResult && (
              <div className={`p-3 rounded-md text-sm ${
                createFromExistingResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <pre className="text-xs">
                  {JSON.stringify(createFromExistingResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tombol Setup User Types */}
          <div className="mb-6">
            <button
              onClick={handleSetupUserTypes}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 mb-2"
            >
              Setup User Types
            </button>
            {setupResult && (
              <div className={`p-3 rounded-md text-sm ${
                setupResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <pre className="text-xs">
                  {JSON.stringify(setupResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tombol Buat User Test */}
          <div className="mb-6">
            <button
              onClick={handleCreateTestUsers}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 mb-2"
            >
              Buat User Test
            </button>
            {createUsersResult && (
              <div className={`p-3 rounded-md text-sm ${
                createUsersResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <pre className="text-xs">
                  {JSON.stringify(createUsersResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Tombol Test Credentials */}
          {!authenticated && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Test Credentials:</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillTestCredentials('admin')}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Admin
                </button>
                <button
                  onClick={() => fillTestCredentials('instructor')}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                >
                  Instructor
                </button>
                <button
                  onClick={() => fillTestCredentials('participant')}
                  className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                >
                  Participant
                </button>
                <button
                  onClick={() => fillTestCredentials('unassigned')}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                >
                  Unassigned
                </button>
              </div>
            </div>
          )}

          {/* Form Login */}
          {!authenticated && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Login
              </button>
            </form>
          )}

          {/* Tombol Logout */}
          {authenticated && (
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          )}

          {/* Hasil Login */}
          {loginResult && (
            <div className={`mt-4 p-4 rounded-md ${
              loginResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <h3 className="font-semibold">Hasil Login:</h3>
              <pre className="mt-2 text-sm">
                {JSON.stringify(loginResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Informasi Test */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Langkah-langkah Test:</h3>
            <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
              <li>Klik "Ambil Data User yang Sudah Ada" untuk melihat user di database</li>
              <li>Klik "Buat User Test dari Data yang Sudah Ada" untuk membuat user test</li>
              <li>Atau klik "Setup User Types" dan "Buat User Test" untuk membuat user baru</li>
              <li>Gunakan tombol Test Credentials atau isi manual form login</li>
              <li>Test login dengan user yang sudah dibuat</li>
            </ol>
          </div>

          {/* Link ke halaman lain */}
          <div className="mt-6 text-center">
            <a href="/api-test" className="text-blue-600 hover:underline">
              Test API
            </a>
            <span className="mx-2">|</span>
            <a href="/login" className="text-blue-600 hover:underline">
              Halaman Login Asli
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 