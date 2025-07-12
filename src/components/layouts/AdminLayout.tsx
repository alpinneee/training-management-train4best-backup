"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      // Check localStorage for admin flag (used by direct-login)
      const adminLoginTimestamp = localStorage.getItem("admin_login_timestamp");
      const adminEmail = localStorage.getItem("admin_email");
      if (adminLoginTimestamp && adminEmail) {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }
      // Check NextAuth session
      if (status === "authenticated" && session?.user) {
        const userType = String(session.user.userType || "").toLowerCase();
        if (userType === "admin" || userType.includes("admin")) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(false);
    };
    checkAdminAccess();
  }, [status, session, router]);

  // Redirect jika tidak punya akses admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("You don't have permission to access this page");
      router.replace("/login");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onMobileMenuClick={() => setSidebarOpen(true)} />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          variant="admin"
        />
        <div className="flex-1 flex flex-col">
          <main className="pt-0 pb-4 flex-1">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 