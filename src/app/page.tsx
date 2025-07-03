"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect ke halaman debug-login saat halaman root dikunjungi
    router.push('/login');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">Mengalihkan ke halaman login...</p>
      </div>
    </div>
  );
} 