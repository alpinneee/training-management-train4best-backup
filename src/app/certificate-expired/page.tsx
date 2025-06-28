"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import { Printer, FileText, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
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
      // Build URL with query parameters
      let url = "/api/certificate-expired";
      
      const queryParams = [];
      
      if (searchQuery) {
        queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      
      if (startDate) {
        queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
      }
      
      if (endDate) {
        queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      console.log("Fetching expired certificates with URL:", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received certificates:", data.length);
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
      const response = await fetch(`/api/certificate/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      toast.success("Certificate deleted successfully");
      fetchCertificates(); // Refresh the list
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
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.updated > 0) {
        toast.success(`Updated ${data.updated} expired certificates`);
      } else {
        toast.success("No certificates needed updating");
      }
      
      // Refresh the list
      fetchCertificates();
    } catch (error) {
      console.error("Failed to update expired certificates:", error);
      toast.error("Failed to update expired certificates");
    } finally {
      setUpdatingExpired(false);
    }
  };

  // Init
  useEffect(() => {
    fetchCertificates();
  }, []);

  const columns: Column<Certificate>[] = [
    { 
      header: "No", 
      accessor: "no",
      className: "w-12 text-center"
    },
    { 
      header: "Name", 
      accessor: "name",
      className: "min-w-[120px]"
    },
    { 
      header: "Certificate Number", 
      accessor: "certificateNumber",
      className: "min-w-[140px]"
    },
    { 
      header: "Issue Date", 
      accessor: "issueDate",
      className: "min-w-[100px]"
    },
    { 
      header: "Expiry Date", 
      accessor: "expiryDate",
      className: "min-w-[100px]"
    },
    { 
      header: "Course", 
      accessor: "course",
      className: "min-w-[120px]"
    },
    {
      header: "Action",
      accessor: (certificate) => (
        <div className="flex gap-1">
          <Link href={`/certificate/${certificate.id}/print`} className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs p-1">
            <Printer size={14} /> Print
          </Link>
          <Link href={`/certificate/${certificate.id}`} className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs p-1">
            <FileText size={14} /> Detail
          </Link>
          <Link href={`/certificate/${certificate.id}/edit`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs p-1">
            <Edit size={14} /> Edit
          </Link>
          <button 
            onClick={() => {
              setCertificateToDelete(certificate.id);
              setShowDeleteModal(true);
            }}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs p-1"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
      className: "min-w-[200px]"
    },
  ];

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(certificates.length / ITEMS_PER_PAGE);

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return certificates.slice(startIndex, endIndex);
  };

  // Delete confirmation modal
  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle size={24} />
          <h3 className="text-lg font-semibold">Confirm Deletion</h3>
        </div>
        <p className="mb-6">Are you sure you want to delete this certificate? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={() => certificateToDelete && deleteCertificate(certificateToDelete)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-xl text-gray-700">Expired Certificates</h1>
          <button
            onClick={updateExpiredCertificates}
            disabled={updatingExpired}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-blue-300"
          >
            {updatingExpired ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 12a9 9 0 0 0 15 6.7L21 16"></path>
                  <path d="M21 22v-6h-6"></path>
                </svg>
                <span>Update Expired</span>
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="date"
              className="w-full sm:w-auto px-2 py-1 text-xs border rounded text-gray-700"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="w-full sm:w-auto px-2 py-1 text-xs border rounded text-gray-700"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button 
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              <Printer size={14} />
              Print List
            </button>
            <div className="relative w-full sm:w-auto flex">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-2 py-1 pl-7 text-xs border rounded text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg 
                className="absolute left-2 top-1/2 -translate-y-1/2" 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24"
              >
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"/>
              </svg>
              <button 
                type="submit"
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="flex justify-center py-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
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
              <div className="text-center p-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No expired certificates found</p>
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
