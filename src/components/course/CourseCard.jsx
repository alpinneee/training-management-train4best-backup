import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const CourseCard = ({ 
  id, 
  title, 
  type, 
  image, 
  className, 
  startDate, 
  endDate, 
  price, 
  location, 
  room, 
  quota, 
  onRegister,
  isPendingRegistration = false,
  registrationId = null,
  isPaidRegistration = false
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Format harga ke format rupiah
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Format tanggal
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const handleButtonClick = async () => {
    if (isPaidRegistration) {
      // Navigate to course schedule detail page
      router.push(`/participant/my-course/${id}`);
    } else if (isPendingRegistration && registrationId) {
      // Panggil fungsi onRegister dengan parameter tambahan untuk menunjukkan ini adalah lanjutan pembayaran
      onRegister(id, title, className, registrationId);
    } else if (onRegister) {
      // Jika belum terdaftar, panggil fungsi pendaftaran biasa
      onRegister(id, title, className);
    }
  };

  return (
    <div className="bg-white rounded shadow overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-200">
      <div className="relative h-32 bg-blue-50">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-xl font-bold text-blue-500">{title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-1 right-1">
          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {type}
          </span>
        </div>
      </div>
      
      <div className="p-2.5 bg-gray-50">
        <h3 className="text-base font-semibold text-gray-800 mb-1.5 line-clamp-1">{title}</h3>
        
        <div className="space-y-1 mb-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Jadwal:</span>
            <span className="text-gray-800 font-medium">{className}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Mulai:</span>
            <span className="text-gray-800">{formatDate(startDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Selesai:</span>
            <span className="text-gray-800">{formatDate(endDate)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Lokasi:</span>
            <span className="text-gray-800">{location} ({room})</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Kuota:</span>
            <span className="text-gray-800">{quota} peserta</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Biaya:</span>
            <span className="text-gray-800 font-semibold">{formatPrice(price)}</span>
          </div>
        </div>
        
        <button
          onClick={handleButtonClick}
          disabled={loading}
          className={`w-full ${
            isPaidRegistration 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : isPendingRegistration 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-green-500 hover:bg-green-600'
          } text-white font-medium py-1.5 text-sm rounded transition-colors duration-300 disabled:bg-gray-400`}
        >
          {loading 
            ? 'Memproses...' 
            : isPaidRegistration 
              ? 'Detail' 
              : isPendingRegistration 
                ? 'Lanjutkan Pembayaran' 
                : 'Daftar'}
        </button>
      </div>
    </div>
  );
};

export default CourseCard; 