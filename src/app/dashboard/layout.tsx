"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Wait for session to be loaded
        if (status === "loading") {
          return;
        }

        // Check if user is authenticated
        if (status === "unauthenticated" || !session?.user) {
          console.log("No session found, redirecting to login");
          router.push("/login");
          return;
        }

        // Check if userType is admin for the dashboard
        const userType = session.user.userType;
        console.log("Dashboard layout - userType:", userType);
        
        if (userType?.toLowerCase() !== "admin") {
          console.log(`User type ${userType} not allowed in admin dashboard`);
          const redirectPath = 
            userType?.toLowerCase() === "instructor" ? "/instructure/dashboard" : "/participant/dashboard";
          router.push(redirectPath);
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/login");
      }
    }
    
    checkAuth();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-60">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
} 