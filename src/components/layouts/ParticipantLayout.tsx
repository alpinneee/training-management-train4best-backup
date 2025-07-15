"use client";

import { Toaster } from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Navbar from "@/components/common/Navbar";
import Sidebar from "@/components/common/Sidebar";

interface ParticipantLayoutProps {
  children: React.ReactNode;
}

export default function ParticipantLayout({ children }: ParticipantLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkParticipantAccess = async () => {
      setIsLoading(true);
      
      // Wait for NextAuth session with timeout
      let sessionTimeout = 0;
      const waitForSession = async () => {
        if (status === "authenticated" && session?.user) {
          const userType = String(session.user.userType || "").toLowerCase();
          if (userType === "participant" || userType.includes("participant")) {
            console.log("Participant access confirmed via NextAuth session");
            setIsParticipant(true);
            setIsLoading(false);
            return true;
          } else {
            console.log("User authenticated but not a participant:", userType);
            setIsLoading(false);
            return false;
          }
        } else if (status === "loading" && sessionTimeout < 10) {
          // Wait up to 5 seconds (10 * 500ms) for session to load
          console.log("Waiting for session to load...");
          sessionTimeout++;
          setTimeout(waitForSession, 500);
          return false;
        }
        
        // If still loading after timeout, check for participant_token cookie
        if (status === "loading") {
          console.log("Session still loading after timeout, checking cookies");
          
          // Check for authentication cookies
          const hasCookies = document.cookie.includes("next-auth.session-token") || 
                            document.cookie.includes("participant_token") ||
                            document.cookie.includes("__Secure-next-auth.session-token");
          
          if (hasCookies) {
            console.log("Auth cookies found, assuming valid session");
            // Check server-side to verify the token is valid
            try {
              const response = await fetch('/api/auth/session-check');
              const data = await response.json();
              
              if (data.isAuthenticated && data.userType === 'participant') {
                console.log("Session validated by server");
                setIsParticipant(true);
                setIsLoading(false);
                return true;
              }
            } catch (error) {
              console.error("Error verifying session:", error);
            }
          }
        }
        
        console.log("No valid participant authentication found");
        setIsLoading(false);
        return false;
      };
      
      await waitForSession();
    };
    
    checkParticipantAccess();
  }, [status, session]);

  // Redirect if no participant access, but add delay
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    if (!isLoading && !isParticipant) {
      // Add delay to avoid redirect too quickly on refresh
      redirectTimer = setTimeout(() => {
        console.log("Redirecting to login due to no participant access");
        toast.error("You don't have permission to access this page");
        router.replace("/login");
      }, 1500); // Give 1.5 seconds to ensure session is really not available
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isLoading, isParticipant, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isParticipant) {
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
          variant="participant"
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