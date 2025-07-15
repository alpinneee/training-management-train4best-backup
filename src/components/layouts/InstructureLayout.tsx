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
      } else if (status === "loading") {
        // Wait for session to load with timeout
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // If session still loading after timeout, check cookies
        const hasCookies = document.cookie.includes("next-auth.session-token") || 
                          document.cookie.includes("__Secure-next-auth.session-token");
                          
        if (hasCookies) {
          // Verify with backend
          try {
            const response = await fetch('/api/auth/session-check');
            const data = await response.json();
            
            if (data.isAuthenticated && String(data.userType || "").toLowerCase().includes("instruct")) {
              console.log("Instructure access confirmed via API");
              setIsInstructure(true);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error checking instructure session:", error);
          }
        }
      }
      
      // If no instructure access found and session is loaded, prepare to redirect
      if (status !== "loading") {
        console.log("No instructure access found, redirecting");
        
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

  // Redirect if no instructure access
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

  // If not instructure, render spinner so useEffect redirect can still run
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