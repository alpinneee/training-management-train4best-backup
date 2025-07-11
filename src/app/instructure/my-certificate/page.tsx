"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import { Eye, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

const getGoogleDriveEmbedUrl = (driveUrl: string) => {
  const fileIdMatch = driveUrl.match(/\/d\/(.+?)\/|id=(.+?)&/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1] || fileIdMatch[2];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return driveUrl;
};

const PreviewModal = ({ isOpen, onClose, driveLink, certificateNumber }: { isOpen: boolean; onClose: () => void; driveLink: string; certificateNumber: string; }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-medium text-sm sm:text-base">Certificate #{certificateNumber}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe src={getGoogleDriveEmbedUrl(driveLink)} className="w-full h-full border-0" title="Certificate Preview" allowFullScreen />
        </div>
      </div>
    </div>
  );
};

interface Certificate {
  id: string;
  certificateNumber: string;
  issueDate: string;
  courseName: string;
  status: string;
  driveLink?: string | null;
}

export default function InstructureMyCertificatePage() {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, driveLink: "", certificateNumber: "" });

  useEffect(() => {
    const fetchCertificates = async (instructureId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/instructure/certificate/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instructureId }),
        });
        const data = await response.json();
        if (response.ok && data.certificates) {
          setCertificates(data.certificates);
        } else {
          setCertificates([]);
          setError(data.error || "No certificates found");
        }
      } catch (err) {
        setError("Failed to fetch certificates");
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };
    if (session?.user?.email) {
      fetch(`/api/check-instructure?email=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.exists && data.instructor?.id) {
            fetchCertificates(data.instructor.id);
          } else {
            setError("No instructor profile found for this user.");
          }
        });
    }
  }, [session]);

  const openPreview = (driveLink: string, certificateNumber: string) => {
    setPreviewModal({ isOpen: true, driveLink, certificateNumber });
  };
  const closePreview = () => {
    setPreviewModal({ isOpen: false, driveLink: "", certificateNumber: "" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">My Instructor Certificates</h1>
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
                    <h3 className="font-medium text-gray-800 text-sm">{cert.courseName || "Certificate"}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cert.status === "Valid" ? "bg-green-100 text-green-800" : cert.status === "Expired" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>{cert.status}</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div>
                      <p className="text-xs text-gray-500">Certificate Number</p>
                      <p className="font-medium text-xs text-gray-700">{cert.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Issue Date</p>
                      <p className="font-medium text-xs text-gray-700">{formatDate(cert.issueDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-3 py-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    {cert.driveLink && (
                      <button onClick={() => openPreview(cert.driveLink!, cert.certificateNumber)} className="flex items-center justify-center py-1 px-2 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700">
                        <Eye size={12} className="mr-1" /> Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">No certificates found</p>
          </div>
        )}
      </div>
      <PreviewModal isOpen={previewModal.isOpen} onClose={closePreview} driveLink={previewModal.driveLink} certificateNumber={previewModal.certificateNumber} />
    </Layout>
  );
} 