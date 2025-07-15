"use client";

import React, { useState, useEffect } from "react";
import InstructureLayout from "@/components/layouts/InstructureLayout";
import { Award, AlertTriangle, CheckCircle, XCircle, ExternalLink, RefreshCcw } from "lucide-react";

export default function DebugCertificatesPage() {
  const [instructureData, setInstructureData] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [instructureId, setInstructureId] = useState("");
  const [debugOutput, setDebugOutput] = useState<any>(null);

  useEffect(() => {
    // Get ID from URL if available
    const url = new URL(window.location.href);
    const idFromUrl = url.searchParams.get('id');
    
    if (idFromUrl) {
      setInstructureId(idFromUrl);
      fetchDebugInfo(idFromUrl);
    } else {
      // Try to get current user's instructure ID
      fetchCurrentInstructor();
    }
  }, []);

  const fetchCurrentInstructor = async () => {
    try {
      const response = await fetch("/api/instructure/me");
      const data = await response.json();
      console.log("Current instructor data:", data);
      
      if (data.instructure?.id) {
        setInstructureData({
          id: data.instructure.id,
          name: data.instructure.name,
          email: data.instructure.email,
        });
        setInstructureId(data.instructure.id);
        fetchDebugInfo(data.instructure.id);
      } else {
        setLoading(false);
        setError("Tidak dapat menemukan ID instruktur Anda");
      }
    } catch (err) {
      console.error("Error fetching current instructor:", err);
      setLoading(false);
      setError("Gagal memuat data instruktur");
    }
  };

  const fetchDebugInfo = async (id: string) => {
    setLoading(true);
    setError("");
    
    try {
      console.log("Fetching debug info for ID:", id);
      const response = await fetch(`/api/debug-instructure-certificate?id=${id}`);
      const data = await response.json();
      console.log("Debug API response:", data);
      
      setDebugOutput(data);
      
      if (data.found) {
        setInstructureData({
          id: data.instructure.id,
          name: data.instructure.name,
          phone: data.instructure.phone
        });
        
        if (data.certificates?.items) {
          setCertificates(data.certificates.items);
        } else {
          setCertificates([]);
        }
      } else {
        setError(`Instruktur dengan ID ${id} tidak ditemukan`);
        setCertificates([]);
      }
    } catch (err) {
      console.error("Error fetching debug info:", err);
      setError("Gagal memuat informasi debug");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mencoba mengambil sertifikat
  const testFetchCertificates = async (id: string) => {
    try {
      setLoading(true);
      
      // Panggil endpoint certificate/direct
      const response = await fetch("/api/instructure/certificate/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructureId: id })
      });
      
      const data = await response.json();
      console.log("Direct certificate API response:", data);
      
      // Tampilkan hasil sebagai alert
      if (data.certificates?.length > 0) {
        alert(`Berhasil menemukan ${data.certificates.length} sertifikat!`);
      } else {
        alert("Tidak ada sertifikat ditemukan melalui API langsung");
      }
    } catch (error) {
      console.error("Error testing certificate API:", error);
      alert("Gagal mengakses API sertifikat");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instructureId) {
      fetchDebugInfo(instructureId);
    }
  };

  return (
    <InstructureLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800 flex items-center">
              <Award className="mr-2 text-blue-600" size={24} />
              Debug Sertifikat Instruktur
            </h1>
          </div>

          {/* Form pencarian */}
          <div className="mb-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={instructureId}
                onChange={(e) => setInstructureId(e.target.value)}
                placeholder="Masukkan ID Instruktur"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Memuat..." : "Cari"}
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-2 text-red-500" />
                <p>{error}</p>
              </div>
            </div>
          ) : instructureData ? (
            <div>
              {/* Informasi instruktur */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h2 className="font-medium text-blue-800 mb-2">Informasi Instruktur</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-mono text-sm">{instructureData.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p className="font-medium">{instructureData.name}</p>
                  </div>
                </div>
                
                {/* Tombol untuk mengambil sertifikat */}
                <div className="mt-4">
                  <button
                    onClick={() => testFetchCertificates(instructureData.id)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded flex items-center"
                  >
                    <RefreshCcw size={14} className="mr-1" />
                    Coba Ambil Sertifikat
                  </button>
                </div>
              </div>

              {/* Daftar sertifikat */}
              <h2 className="font-medium text-gray-800 mb-3">
                Sertifikat ({certificates.length})
              </h2>
              
              {certificates.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <Award size={32} className="mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm text-yellow-800">
                    Tidak ada sertifikat ditemukan untuk instruktur ini
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium text-sm">{cert.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            cert.hasLink
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {cert.hasLink ? (
                            <CheckCircle size={12} className="inline mr-1" />
                          ) : (
                            <XCircle size={12} className="inline mr-1" />
                          )}
                          {cert.hasLink ? "Ada Link" : "Tanpa Link"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {cert.course || "Kursus tidak tersedia"}
                      </p>
                      <p className="text-xs font-mono text-gray-500 mt-1">
                        No: {cert.number}
                      </p>
                      <p className="text-xs text-gray-500">
                        Issued: {new Date(cert.issueDate).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Debug output */}
              <div className="mt-8">
                <h2 className="font-medium text-gray-800 mb-2">Debug Output</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(debugOutput, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>Masukkan ID instruktur untuk mencari sertifikat</p>
            </div>
          )}
        </div>
      </div>
    </InstructureLayout>
  );
} 