"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/common/Layout";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Image as ImageIcon, Printer } from "lucide-react";
import { toast } from "react-hot-toast";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showFullImage, setShowFullImage] = useState(false);
  
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/payment/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch payment details: ${response.status}`);
        }
        const data = await response.json();
        setPaymentDetails(data);
      } catch (err) {
        console.error("Error fetching payment details:", err);
        setError("Failed to fetch payment details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchBankAccounts = async () => {
      try {
        const response = await fetch('/api/bank-accounts');
        if (response.ok) {
          const data = await response.json();
          setBankAccounts(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error);
      }
    };
    
    fetchPaymentDetails();
    fetchBankAccounts();
  }, [id]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Please select a valid file (JPEG, PNG, or PDF)");
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreviewUrl(null);
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('paymentProof', file);
      formData.append('registrationId', paymentDetails.registrationId || id as string);
      
      const response = await fetch(`/api/payment/upload-proof`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload payment proof");
      }
      
      setUploadSuccess(true);
      toast.success("Payment proof uploaded successfully");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error("Error uploading payment proof:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload payment proof");
      toast.error(err instanceof Error ? err.message : "Failed to upload payment proof");
    } finally {
      setUploading(false);
    }
  };
  
  const toggleFullImage = () => setShowFullImage(!showFullImage);
  const goToPrintVersion = () => window.open(`/participant/payment/${id}/print`, '_blank');
  
  if (loading) {
    return (
      <Layout variant="participant">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }
  
  if (error || !paymentDetails) {
    return (
      <Layout variant="participant">
        <div className="p-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5" size={18} />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm">{error || "Failed to load payment details"}</p>
              <button 
                onClick={() => router.back()}
                className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <ArrowLeft size={14} className="mr-1" /> Go Back
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout variant="participant">
      <div className="hidden print:block bg-[#362d98] text-white py-3 px-4 mb-3">
        <div className="flex justify-between items-center">
          <div className="font-bold text-xl">Train4Best</div>
          <div className="text-sm">Print Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="p-3 max-w-3xl mx-auto">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 flex items-center mr-3 print:hidden"
            >
              <ArrowLeft size={16} className="mr-1" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Payment Details</h1>
          </div>
          <button
            onClick={goToPrintVersion}
            className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden"
          >
            <Printer size={14} className="mr-1" /> Print
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Course Information */}
          <div className="p-3 border-b">
            <h2 className="text-base font-semibold text-gray-800">Course Information</h2>
          </div>
          
          <div className="p-3 space-y-2 text-sm">
            <div className="grid grid-cols-2">
              <span className="text-gray-600">Course:</span>
              <span className="font-medium text-gray-800">{paymentDetails.courseName}</span>
            </div>
            
            <div className="grid grid-cols-2">
              <span className="text-gray-600">Class:</span>
              <span className="font-medium text-gray-800">{paymentDetails.className}</span>
            </div>
            
            <div className="grid grid-cols-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-800">
                {typeof paymentDetails.amount === 'number' && !isNaN(paymentDetails.amount) ? 
                  `Rp${paymentDetails.amount.toLocaleString('id-ID')}` : 
                  typeof paymentDetails.paymentAmount === 'number' && !isNaN(paymentDetails.paymentAmount) ?
                    `Rp${paymentDetails.paymentAmount.toLocaleString('id-ID')}` : 'Rp0'}
              </span>
            </div>
            
            <div className="grid grid-cols-2">
              <span className="text-gray-600">Reference:</span>
              <span className="font-medium text-gray-800">{paymentDetails.referenceNumber}</span>
            </div>
            
            <div className="grid grid-cols-2">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                paymentDetails.paymentStatus === 'Paid' ? 'text-green-600' : 
                paymentDetails.paymentStatus === 'Pending' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {paymentDetails.paymentStatus}
              </span>
            </div>
          </div>
          
          {/* Bank Information */}
          <div className="p-3 border-t">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Bank Transfer Information</h2>
            
            <div className="border border-gray-200 rounded-md p-3 space-y-2 text-sm">
              {bankAccounts.length > 0 ? (
                bankAccounts.map((bank) => (
                  <div key={bank.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium text-gray-800">{bank.bankName}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-medium text-gray-800">{bank.accountNumber}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-800">{bank.accountName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium text-gray-800">Bank BCA</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Account:</span>
                    <span className="font-medium text-gray-800">0123456789</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-800">Train4Best Indonesia</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Proof */}
          {paymentDetails.paymentProof && (
            <div className="p-3 border-t">
              <h2 className="text-base font-semibold text-gray-800 mb-2">Bukti Pembayaran</h2>
              
              <div className="border border-gray-200 rounded-md p-3">
                {paymentDetails.paymentProof.endsWith('.pdf') ? (
                  <div className="text-center py-2">
                    <a
                      href={paymentDetails.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Lihat PDF
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`relative ${showFullImage ? 'w-full' : 'max-w-xs'}`}>
                      <img
                        src={paymentDetails.paymentProof}
                        alt="Bukti pembayaran"
                        className={`w-full h-auto rounded-md ${showFullImage ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                        onClick={toggleFullImage}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/img/LogoT4B.png';
                          e.currentTarget.style.opacity = '0.5';
                          e.currentTarget.style.maxWidth = '100px';
                        }}
                      />
                      <button
                        onClick={toggleFullImage}
                        className="absolute top-1 right-1 bg-white p-1 rounded-full shadow-sm hover:bg-gray-100 print:hidden"
                        title={showFullImage ? "Perkecil" : "Perbesar"}
                      >
                        <ImageIcon size={14} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Display if no payment proof */}
          {!paymentDetails.paymentProof && (
            <div className="p-3 border-t">
              <h2 className="text-base font-semibold text-gray-800 mb-2">Bukti Pembayaran</h2>
              <div className="border border-gray-200 rounded-md p-3">
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Belum ada bukti pembayaran yang diunggah
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Upload Section - Only show if payment is not paid */}
         
        </div>

        {/* Print footer */}
        <div className="hidden print:block text-center mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500">
          <p>Dokumen ini dicetak dari sistem Train4Best pada {new Date().toLocaleString()}</p>
          <p>© {new Date().getFullYear()} Train4Best Indonesia</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:block { display: block !important; }
          .bg-\\[\\#362d98\\] {
            background-color: #362d98 !important;
            print-color-adjust: exact !important;
          }
          body { font-size: 11pt; color: black; }
          nav, footer, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </Layout>
  );
} 