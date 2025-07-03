"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import { X, Download, Eye, ExternalLink } from "lucide-react";
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">
            Certificate Preview #{certificateNumber}
          </h3>
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

  const [certificate, setCertificate] = useState<CertificateDetail | null>(
    null
  );
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
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">
                    Certificate Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-700">
                        {certificate.name}
                      </p>
                    </div>
                    {certificate.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-700">
                          {certificate.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">
                        Certificate Number
                      </p>
                      <p className="font-medium text-gray-700">
                        {certificate.certificateNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium text-gray-700">
                        {formatDate(certificate.issueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="font-medium text-gray-700">
                        {formatDate(certificate.expiryDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
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
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-5">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">
                    Related Information
                  </h2>
                  <div className="space-y-4">
                    {certificate.course && (
                      <div>
                        <h3 className="text-sm text-gray-500 mb-2">Course</h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="font-medium text-gray-700">
                            {certificate.course.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Certificate Documents
                </h2>

                {certificate.driveLink && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 mb-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Google Drive</p>
                        <p className="text-xs text-gray-500">
                          Access your certificate on Google Drive
                        </p>
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

                {certificate.pdfUrl && !certificate.driveLink && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 mb-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">Certificate PDF</p>
                        <p className="text-xs text-gray-500">
                          View and download your certificate here
                        </p>
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
                )}

                {!certificate.pdfUrl && !certificate.driveLink && (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">
                      No certificate document available
                    </p>
                  </div>
                )}
              </div>
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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    // Fetch certificates regardless of auth status
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      console.log("Fetching certificates");
      const response = await fetch("/api/instructure/me/certificate", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for auth
      });

      // Just handle the response without redirecting
      const data = await response.json();
      console.log("Certificate data:", data);

      if (data.error) {
        console.error("API returned error:", data.error);
        setError(data.error);
        setCertificates([]);
      } else {
        setCertificates(data.certificates || []);
        if (data.message && data.certificates.length === 0) {
          setError(data.message);
        }
      }
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
      setError("Failed to load certificates");
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Certificates</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500 mb-4">
              Anda belum memiliki sertifikat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {certificate.courseName}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Certificate #{certificate.certificateNumber}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
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

                  {certificate.courseImage && (
                    <div className="relative h-32 w-full mb-3 bg-gray-100 rounded-md overflow-hidden">
                      <Image
                        src={certificate.courseImage}
                        alt={certificate.courseName || "Course"}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    <p>
                      Issued: {formatDate(certificate.issueDate.toString())}
                    </p>
                    {certificate.email && <p>Email: {certificate.email}</p>}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => openDetailModal(certificate.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View Details
                    </button>

                    {certificate.driveLink && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            openPreview(
                              certificate.driveLink!,
                              certificate.certificateNumber
                            )
                          }
                          className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                        <a
                          href={certificate.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          <ExternalLink size={14} />
                          Drive
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
}
