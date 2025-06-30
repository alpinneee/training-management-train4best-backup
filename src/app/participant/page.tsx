"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import { useRouter } from "next/navigation";
import Layout from "@/components/common/Layout";

interface Participant {
  id: string;
  name: string;
  role: string;
  image?: string;
  photo?: string;
  address: string;
  phone_number: string;
  birth_date: string | Date;
  job_title?: string;
  company?: string;
  gender: string;
  email?: string;
}

interface ApiResponse {
  data: Participant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Add this interface for history items
interface HistoryItem {
  id: string;
  type: string;
  description: string;
  date: string | Date;
  changedBy: string;
  details?: any;
}

const ParticipantPage = () => {
  const router = useRouter();

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    gender: "",
    phone_number: "",
    address: "",
    birth_date: "",
    job_title: "",
    company: "",
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Mendapatkan data participants dari API
  const fetchParticipants = async () => {
    setLoading(true);
    setError(null); // Reset error state
    try {
      console.log("Frontend: Starting to fetch participants...");
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const url = `/api/participant?${queryParams}`;
      console.log(`Frontend: Fetching from ${url}`);

      const response = await fetch(url);
      console.log(`Frontend: Received response with status ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          throw new Error(
            errorData.error ||
              `Server responded with ${response.status}: ${errorText.substring(
                0,
                100
              )}`
          );
        } catch (parseError) {
          throw new Error(
            `Server error (${response.status}): ${errorText.substring(0, 100)}`
          );
        }
      }

      const data = await response.json();

      console.log(`Frontend: Response data:`, data);

      if (!data.data || !Array.isArray(data.data)) {
        console.error("Frontend: Unexpected data format:", data);
        throw new Error("Server returned unexpected data format");
      }

      console.log(
        `Frontend: Successfully retrieved ${data.data.length} participants`
      );
      setParticipants(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error("Frontend: Error fetching participants:", err);
      const errorMessage =
        err instanceof Error
          ? `Failed to load participants: ${err.message}`
          : "Failed to load participants";
      setError(errorMessage);
      // Still clear the data when error occurs
      setParticipants([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Load participants awal
  useEffect(() => {
    fetchParticipants();
  }, [currentPage, searchTerm]);

  // Menangani perubahan input form
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Menampilkan detail participant
  const handleDetailClick = (participant: Participant) => {
    router.push(`/participant/${participant.id}`);
  };

  // Mengonfirmasi penghapusan participant
  const handleDeleteClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDeleteModalOpen(true);
  };

  // Menampilkan history participant
  const handleHistoryClick = async (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);

    try {
      const response = await fetch(
        `/api/participant/${participant.id}/history`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch participant history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      // Set empty history if there's an error
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      username: "",
      password: "",
      gender: "",
      phone_number: "",
      address: "",
      birth_date: "",
      job_title: "",
      company: "",
    });
  };

  // Menambah participant baru
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.gender ||
      !formData.phone_number ||
      !formData.address ||
      !formData.birth_date
    ) {
      alert("Mohon lengkapi semua data yang wajib diisi");
      return;
    }

    try {
      const response = await fetch("/api/participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add participant");
      }

      // Tutup modal dan refresh data
      setIsAddModalOpen(false);
      resetForm();
      fetchParticipants();
    } catch (err) {
      console.error("Error adding participant:", err);
      alert(err instanceof Error ? err.message : "Failed to add participant");
    }
  };

  // Menghapus participant
  const handleDeleteConfirm = async () => {
    if (!selectedParticipant) return;

    try {
      const response = await fetch(
        `/api/participant/${selectedParticipant.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          data.hint &&
          data.hint.includes("force=true") &&
          window.confirm(
            `${data.error}\n\nApakah Anda yakin ingin menghapus peserta ini beserta semua pendaftaran kursusnya?`
          )
        ) {
          // Force delete jika ada registrasi kursus
          const forceResponse = await fetch(
            `/api/participant/${selectedParticipant.id}?force=true`,
            {
              method: "DELETE",
            }
          );

          if (!forceResponse.ok) {
            const forceData = await forceResponse.json();
            throw new Error(forceData.error || "Failed to delete participant");
          }
        } else {
          throw new Error(data.error || "Failed to delete participant");
        }
      }

      // Tutup modal dan refresh data
      setIsDeleteModalOpen(false);
      setSelectedParticipant(null);
      fetchParticipants();
    } catch (err) {
      console.error("Error deleting participant:", err);
      alert(
        err instanceof Error ? err.message : "Failed to delete participant"
      );
    }
  };

  // Menangani pencarian
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Format birth_date untuk ditampilkan
  const formatDate = (dateStr: string | Date): string => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return date.toLocaleDateString("id-ID", options);
  };

