"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import DashboardLayout from './DashboardLayout';
import Link from "next/link";
import { useSession } from "next-auth/react";

// Fallback data in case API fails
const fallbackTrainingData = [
  { name: "Jan", value: 15 },
  { name: "Feb", value: 20 },
  { name: "Mar", value: 25 },
  { name: "Apr", value: 18 },
  { name: "May", value: 30 },
  { name: "Jun", value: 22 },
  { name: "Jul", value: 35 },
  { name: "Aug", value: 28 },
  { name: "Sep", value: 32 },
  { name: "Oct", value: 40 },
  { name: "Nov", value: 38 },
  { name: "Dec", value: 45 },
];

const fallbackCertificationTypeData = [
  { name: "Technical", value: 45 },
  { name: "Soft Skills", value: 30 },
  { name: "Leadership", value: 25 },
];

const fallbackUpcomingTrainings = [
  {
    title: "Web Development Fundamentals",
    date: "2024-03-25",
    trainer: "John Doe",
  },
  {
    title: "Advanced JavaScript", 
    date: "2024-03-28",
    trainer: "Jane Smith",
  },
  {
    title: "Project Management",
    date: "2024-04-01", 
    trainer: "Mike Johnson",
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    trainingData: fallbackTrainingData,
    certificationTypeData: fallbackCertificationTypeData,
    upcomingTrainings: fallbackUpcomingTrainings,
    user: {
      id: '',
      name: '',
      userType: 'User'
    }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait for session to be loaded
    if (status === "loading") {
      return;
    }

    // Check if user is authenticated
    if (status === "unauthenticated" || !session?.user) {
      setError("Authentication required");
      setIsLoading(false);
      return;
    }

    // Check if user is admin
    if (session.user.userType?.toLowerCase() !== "admin") {
      setError("Admin access required");
      setIsLoading(false);
      return;
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, [session, status]);
  
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setDashboardData({
            trainingData: data.data.trainingData || fallbackTrainingData,
            certificationTypeData: data.data.certificationTypeData || fallbackCertificationTypeData,
            upcomingTrainings: data.data.upcomingTrainings || fallbackUpcomingTrainings,
            user: {
              id: data.data.user?.id || session?.user?.id || '',
              name: data.data.user?.name || session?.user?.name || 'User',
              userType: data.data.user?.userType || session?.user?.userType || 'User'
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
      // Use fallback data (already set as default)
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col space-y-3">
              <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <DashboardLayout 
        trainingData={dashboardData.trainingData}
        certificationTypeData={dashboardData.certificationTypeData}
        upcomingTrainings={dashboardData.upcomingTrainings}
        localeString="id-ID"
        user={dashboardData.user}
      />
    </Layout>
  );
}
