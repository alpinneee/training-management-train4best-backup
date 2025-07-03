"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import { Printer, Edit, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import Table from "@/components/common/table";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Certificate {
  id: string;
  no: number;
  name: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  course: string;
}

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
}

const CertificatePage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  const [updatingExpired, setUpdatingExpired] = useState(false);

  // Fetch certificates
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      let url = "/api/certificate-expired";
      const queryParams = [];
      
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
      
      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const data = await response.json();
      setCertificates(data);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  // Delete certificate
  const deleteCertificate = async (id: string) => {
    try {
      const response = await fetch(`/api/certificate/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      toast.success("Certificate deleted successfully");
      fetchCertificates();
    } catch (error) {
      console.error("Failed to delete certificate:", error);
      toast.error("Failed to delete certificate");
    } finally {
      setShowDeleteModal(false);
      setCertificateToDelete(null);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates();
  };

  // Update expired certificates
  const updateExpiredCertificates = async () => {
    setUpdatingExpired(true);
    try {
      const response = await fetch("/api/cron/update-expired-certificates");
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      
      const data = await response.json();
      if (data.updated > 0) {
        toast.success(`Updated ${data.updated} expired certificates`);
      } else {
        toast.success("No certificates needed updating");
      }
      fetchCertificates();
    } catch (error) {
      console.error("Failed to update expired certificates:", error);
      toast.error("Failed to update expired certificates");
    } finally {
      setUpdatingExpired(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const columns: Column<Certificate>[] = [
    { header: "No", accessor: "no", className: "w-12 text-center" },
    { header: "Name", accessor: "name", className: "min-w-[120px]" },
    { header: "Certificate No.", accessor: "certificateNumber", className: "min-w-[140px]" },
    { header: "Issue Date", accessor: "issueDate", className: "min-w-[100px]" },
    { header: "Expiry Date", accessor: "expiryDate", className: "min-w-[100px]" },
    { header: "Course", accessor: "course", className: "min-w-[120px]" },
    {
      header: "Actions",
      accessor: (certificate) => (
        <div className="flex gap-1">
          <Link 
            href={`/certificate/${certificate.id}/edit`} 
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            <Edit size={14} />
          </Link>
          <button 
            onClick={() => {
              setCertificateToDelete(certificate.id);
              setShowDeleteModal(true);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      className: "w-20 text-center"
    },
  ];

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(certificates.length / ITEMS_PER_PAGE);

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return certificates.slice(startIndex, endIndex);
  };

  // Delete confirmation modal
  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center gap-2 text-red-600 mb-3">
          <AlertCircle size={20} />
          <h3 className="font-semibold">Confirm Deletion</h3>
        </div>
        <p className="mb-4 text-sm text-gray-600">Are you sure you want to delete this certificate?</p>
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setShowDeleteModal(false)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={() => certificateToDelete && deleteCertificate(certificateToDelete)}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold text-gray-800">Expired Certificates</h1>
          <div className="flex gap-2">
            <button
              onClick={updateExpiredCertificates}
              disabled={updatingExpired}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              <RefreshCw size={14} className={updatingExpired ? "animate-spin" : ""} />
              {updatingExpired ? "Updating..." : "Update Expired"}
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="bg-white p-3 rounded-lg border mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <input
                type="date"
                className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search certificates..."
                className="flex-1 min-w-[200px] px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            {certificates.length > 0 ? (
              <Table
                columns={columns}
                data={getCurrentPageItems()}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={certificates.length}
                onPageChange={setCurrentPage}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No expired certificates found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showDeleteModal && <DeleteModal />}
    </Layout>
  );
};

export default CertificatePage;
