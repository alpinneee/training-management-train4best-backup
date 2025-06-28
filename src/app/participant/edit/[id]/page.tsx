"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/common/button";
import Layout from "@/components/common/Layout";

interface Participant {
  id: string;
  name: string;
  role: string;
  photo?: string;
  address: string;
  phone_number: string;
  birth_date: string;
  job_title?: string;
  company?: string;
  gender: string;
  email?: string;
  username?: string;
  userTypeId?: string;
}

const EditParticipantPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    gender: '',
    phone_number: '',
    address: '',
    birth_date: '',
    job_title: '',
    company: '',
    photo: '',
    userTypeId: '',
  });

  // Mengambil data participant
  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/participant/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch participant');
        }
        
        const data = await response.json();
        
        // Format tanggal untuk input date
        let birthDate = '';
        if (data.birth_date) {
          const date = new Date(data.birth_date);
          if (!isNaN(date.getTime())) {
            birthDate = date.toISOString().split('T')[0];
          }
        }
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          password: '', // Kosong karena biasanya tidak menampilkan password
          gender: data.gender || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
          birth_date: birthDate,
          job_title: data.job_title || '',
          company: data.company || '',
          photo: data.photo || '',
          userTypeId: data.userTypeId || '',
        });
        
      } catch (err) {
        console.error('Error fetching participant:', err);
        setError('Failed to load participant data');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchParticipant();
    }
  }, [id]);

  // Menangani perubahan input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Menyimpan perubahan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.gender || !formData.phone_number || !formData.address || !formData.birth_date) {
      alert('Mohon lengkapi semua data yang wajib diisi');
      return;
    }
    
    try {
      setSaving(true);
      
      // Filter data yang akan dikirim (hanya kirim password jika diisi)
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      
      const response = await fetch(`/api/participant/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update participant');
      }
      
      alert('Data berhasil disimpan');
      router.push('/participant');
      
    } catch (err) {
      console.error('Error updating participant:', err);
      alert(err instanceof Error ? err.message : 'Failed to update participant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-xl text-gray-600">Edit Participant</h1>
          <Button
            variant="gray"
            size="small"
            onClick={() => router.back()}
            className="text-xs px-2 py-1"
          >
            Back
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password (kosongkan jika tidak diubah)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nomor Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Perusahaan
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    URL Foto
                  </label>
                  <input
                    type="text"
                    name="photo"
                    value={formData.photo}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="http://example.com/photo.jpg"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-4 pt-2 border-t">
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  disabled={saving}
                  className="text-xs px-4 py-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default EditParticipantPage; 