'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface ApiResponse {
  pesan: string;
  status: string;
  waktu: string;
  [key: string]: any;
}

export default function ApiTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [formData, setFormData] = useState({
    name: 'Test User',
    message: 'Ini adalah pesan test dari frontend Next.js'
  });

  // Fungsi untuk menguji koneksi GET
  const testGetRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('frontend-test');
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi API');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menguji koneksi POST
  const testPostRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('frontend-submit', {
        ...formData,
        timestamp: new Date().toISOString()
      });
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim data ke API');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menangani perubahan input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Test Koneksi Backend Laravel</h2>
      
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h3 className="text-xl font-semibold mb-4">GET Request Test</h3>
        <button 
          onClick={testGetRequest}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Test GET Request'}
        </button>
      </div>
      
      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h3 className="text-xl font-semibold mb-4">POST Request Test</h3>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Nama:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Pesan:</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button 
          onClick={testPostRequest}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300"
        >
          {loading ? 'Loading...' : 'Test POST Request'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {response && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
          <h3 className="font-semibold mb-2">Hasil:</h3>
          <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 