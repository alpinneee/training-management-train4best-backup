'use client';

import { useState, useEffect } from 'react';
import ParticipantLayout from '@/components/layouts/ParticipantLayout';
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
  
  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get user email from localStorage if available
        const userEmail = localStorage.getItem('userEmail');
        console.log('Attempting to fetch registrations with user email:', userEmail);
        
        // Build API URL with email parameter if available
        let url = '/api/registration?limit=50';
        if (userEmail) {
          url += `&email=${encodeURIComponent(userEmail)}&filterByUser=true`;
        }
        
        console.log('Fetching registrations from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Registration API response:', data);
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setRegistrations(data.data);
          setDebugInfo(`Ditemukan ${data.data.length} pendaftaran kursus.`);
        } else {
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
  }, []);
  
  if (loading) {
    return (
      <ParticipantLayout>
        <div className="p-4">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </ParticipantLayout>
    );
  }
  
  return (
    <ParticipantLayout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Kursus Terdaftar</h1>
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
    </ParticipantLayout>
  );
} 