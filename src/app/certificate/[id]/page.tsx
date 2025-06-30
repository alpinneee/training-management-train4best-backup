"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/common/Layout";
import { Printer, ArrowLeft, Edit, Trash2, AlertCircle, ExternalLink } from "lucide-react";
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
  driveLink?: string | null;
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

export default function CertificateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [certificate, setCertificate] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function fetchCertificate() {
      try {
        const response = await fetch(`/api/certificate/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Certificate not found");
            router.push("/certificate-expired");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setCertificate(data);
      } catch (error) {
        console.error("Failed to fetch certificate:", error);
        toast.error("Failed to load certificate details");
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [params.id, router]);

  const deleteCertificate = async () => {
    try {
      const response = await fetch(`/api/certificate/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast.success("Certificate deleted successfully");
      router.push("/certificate-expired");
    } catch (error) {
      console.error("Failed to delete certificate:", error);
      toast.error("Failed to delete certificate");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex items-center gap-2 text-red-600 mb-3">
          <AlertCircle size={20} />
          <h3 className="text-base font-medium">Confirm Deletion</h3>
        </div>
        <p className="text-sm mb-4">
          Are you sure you want to delete this certificate? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={deleteCertificate}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!certificate) {
    return (
      <Layout>
        <div className="p-2">
          <div className="text-center p-4 bg-gray-50 rounded-md">
            <p className="text-gray-500 text-sm">Certificate not found</p>
            <Link
              href="/certificate-expired"
              className="inline-block mt-3 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Back to Certificates
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-2 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Link
              href="/list-certificate"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </Link>
            <h1 className="text-base font-medium ml-2 text-gray-700">
              Certificate Details
            </h1>
          </div>
          <div className="flex gap-1">
            <Link
              href={`/certificate/${params.id}/print`}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              <Printer size={14} />
              Print
            </Link>
            <Link
              href={`/certificate/${params.id}/edit`}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              <Edit size={14} />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Certificate No</p>
                  <p className="text-sm text-gray-700">{certificate.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded-full text-xs ${
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

              <div>
                <p className="text-xs text-gray-500 mb-0.5">Name</p>
                <p className="text-sm font-medium text-gray-700">{certificate.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Issue Date</p>
                  <p className="text-sm text-gray-700">{formatDate(certificate.issueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Expiry Date</p>
                  <p className="text-sm text-gray-700">{formatDate(certificate.expiryDate)}</p>
                </div>
              </div>

              {certificate.participant && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Participant Info</p>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="text-gray-700">
                      <span className="font-medium">Job:</span>{" "}
                      {certificate.participant.jobTitle || "Not specified"}
                    </p>
                    {certificate.participant.company && (
                      <p className="text-gray-700">
                        <span className="font-medium">Company:</span>{" "}
                        {certificate.participant.company}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {certificate.course && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Course</p>
                  <p className="text-sm text-gray-700">{certificate.course.name}</p>
                </div>
              )}

              {certificate.driveLink && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Drive Link</p>
                  <a 
                    href={certificate.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    <span>Google Drive</span>
                  </a>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-0.5">Metadata</p>
                <div className="text-xs text-gray-600">
                  <p>Created: {new Date(certificate.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(certificate.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Right column - PDF Preview */}
            <div>
              {certificate.pdfUrl ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-500">Certificate PDF</p>
                    <a
                      href={certificate.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download
                    </a>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <iframe
                      src={certificate.pdfUrl}
                      className="w-full h-[280px] border-0"
                      title="Certificate PDF"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-200 rounded-md">
                  <div className="text-center text-gray-500 p-4">
                    <p className="text-xs">No PDF preview available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && <DeleteModal />}
    </Layout>
  );
}
