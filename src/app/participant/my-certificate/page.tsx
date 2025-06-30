"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Layout from "@/components/common/Layout";
import { X, Download, Eye, Printer, Info } from "lucide-react";
import { toast } from "react-hot-toast";

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

// Modal component for preview
const PreviewModal = ({ 
  isOpen, 
  onClose, 
  driveLink, 
  certificateNumber 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  driveLink: string;
  certificateNumber: string;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">Certificate Preview #{certificateNumber}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
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

// Modal component for certificate details
const CertificateDetailModal = ({ 
  isOpen, 
  onClose, 
  certificateId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  certificateId: string;
}) => {
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !certificateId) return;

    const fetchCertificateDetail = async () => {
      setLoading(true);
      try {
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
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.open(`/certificate/${certificateId}/print`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium text-gray-700">Certificate Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center p-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">{error}</p>
            </div>
          ) : certificate ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="bg-white border rounded-lg p-5 mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">Certificate Information</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-700">{certificate.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Certificate Number</p>
                      <p className="font-medium text-gray-700">{certificate.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium text-gray-700">{formatDate(certificate.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="font-medium text-gray-700">{formatDate(certificate.expiryDate)}</p>
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
                        <p className="font-medium text-gray-700">{certificate.status}</p>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-5">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">Related Information</h2>
                  <div className="space-y-4">
                    {certificate.course && (
                      <div>
                        <h3 className="text-sm text-gray-500 mb-2">Course</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="font-medium text-gray-700">{certificate.course.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Certificate Documents</h2>
                
                {certificate.driveLink && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 mb-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Google Drive</p>
                        <p className="text-xs text-gray-500">Access your certificate on Google Drive</p>
                      </div>
                      <a 
                        href={certificate.driveLink} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        <Download size={14} />
                        Open Drive
                      </a>
                    </div>
                    
                    {/* Google Drive PDF Preview */}
                    <div className="border rounded-md overflow-hidden">
                      <iframe 
                        src={getGoogleDriveEmbedUrl(certificate.driveLink)} 
                        className="w-full h-[400px] border-0"
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
                        <p className="font-medium text-sm">Certificate PDF</p>
                        <p className="text-xs text-gray-500">View and download your certificate here</p>
                      </div>
                      <a 
                        href={certificate.pdfUrl} 
                        download={`Certificate-${certificate.certificateNumber}.pdf`}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <iframe 
                        src={certificate.pdfUrl} 
                        className="w-full h-[400px] border-0"
                        title="Certificate PDF"
                      />
                    </div>
                  </div>
                ) : !certificate.driveLink ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Certificate document not available</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">Certificate not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Interface untuk tipe data sertifikat
interface Certificate {
  id: string;
  certificateNumber: string;
  issueDate: Date;
  courseName: string;
  courseType: string;
  location: string;
  startDate: Date;
  endDate: Date;
  participantName: string;
  description: string[];
  driveLink?: string | null;
}

const MyCertificatePage = () => {
  const [search, setSearch] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    driveLink: "",
    certificateNumber: ""
  });
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    certificateId: ""
  });
  
  // Fungsi untuk mengambil data sertifikat dari API
  const fetchCertificates = useCallback(async (pageNum: number = 1, searchTerm: string = "") => {
    setLoading(true);
    try {
      // Ambil email user dari localStorage (jika ada)
      const userEmail = localStorage.getItem('userEmail') || '';
      
      // Buat URL untuk fetch dengan parameter
      let url = `/api/certificate?page=${pageNum}&limit=20`;
      if (userEmail) url += `&email=${encodeURIComponent(userEmail)}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      
      // Tambahkan timestamp untuk menghindari cache
      url += `&_=${new Date().getTime()}`;
      
      console.log("Fetching certificates from:", url);
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      if (data && data.data) {
        setCertificates(data.data);
        if (data.meta) {
          setTotalPages(data.meta.totalPages || 1);
        }
      } else {
        setCertificates([]);
        setTotalPages(1);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError("Failed to fetch certificate data. Please try again later.");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Effect untuk mengambil data saat pertama kali atau saat page/search berubah
  useEffect(() => {
    fetchCertificates(page, search);
  }, [fetchCertificates, page, search]);
  
  // Handler untuk pencarian
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1); // Reset ke halaman pertama saat pencarian berubah
  };
  
  // Handler untuk pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Filter sertifikat berdasarkan pencarian (dilakukan di client jika sudah ada data)
  const filteredCertificates = certificates.filter((cert) =>
    cert.courseName.toLowerCase().includes(search.toLowerCase())
  );

  const openPreview = (driveLink: string, certificateNumber: string) => {
    setPreviewModal({
      isOpen: true,
      driveLink,
      certificateNumber
    });
  };
  
  const closePreview = () => {
    setPreviewModal({
      isOpen: false,
      driveLink: "",
      certificateNumber: ""
    });
  };

  const openDetailModal = (certificateId: string) => {
    setDetailModal({
      isOpen: true,
      certificateId
    });
  };

  const closeDetailModal = () => {
    setDetailModal({
      isOpen: false,
      certificateId: ""
    });
  };

  return (
    <Layout variant="participant">
      <div className="p-3 sm:p-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3">
          <h1 className="text-xl font-semibold text-gray-700 mb-2 sm:mb-0">
            My Certificates
          </h1>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={handleSearch}
              className="w-full px-3 py-1.5 rounded border text-sm text-gray-700 border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
            {error}
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No certificates found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCertificates.map((cert) => (
              <div key={cert.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3">
                  <h2 className="font-medium text-blue-800 truncate">{cert.courseName}</h2>
                  <p className="text-xs text-gray-600">{cert.courseType}</p>
                </div>
                
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Certificate Number</p>
                    <p className="text-sm font-medium text-gray-700">{cert.certificateNumber}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Issue Date</p>
                    <p className="text-sm text-gray-700">
                      {new Date(cert.issueDate).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    {cert.driveLink && (
                      <>
                    <a
                          href={cert.driveLink}
                      target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-xs flex items-center gap-1"
                    >
                          <Download size={14} />
                          Drive
                        </a>
                        <button
                          onClick={() => openPreview(cert.driveLink!, cert.certificateNumber)}
                          className="text-green-600 hover:text-green-800 text-xs flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </>
                    )}
                       
                    <button
                      onClick={() => openDetailModal(cert.id)}
                      className="text-gray-600 hover:text-gray-800 text-xs flex items-center gap-1"
                    >
                      <Info size={14} />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && filteredCertificates.length > 0 && (
          <div className="flex justify-center items-center mt-4 gap-1 text-sm">
            <button 
              className="p-1 rounded hover:bg-gray-200 text-xs disabled:opacity-50 disabled:pointer-events-none" 
              disabled={page === 1}
              onClick={() => handlePageChange(1)}
            >
              {"<<"}
            </button>
            <button 
              className="p-1 rounded hover:bg-gray-200 text-xs disabled:opacity-50 disabled:pointer-events-none" 
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              {"<"}
            </button>
            
            {/* Show page numbers */}
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              // Calculate which pages to show
              let pageToShow = page;
              if (page === 1) pageToShow = 1 + i;
              else if (page === totalPages) pageToShow = totalPages - 2 + i;
              else pageToShow = page - 1 + i;
              
              // Only show if the page is within range
              if (pageToShow > 0 && pageToShow <= totalPages) {
                return (
                  <button
                    key={pageToShow}
                    onClick={() => handlePageChange(pageToShow)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      pageToShow === page ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    {pageToShow}
                  </button>
                );
              }
              return null;
            })}
            
            <button 
              className="p-1 rounded hover:bg-gray-200 text-xs disabled:opacity-50 disabled:pointer-events-none" 
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              {">"}
            </button>
            <button 
              className="p-1 rounded hover:bg-gray-200 text-xs disabled:opacity-50 disabled:pointer-events-none" 
              disabled={page === totalPages}
              onClick={() => handlePageChange(totalPages)}
            >
              {">>"}
            </button>
          </div>
        )}
      </div>
      
      {/* Preview Modal */}
      <PreviewModal 
        isOpen={previewModal.isOpen}
        onClose={closePreview}
        driveLink={previewModal.driveLink}
        certificateNumber={previewModal.certificateNumber}
      />
      
      {/* Detail Modal */}
      <CertificateDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        certificateId={detailModal.certificateId}
      />
    </Layout>
  );
};

export default MyCertificatePage;
