"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ParticipantLayout from "@/components/layouts/ParticipantLayout";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
}

export default function PaymentPrintPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [dataReady, setDataReady] = useState(false);
  
  // Fetch payment details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch payment details
        const response = await fetch(`/api/payment/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch payment details: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Payment data fetched successfully:", data);
        setPaymentDetails(data);
        
        // Fetch bank accounts
        try {
          const bankResponse = await fetch('/api/bank-accounts');
          if (bankResponse.ok) {
            const bankData = await bankResponse.json();
            setBankAccounts(bankData.data || []);
          }
        } catch (bankError) {
          console.error("Error fetching bank accounts:", bankError);
          // Not setting error as this is not critical
        }
        
        setError(null);
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(err instanceof Error ? err.message : "Failed to load payment details");
      } finally {
        setLoading(false);
        setDataReady(true);
      }
    };
    
    fetchData();
  }, [id]);

  // Handle printing after data is loaded
  useEffect(() => {
    if (dataReady && paymentDetails && !loading && !error) {
      // Give UI time to render before printing
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (printError) {
          console.error("Error during printing:", printError);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [dataReady, paymentDetails, loading, error]);
  
  // Handle loading state
  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error || !paymentDetails) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium text-lg mb-2">Error</h3>
          <p className="text-red-700">{error || "Gagal memuat detail pembayaran"}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ParticipantLayout>
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#362d98] text-white py-4 px-6 mb-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="font-bold text-2xl">Train4Best</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</div>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Detail Pembayaran</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Informasi Kursus</h2>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
            <span className="text-gray-600">Kursus:</span>
            <span className="font-medium text-gray-800">{paymentDetails.courseName || 'N/A'}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
            <span className="text-gray-600">Kelas:</span>
            <span className="font-medium text-gray-800">{paymentDetails.className || 'N/A'}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
            <span className="text-gray-600">Jumlah Pembayaran:</span>
            <span className="font-medium text-gray-800">
              {typeof paymentDetails.amount === 'number' && !isNaN(paymentDetails.amount) ? 
                `Rp${paymentDetails.amount.toLocaleString('id-ID')}` : 
                typeof paymentDetails.paymentAmount === 'number' && !isNaN(paymentDetails.paymentAmount) ?
                  `Rp${paymentDetails.paymentAmount.toLocaleString('id-ID')}` : 'Rp0'}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
            <span className="text-gray-600">Nomor Referensi:</span>
            <span className="font-medium text-gray-800">{paymentDetails.referenceNumber || 'N/A'}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              paymentDetails.paymentStatus === 'Paid' ? 'text-green-700' : 
              paymentDetails.paymentStatus === 'Pending' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {paymentDetails.paymentStatus === 'Paid' ? 'Lunas' : 
               paymentDetails.paymentStatus === 'Pending' ? 'Menunggu Verifikasi' : 
               paymentDetails.paymentStatus || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Informasi Rekening Bank</h2>
        </div>
        
        <div className="p-4 space-y-3">
          {bankAccounts.length > 0 ? (
            bankAccounts.map((bank) => (
              <div key={bank.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                <div>
                  <span className="block text-gray-600">Nama Bank:</span>
                  <span className="font-medium text-gray-800">{bank.bankName}</span>
                </div>
                <div>
                  <span className="block text-gray-600">Nomor Rekening:</span>
                  <span className="font-medium text-gray-800">{bank.accountNumber}</span>
                </div>
                <div>
                  <span className="block text-gray-600">Nama Pemilik Rekening:</span>
                  <span className="font-medium text-gray-800">{bank.accountName}</span>
                </div>
              </div>
            ))
          ) : (
            <div>
              <div>
                <span className="block text-gray-600">Nama Bank:</span>
                <span className="font-medium text-gray-800">Bank BCA</span>
              </div>
              <div>
                <span className="block text-gray-600">Nomor Rekening:</span>
                <span className="font-medium text-gray-800">0123456789</span>
              </div>
              <div>
                <span className="block text-gray-600">Nama Pemilik Rekening:</span>
                <span className="font-medium text-gray-800">Train4Best Indonesia</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Display payment proof if available */}
      {paymentDetails.paymentProof && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Bukti Pembayaran</h2>
          </div>
          
          <div className="p-4">
            {paymentDetails.paymentProof.endsWith('.pdf') ? (
              <div className="flex flex-col items-center">
                <p className="text-gray-700 mb-4 text-center font-medium">Dokumen PDF tersedia namun tidak dapat ditampilkan pada cetakan.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-gray-700 mb-4 text-center font-medium">Bukti Pembayaran</p>
                <div className="max-w-xs mx-auto">
                  <img
                    src={paymentDetails.paymentProof}
                    alt="Bukti pembayaran"
                    className="w-full h-auto rounded-md shadow-sm"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/img/LogoT4B.png';
                      e.currentTarget.style.opacity = '0.5';
                      e.currentTarget.style.maxWidth = '100px';
                      e.currentTarget.parentElement?.insertAdjacentHTML(
                        'afterend',
                        '<p class="text-red-500 text-sm mt-2">Gambar bukti pembayaran tidak dapat dimuat</p>'
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t border-gray-300">
        <p className="text-gray-500 text-sm">Dokumen ini dicetak dari sistem Train4Best pada {new Date().toLocaleString('id-ID')}</p>
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Train4Best Indonesia</p>
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 1cm;
        }
        
        body {
          font-family: Arial, sans-serif;
          color: #333;
          background-color: white !important;
          margin: 0;
          padding: 0;
        }
        
        .bg-\\[\\#362d98\\] {
          background-color: #362d98 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .bg-gray-50 {
          background-color: #f9fafb !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .text-green-700 { color: #047857 !important; }
        .text-yellow-700 { color: #a16207 !important; }
        .text-red-700 { color: #b91c1c !important; }
        
        @media print {
          button {
            display: none !important;
          }
          
          .animate-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
    </ParticipantLayout>
  );
} 