  return (
    <Layout variant="admin">
      <div className="p-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <h1 className="text-lg md:text-xl text-gray-600">Participants</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="small"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs px-2 py-1"
            >
              Add Participant
            </Button>
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-2 py-1 text-xs rounded-lg border text-gray-700 border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
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
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-white rounded-lg p-2 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-2"
                  >
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        {participant.name ? (
                          <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <Image
                            src="/default-avatar.png"
                            alt="Default"
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">
                          {participant.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {participant.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 w-full sm:w-auto justify-end">
                      <Button
                        variant="yellow"
                        size="small"
                        onClick={() => handleHistoryClick(participant)}
                        className="text-xs px-2 py-1"
                      >
                        History
                      </Button>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handleDetailClick(participant)}
                        className="text-xs px-2 py-1"
                      >
                        Detail
                      </Button>
                      <Button
                        variant="red"
                        size="small"
                        onClick={() => handleDeleteClick(participant)}
                        className="text-xs px-2 py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-1 sm:col-span-2 text-center py-10 text-gray-500">
                  No participants found
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-1">
                <Button
                  variant="gray"
                  size="small"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className="text-xs px-2 py-1"
                >
                  Previous
                </Button>
                <span className="text-xs flex items-center px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="gray"
                  size="small"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className="text-xs px-2 py-1"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && selectedParticipant && (
        <Modal onClose={() => setIsHistoryModalOpen(false)}>
          <h2 className="text-base font-semibold text-gray-700 mb-2">
            History - {selectedParticipant.name}
          </h2>
          <div className="mt-2 space-y-2">
            {isLoadingHistory ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              </div>
            ) : history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {item.type}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Diubah oleh: {item.changedBy}
                  </p>

                  {/* Display additional details if available */}
                  {item.details && (
                    <div className="mt-1 text-xs text-gray-500">
                      {item.details.status && (
                        <p>
                          Status:{" "}
                          <span className="font-medium">
                            {item.details.status}
                          </span>
                        </p>
                      )}
                      {item.details.courseName && (
                        <p>
                          Kursus:{" "}
                          <span className="font-medium">
                            {item.details.courseName}
                          </span>
                        </p>
                      )}
                      {item.details.certificateNumber && (
                        <p>
                          No. Sertifikat:{" "}
                          <span className="font-medium">
                            {item.details.certificateNumber}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Tidak ada riwayat untuk ditampilkan
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedParticipant && (
        <Modal onClose={() => setIsDetailModalOpen(false)}>
          <h2 className="text-base font-semibold text-gray-700 mb-2">
            Detail Participant
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={
                    selectedParticipant.photo ||
                    selectedParticipant.image ||
                    "/default-avatar.png"
                  }
                  alt="Participant photo"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nama Lengkap</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Jenis Kelamin</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.gender}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tanggal Lahir</p>
                <p className="text-sm text-gray-700">
                  {formatDate(selectedParticipant.birth_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nomor Telepon</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.phone_number}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs text-gray-500">Alamat</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.address}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Jabatan</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.job_title || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Perusahaan</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.company || "-"}
                </p>
              </div>
              {selectedParticipant.email && (
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-700">
                    {selectedParticipant.email}
                  </p>
                </div>
              )}
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs text-gray-500">Peran</p>
                <p className="text-sm text-gray-700">
                  {selectedParticipant.role}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button
                variant="primary"
                size="small"
                onClick={() =>
                  router.push(`/participant/edit/${selectedParticipant.id}`)
                }
                className="text-xs px-2 py-1"
              >
                Edit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedParticipant && (
        <Modal onClose={() => setIsDeleteModalOpen(false)}>
          <h2 className="text-base font-semibold text-gray-700">
            Delete Participant
          </h2>
          <p className="text-xs text-gray-600 mt-2">
            Apakah Anda yakin ingin menghapus peserta{" "}
            <strong>{selectedParticipant.name}</strong>?
          </p>
          <div className="flex justify-end mt-2 gap-2">
            <Button
              variant="gray"
              size="small"
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs px-2 py-1"
            >
              Batal
            </Button>
            <Button
              variant="red"
              size="small"
              onClick={handleDeleteConfirm}
              className="text-xs px-2 py-1"
            >
              Hapus
            </Button>
          </div>
        </Modal>
      )}

      {/* Add Participant Modal */}
      {isAddModalOpen && (
        <Modal
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
        >
          <h2 className="text-base font-semibold text-gray-700 mb-2">
            Add New Participant
          </h2>
          <form onSubmit={handleAddSubmit} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  required
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                  rows={2}
                  required
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Perusahaan
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2 pt-2 gap-2 border-t">
              <Button
                variant="gray"
                size="small"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-xs px-2 py-1"
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="small"
                type="submit"
                className="text-xs px-2 py-1"
              >
                Simpan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default ParticipantPage;
