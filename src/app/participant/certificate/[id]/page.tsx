"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/common/Layout";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface CertificateDetail {
  id: string;
  name: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  pdfUrl: string | null;
  driveLink: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export default function ParticipantCertificateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [certificate, setCertificate] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificate() {
      try {
        const response = await fetch(`/api/certificate/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Sertifikat tidak ditemukan");
            router.push("/participant/my-certificate");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCertificate(data);
      } catch (error) {
        console.error("Failed to fetch certificate:", error);
        setError("Gagal memuat detail sertifikat");
        toast.error("Gagal memuat detail sertifikat");
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [id, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const handlePrint = () => {
    window.open(`/certificate/${id}/print`, '_blank');
  };

  // Fungsi untuk mengubah URL Google Drive menjadi URL embed
  const getGoogleDriveEmbedUrl = (driveUrl: string) => {
    // Format URL Google Drive: https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
    const fileIdMatch = driveUrl.match(/\/d\/(.+?)\/|id=(.+?)&/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1] || fileIdMatch[2];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return driveUrl; // Return original URL if pattern doesn't match
  };

  if (loading) {
    return (
      <Layout variant="participant">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !certificate) {
    return (
      <Layout variant="participant">
        <div className="p-4">
          <div className="text-center p-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">{error || "Sertifikat tidak ditemukan"}</p>
            <Link 
              href="/participant/my-certificate"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Kembali ke Sertifikat
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout variant="participant">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link 
              href="/participant/my-certificate" 
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </Link>
            <h1 className="text-xl font-semibold ml-2">Detail Sertifikat</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            >
              <Printer size={16} />
              Cetak
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white shadow rounded-lg p-5 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Informasi Sertifikat</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nama</p>
                  <p className="font-medium">{certificate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nomor Sertifikat</p>
                  <p className="font-medium">{certificate.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Terbit</p>
                  <p className="font-medium">{formatDate(certificate.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Kadaluarsa</p>
                  <p className="font-medium">{formatDate(certificate.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    certificate.status === 'Valid' 
                      ? 'bg-green-100 text-green-800' 
                      : certificate.status === 'Expired' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {certificate.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Informasi Terkait</h2>
              <div className="space-y-4">
                {certificate.course && (
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">Kursus</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{certificate.course.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Dokumen Sertifikat</h2>
            
            {certificate.driveLink && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 mb-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">Google Drive</p>
                    <p className="text-xs text-gray-500">Akses sertifikat Anda di Google Drive</p>
                  </div>
                  <a 
                    href={certificate.driveLink} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    <Download size={14} />
                    Buka Drive
                  </a>
                </div>
                
                {/* Google Drive PDF Preview */}
                <div className="border rounded-md overflow-hidden">
                  <iframe 
                    src={getGoogleDriveEmbedUrl(certificate.driveLink)} 
                    className="w-full h-[500px] border-0"
                    title="Certificate PDF from Google Drive"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            
            {certificate.pdfUrl ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 mb-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">Sertifikat PDF</p>
                    <p className="text-xs text-gray-500">Lihat dan unduh sertifikat Anda di sini</p>
                  </div>
                  <a 
                    href={certificate.pdfUrl} 
                    download={`Sertifikat-${certificate.certificateNumber}.pdf`}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    <Download size={14} />
                    Unduh
                  </a>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <iframe 
                    src={certificate.pdfUrl} 
                    className="w-full h-[500px] border-0"
                    title="Certificate PDF"
                  />
                </div>
              </div>
            ) : !certificate.driveLink ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Dokumen sertifikat tidak tersedia</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
} 