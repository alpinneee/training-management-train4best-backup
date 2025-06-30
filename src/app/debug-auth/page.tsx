"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LogoutModal from "@/components/common/LogoutModal";

export default function DebugAuth() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        // Fetch debug info
        const response = await fetch("/api/debug-token");
        const data = await response.json();
        setDebugInfo(data);
      } catch (error) {
        console.error("Error fetching debug info:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDebugInfo();
  }, []);

  // Fungsi untuk menampilkan modal logout
  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">NextAuth Session</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
              {status === "loading" ? "Loading..." : JSON.stringify(session, null, 2)}
            </pre>
            <p className="mt-2 text-gray-500">Status: {status}</p>
          </div>
          
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Debug Token Info</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
              {loading ? "Loading..." : JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <button 
            onClick={handleLogoutClick}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout (Clear All Cookies)
          </button>
          
          <Link 
            href="/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>

      {/* Modal Logout */}
      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
} 