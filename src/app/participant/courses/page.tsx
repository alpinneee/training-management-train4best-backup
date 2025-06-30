'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import Link from 'next/link';

interface CourseRegistration {
  id: string;
  courseId: string;
  courseName: string;
  className: string;
  schedule: string;
  registrationDate: string;
  amount: number;
  status: string;
}

export default function ParticipantCourses() {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [useDummyData, setUseDummyData] = useState(false);
  
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        // If using dummy data, skip API call
        if (useDummyData) {
          setDummyData();
          return;
        }
        
        // Get user email from localStorage
        const userEmail = localStorage.getItem('userEmail') || '';
        console.log('Fetching registrations with email:', userEmail);
        setDebugInfo(`Email yang digunakan: ${userEmail || 'Tidak ada email'}`);
        
        if (!userEmail) {
          setDebugInfo('Tidak ada email yang tersimpan di localStorage. Silakan mendaftar atau masuk terlebih dahulu.');
          setDummyData();
          return;
        }
        
        // Use the new dedicated API
        const url = `/api/user-registrations?email=${encodeURIComponent(userEmail)}&_=${Date.now()}`;
        console.log('Using new API endpoint:', url);
        
        const response = await fetch(url);
        console.log('Registration API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Registration API data:', data);
        
        if (data && data.data && Array.isArray(data.data)) {
          console.log('Found registrations:', data.data.length);
          setRegistrations(data.data);
          
          if (data.data.length > 0) {
            setDebugInfo(`Ditemukan ${data.data.length} pendaftaran untuk email ${userEmail}`);
          } else {
            setDebugInfo(`Tidak ada pendaftaran ditemukan untuk email ${userEmail}`);
            // Don't show dummy data automatically
          }
        } else {
          // No registrations found, but don't use dummy data by default
          setDebugInfo(`Tidak ada pendaftaran ditemukan untuk email ${userEmail}. API response: ${JSON.stringify(data)}`);
          setRegistrations([]);
        }
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Gagal mengambil data registrasi kursus.');
        setDebugInfo(prev => `${prev || ''}\nError: ${err instanceof Error ? err.message : 'Kesalahan tidak diketahui'}`);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegistrations();
  }, [useDummyData]);
  
  // Function to set dummy data
  const setDummyData = () => {
    console.log('Using dummy data');
    setRegistrations([
      {
        id: 'reg_1',
        courseId: 'course_1',
        courseName: 'AIoT (Artificial Intelligence of Things)',
        className: 'Jakarta - Jan 25',
        schedule: '25 Jan 2024 - 28 Jan 2024',
        registrationDate: '2024-01-10',
        amount: 1500000,
        status: 'Unpaid'
      },
      {
        id: 'reg_2',
        courseId: 'course_2',
        courseName: 'Full Stack Web Development',
        className: 'Online - Feb 5',
        schedule: '5 Feb 2024 - 10 Feb 2024',
        registrationDate: '2024-01-15',
        amount: 1200000,
        status: 'Paid'
      },
      {
        id: 'reg_3',
        courseId: 'course_3',
        courseName: 'Data Science Fundamentals',
        className: 'Bandung - Mar 15',
        schedule: '15 Mar 2024 - 20 Mar 2024',
        registrationDate: '2024-02-01',
        amount: 1800000,
        status: 'Unpaid'
      }
    ]);
    setDebugInfo(prev => `${prev || ''}\nMenampilkan data contoh untuk demonstrasi`);
  };
  
  // Toggle dummy data function
  const toggleDummyData = () => {
    setUseDummyData(!useDummyData);
  };
  
  if (loading) {
    return (
      <Layout variant="participant">
        <div className="p-4">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout variant="participant">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Kursus Terdaftar</h1>
          <button 
            onClick={toggleDummyData}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
          >
            {useDummyData ? 'Gunakan API Data' : 'Tampilkan Contoh'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-4 text-sm">
            <p className="font-semibold">Informasi Debug:</p>
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => {
                  localStorage.removeItem('userEmail');
                  window.location.reload();
                }}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reset Email
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('userEmail', 'demo@example.com');
                  window.location.reload();
                }}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Set Demo Email
              </button>
            </div>
          </div>
        )}
        
        {registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Anda belum terdaftar di kursus apapun.</p>
            <div className="flex flex-col gap-2 items-center mt-4">
              <Link href="/participant/my-course" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Jelajahi Kursus
              </Link>
              <button
                onClick={() => setUseDummyData(true)}
                className="px-4 py-2 text-sm text-blue-600 hover:underline"
              >
                Tampilkan Data Contoh
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registrations.map((registration) => (
              <div key={registration.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-800">{registration.courseName}</h2>
                  <p className="text-sm text-gray-500">{registration.className}</p>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Jadwal:</span>
                    <span>{registration.schedule}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tanggal Registrasi:</span>
                    <span>{registration.registrationDate}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(registration.amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status Pembayaran:</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      registration.status === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.status === 'Paid' ? 'Dibayar' : 'Belum Dibayar'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 flex justify-between">
                  <Link href={`/participant/courses/${registration.courseId}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    Detail Kursus
                  </Link>
                  
                  {registration.status === 'Unpaid' && (
                    <Link href={`/participant/payment/${registration.id}`} className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                      Bayar Sekarang
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 