"use client";

import { useState, useEffect, useCallback } from "react";
import Table from "@/components/common/table";
import ParticipantLayout from "@/components/layouts/ParticipantLayout";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  nama: string;
  tanggal: string;
  paymentMethod: string;
  nomorReferensi: string;
  jumlah: number | string;
  amount?: number;
  status: string;
  courseName?: string;
  courseId?: string;
  registrationId?: string;
  payment?: number;
}

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
}

export default function PaymentReport() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isDbConfigured, setIsDbConfigured] = useState(true);

  // Fungsi untuk mengambil data pembayaran dari API
  const fetchPayments = useCallback(
    async (pageNum: number = 1, search: string = "", method: string = "") => {
      setLoading(true);
      try {
        // Ambil email user dari localStorage (jika ada)
        const userEmail = localStorage.getItem("userEmail") || "";

        // Buat URL untuk fetch dengan parameter
        let url = `/api/payment?page=${pageNum}&limit=5&filterByUser=true`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (method) url += `&paymentMethod=${encodeURIComponent(method)}`;

        // Tambahkan email sebagai parameter tambahan untuk fallback
        if (userEmail) {
          url += `&email=${encodeURIComponent(userEmail)}`;
        }

        // Tambahkan timestamp untuk menghindari cache
        url += `&_=${new Date().getTime()}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.text();
          // Cek apakah error karena database belum dikonfigurasi
          if (response.status === 500 && errorData.includes("database")) {
            setIsDbConfigured(false);
            throw new Error("Database belum dikonfigurasi");
          }
          // Check if error is due to authentication
          if (response.status === 401) {
            setError("Anda perlu login untuk melihat data pembayaran.");
            setPayments([]);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.data) {
          setPayments(data.data);
          if (data.meta) {
            setTotalPages(data.meta.totalPages || 1);
          }
        } else {
          setPayments([]);
          setTotalPages(1);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching payments:", err);
        if (
          err instanceof Error &&
          err.message.includes("Database belum dikonfigurasi")
        ) {
          setIsDbConfigured(false);
          setError(
            'Database belum dikonfigurasi. Silakan klik tombol "Konfigurasi Database" di bawah.'
          );
        } else {
          setError("Gagal mengambil data pembayaran. Silakan coba lagi nanti.");
        }
        setPayments([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Effect untuk mengambil data saat pertama kali atau saat parameter berubah
  useEffect(() => {
    fetchPayments(currentPage, searchTerm, paymentMethod);

    // Set debug token untuk membantu autentikasi
    const setDebugToken = async () => {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        try {
          const response = await fetch(
            `/api/debug-token?email=${encodeURIComponent(userEmail)}`
          );
          if (response.ok) {
            console.log("Debug token set successfully");
          }
        } catch (error) {
          console.error("Error setting debug token:", error);
        }
      }
    };

    setDebugToken();
  }, [fetchPayments, currentPage, searchTerm, paymentMethod]);

  // Setup database
  const setupDatabase = async () => {
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "minimal" }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsDbConfigured(true);

        // Simpan email demo user untuk demo yang lebih seamless
        localStorage.setItem("userEmail", "demo@example.com");

        // Reload data setelah database dikonfigurasi
        fetchPayments();
        alert("Database berhasil dikonfigurasi!");
      } else {
        const error = await response.text();
        console.error("Error configuring database:", error);
        alert("Gagal mengkonfigurasi database. Lihat konsol untuk detail.");
      }
    } catch (error) {
      console.error("Error setting up database:", error);
      alert("Terjadi kesalahan saat mengkonfigurasi database.");
    }
  };

  // Handler untuk pencarian
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama saat pencarian berubah
  };

  // Handler untuk filter metode pembayaran
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
  };

  // Fungsi untuk navigasi ke halaman detail payment
  const goToPaymentDetail = (paymentId: string) => {
    router.push(`/participant/payment/${paymentId}`);
  };

  const columns: Column<Payment>[] = [
    {
      header: "NO",
      accessor: (payment) => {
        // Buat properti nomor urut untuk setiap payment
        const index = payments.findIndex((p) => p.id === payment.id);
        return (currentPage - 1) * 5 + index + 1;
      },
      className: "w-12 text-center",
    },
    {
      header: "NAMA",
      accessor: "nama",
      className: "min-w-[120px]",
    },
    {
      header: "COURSE",
      accessor: (payment) => payment.courseName || "-",
      className: "min-w-[120px]",
    },
    {
      header: "TANGGAL",
      accessor: "tanggal",
      className: "min-w-[100px]",
    },
    {
      header: "PAYMENT METHOD",
      accessor: "paymentMethod",
      className: "min-w-[120px]",
    },
    {
      header: "NOMOR REFERENSI",
      accessor: "nomorReferensi",
      className: "min-w-[140px]",
    },
    {
      header: "JUMLAH (IDR)",
      accessor: (payment) => {
        // Gunakan data asli dari database
        if (typeof payment.jumlah === "number" && !isNaN(payment.jumlah)) {
          return `Rp${payment.jumlah.toLocaleString("id-ID")}`;
        } else if (
          typeof payment.amount === "number" &&
          !isNaN(payment.amount)
        ) {
          return `Rp${payment.amount.toLocaleString("id-ID")}`;
        }
        // Default fallback
        return `Rp${(typeof payment.payment === "number"
          ? payment.payment
          : 0
        ).toLocaleString("id-ID")}`;
      },
      className: "min-w-[100px]",
    },
    {
      header: "STATUS",
      accessor: (payment: Payment) => (
        <span
          className={`px-1 py-0.5 text-xs font-medium rounded-full ${
            payment.status === "Paid"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {payment.status}
        </span>
      ),
      className: "min-w-[80px]",
    },
    {
      header: "ACTION",
      accessor: (payment: Payment) => (
        <div className="flex justify-center">
          <button
            onClick={() => goToPaymentDetail(payment.id)}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Detail
          </button>
        </div>
      ),
      className: "min-w-[100px] text-center",
    },
  ];

  const ITEMS_PER_PAGE = 5;

  // Render konfigurasi database jika belum terkonfigurasi
  if (!isDbConfigured) {
    return (
      <ParticipantLayout>
        <div className="p-2">
          <div className="space-y-4 py-8">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
              Database belum dikonfigurasi. Silakan klik tombol di bawah untuk
              mengonfigurasi database.
            </div>

            <div className="flex justify-center">
              <button
                onClick={setupDatabase}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Konfigurasi Database
              </button>
            </div>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout>
      <div className="p-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
          <h1 className="text-lg md:text-xl text-gray-700">My Payment</h1>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
              {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                Tidak ada data pembayaran yang ditemukan.
              </p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={payments}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={ITEMS_PER_PAGE * totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </ParticipantLayout>
  );
}
