"use client";

import { Toaster } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";

interface InstructureLayoutProps {
  children: React.ReactNode;
}

export default function InstructureLayout({ children }: InstructureLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isInstructure, setIsInstructure] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkInstructureAccess = async () => {
      setIsLoading(true);
      
      // Check localStorage for instructure flag (used by direct-login)
      const instructureLoginTimestamp = localStorage.getItem("instructure_login_timestamp");
      const instructureEmail = localStorage.getItem("instructure_email");
      
      if (instructureLoginTimestamp && instructureEmail) {
        console.log("Found instructure login data in localStorage");
        setIsInstructure(true);
        setIsLoading(false);
        return;
      }
      
      // Check NextAuth session
      if (status === "authenticated" && session?.user) {
        const userType = String(session.user.userType || "").toLowerCase();
        console.log("Current userType:", userType); // Debug log
        if (userType === "instructure" || userType.includes("instruct")) {
          console.log("Instructure access granted via NextAuth session");
          setIsInstructure(true);
          setIsLoading(false);
          return;
        }
      }
      
      // If no instructure access found and session is loaded, redirect
      if (status !== "loading") {
        console.log("No instructure access found, redirecting");
        toast.error("You don't have permission to access this page");
        
        // Check if we have any user type info to redirect appropriately
        const userType = session?.user?.userType?.toLowerCase();
        if (userType?.includes("admin")) {
          router.replace("/user");
        } else if (userType?.includes("participant")) {
          router.replace("/participant/dashboard");
        } else {
          router.replace("/login");
        }
      }
      
      setIsLoading(false);
    };
    
    checkInstructureAccess();
  }, [status, session, router]);

  // Redirect jika tidak punya akses instructure
  useEffect(() => {
    if (!isLoading && !isInstructure) {
      toast.error("You don't have permission to access this page");
      router.replace("/login");
    }
  }, [isLoading, isInstructure, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Jika bukan instructure, render spinner agar useEffect redirect tetap berjalan
  if (!isInstructure) {
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
          variant="instructure"
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