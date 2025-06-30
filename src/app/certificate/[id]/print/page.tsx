"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

interface CertificateDetail {
  id: string;
  name: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  participant: {
    id: string;
    name: string;
    company: string;
    jobTitle: string;
  } | null;
  course: {
    id: string;
    name: string;
  } | null;
}

export default function CertificatePrintPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [certificate, setCertificate] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificate() {
      try {
        const response = await fetch(`/api/certificate/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Sertifikat tidak ditemukan");
            router.push("/certificate-expired");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCertificate(data);
      } catch (error) {
        console.error("Failed to fetch certificate:", error);
        toast.error("Gagal memuat detail sertifikat");
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [params.id, router]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="p-4">
        <div className="text-center p-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">Sertifikat tidak ditemukan</p>
          <Link 
            href="/certificate-expired"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Kembali ke Sertifikat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation - Only visible when not printing */}
      <div className="p-4 mb-6 print:hidden">
        <div className="flex justify-between items-center">
          <Link 
            href="/participant/my-certificate"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={18} />
            <span>Kembali ke Sertifikat</span>
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Printer size={16} />
            <span>Cetak Sertifikat</span>
          </button>
        </div>
      </div>

      {/* Certificate Print Layout */}
      <div className="max-w-4xl mx-auto p-4 print:p-0">
        <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm print:shadow-none print:border-0">
          {/* Certificate Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-blue-800 mb-1">SERTIFIKAT</h1>
            <p className="text-lg text-gray-600">PENGHARGAAN</p>
          </div>
          
          {/* Certificate Body */}
          <div className="text-center mb-10">
            <p className="text-lg mb-6">Diberikan kepada</p>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-gray-300 pb-2 inline-block">
              {certificate.name}
            </h2>
            <p className="text-lg mb-8">
              yang telah berhasil menyelesaikan pelatihan
            </p>
            <h3 className="text-2xl font-bold mb-8 text-gray-800">
              {certificate.course?.name || "Program Pelatihan"}
            </h3>
            <p className="text-lg">
              Diterbitkan pada {formatDate(certificate.issueDate)}
            </p>
            <p className="text-lg">
              Berlaku hingga {formatDate(certificate.expiryDate)}
            </p>
          </div>
          
          {/* Certificate Footer */}
          <div className="mt-16 grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="h-16 border-b border-gray-400 mb-2"></div>
              <p className="text-gray-600">Direktur Pelatihan</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-gray-400 mb-2"></div>
              <p className="text-gray-600">Koordinator Program</p>
            </div>
          </div>
          
          {/* Certificate Number */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">Nomor Sertifikat: {certificate.certificateNumber}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 