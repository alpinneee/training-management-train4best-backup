"use client";

import React, { useState, useEffect } from "react";
import InstructureLayout from "@/components/layouts/InstructureLayout";
import { X, Download, Eye, ExternalLink, Award } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";

// Function to convert Google Drive URL to embed URL
const getGoogleDriveEmbedUrl = (driveUrl: string) => {
  // Format URL Google Drive: https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
  const fileIdMatch = driveUrl.match(/\/d\/(.+?)\/|id=(.+?)&/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1] || fileIdMatch[2];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return driveUrl; // Return original URL if pattern doesn't match
};

// Modal component for preview
const PreviewModal = ({
  isOpen,
  onClose,
  driveLink,
  certificateNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  driveLink: string;
  certificateNumber: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-medium text-sm sm:text-base">
            Certificate #{certificateNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={getGoogleDriveEmbedUrl(driveLink)}
            className="w-full h-full border-0"
            title="Certificate Preview"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

// Modal component for certificate details - Simplified version
const CertificateDetailModal = ({
  isOpen,
  onClose,
  certificateId,
}: {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
}) => {
  interface CertificateDetail {
    id: string;
    name: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    pdfUrl?: string;
    driveLink?: string;
    email?: string;
    course?: {
      id: string;
      name: string;
    };
  }

  const [certificate, setCertificate] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !certificateId) return;

    const fetchCertificateDetail = async () => {
      setLoading(true);
      try {
        // Using the non-authenticated endpoint
        const response = await fetch(`/api/certificate/${certificateId}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Certificate not found");
            onClose();
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setCertificate(data);
      } catch (error) {
        console.error("Failed to fetch certificate:", error);
        setError("Failed to load certificate details");
        toast.error("Failed to load certificate details");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateDetail();
  }, [isOpen, certificateId, onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-medium text-gray-700 text-sm sm:text-base">Certificate Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : certificate ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-sm text-gray-700">{certificate.name}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Certificate Number</p>
                  <p className="font-medium text-sm text-gray-700">{certificate.certificateNumber}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Issue Date</p>
                  <p className="font-medium text-sm text-gray-700">{formatDate(certificate.issueDate)}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Expiry Date</p>
                  <p className="font-medium text-sm text-gray-700">{formatDate(certificate.expiryDate)}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      certificate.status === "Valid"
                        ? "bg-green-100 text-green-800"
                        : certificate.status === "Expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {certificate.status}
                  </span>
                </div>
                
                {certificate.course && (
                  <div>
                    <p className="text-xs text-gray-500">Course</p>
                    <p className="font-medium text-sm text-gray-700">{certificate.course.name}</p>
                  </div>
                )}
              </div>

              {/* Certificate Document Section */}
              {certificate.driveLink && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium mb-2">Certificate Document</p>
                  <div className="border rounded overflow-hidden">
                    <iframe
                      src={getGoogleDriveEmbedUrl(certificate.driveLink)}
                      className="w-full h-[250px] border-0"
                      title="Certificate PDF"
                    />
                  </div>
                  <a
                    href={certificate.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center py-2 w-full bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    <Download size={14} className="mr-1" />
                    Download Certificate
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

interface Certificate {
  id: string;
  certificateNumber: string;
  issueDate: Date;
  courseName: string;
  courseType?: string;
  courseImage?: string;
  status: string;
  driveLink?: string | null;
  email?: string;
}

export default function InstructureCertificatePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    driveLink: "",
    certificateNumber: "",
  });
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    certificateId: "",
  });
  const [instructureId, setInstructureId] = useState<string>("");
  const [instructureName, setInstructureName] = useState<string>("");
  
  // Effect to check for ID in URL on mount
  useEffect(() => {
    // Get ID from URL query parameter
    const url = new URL(window.location.href);
    const idFromUrl = url.searchParams.get('id');
    
    if (idFromUrl) {
      setInstructureId(idFromUrl);
      fetchCertificates(idFromUrl);
    } else {
      // Try to get current user's instructure ID
      fetchCurrentInstructureId();
    }
  }, []);
  
  // Tambahan: fungsi untuk mendapatkan ID instructure dari sesi saat ini
  const fetchCurrentInstructureId = async () => {
    try {
      const response = await fetch('/api/instructure/me');
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      if (data.instructure?.id) {
        setInstructureId(data.instructure.id);
        setInstructureName(data.instructure.name || data.instructure.full_name || "");
        fetchCertificates(data.instructure.id);
      }
    } catch (error) {
      console.error("Error fetching current instructure:", error);
    }
  };

  const fetchCertificates = async (id: string) => {
    if (!id) {
      toast.error("ID Instruktur diperlukan");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/instructure/certificate/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructureId: id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.certificates?.length > 0) {
          setCertificates(data.certificates || []);
          setInstructureName(data.instructure?.name || "");
          toast.success(`${data.certificates.length} sertifikat ditemukan`);
        } else {
          setCertificates([]);
          setInstructureName(data.instructure?.name || "");
          setError("Tidak ada sertifikat ditemukan");
        }
      } else {
        toast.error(data.error || "Gagal memuat sertifikat");
        setError(data.error || "Gagal memuat sertifikat");
        setCertificates([]);
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
      setError("Gagal memuat sertifikat. Silakan coba lagi.");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openPreview = (driveLink: string, certificateNumber: string) => {
    setPreviewModal({
      isOpen: true,
      driveLink,
      certificateNumber,
    });
  };

  const closePreview = () => {
    setPreviewModal({
      isOpen: false,
      driveLink: "",
      certificateNumber: "",
    });
  };

  const openDetailModal = (certificateId: string) => {
    setDetailModal({
      isOpen: true,
      certificateId,
    });
  };

  const closeDetailModal = () => {
    setDetailModal({
      isOpen: false,
      certificateId: "",
    });
  };

  // Handler login jika perlu
  const handleLogin = () => {
    window.location.href = "/login";
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates(instructureId);
  };

  return (
    <InstructureLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <Award size={20} className="mr-2 text-blue-600" /> 
            {instructureName ? `${instructureName}'s Certificates` : "Certificates"}
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
          </div>
        ) : error ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4 text-sm">
            <p>{error}</p>
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-800 text-sm">
                      {cert.courseName || "Certificate"}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        cert.status === "Valid"
                          ? "bg-green-100 text-green-800"
                          : cert.status === "Expired"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {cert.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div>
                      <p className="text-xs text-gray-500">Certificate Number</p>
                      <p className="font-medium text-xs text-gray-700">
                        {cert.certificateNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Issue Date</p>
                      <p className="font-medium text-xs text-gray-700">
                        {formatDate(cert.issueDate.toString())}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <button
                      onClick={() => openDetailModal(cert.id)}
                      className="flex items-center justify-center py-1 px-2 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye size={12} className="mr-1" />
                      Details
                    </button>

                    {cert.driveLink && (
                      <button
                        onClick={() => openPreview(cert.driveLink!, cert.certificateNumber)}
                        className="flex items-center justify-center py-1 px-2 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye size={12} className="mr-1" />
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : instructureId && !loading && certificates.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
            <Award size={40} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No certificates found</p>
          </div>
        ) : null}

        {/* Add search form when no ID is provided */}
        {!instructureId && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-4 max-w-md mx-auto my-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Find Instructor Certificates</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="instructureId" className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor ID
                </label>
                <input
                  id="instructureId"
                  type="text"
                  value={instructureId}
                  onChange={(e) => setInstructureId(e.target.value)}
                  placeholder="Enter instructor ID"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Find Certificates
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Certificate Detail Modal */}
      <CertificateDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        certificateId={detailModal.certificateId}
      />

      {/* Certificate Preview Modal */}
      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreview}
        driveLink={previewModal.driveLink}
        certificateNumber={previewModal.certificateNumber}
      />
    </InstructureLayout>
  );
}
