"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserGroupIcon, UsersIcon, AcademicCapIcon, DocumentCheckIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Card from "@/components/common/card";
import { StatisticsChart, DistributionChart } from './ChartComponents';
import { TrainingCalendar } from './CalendarComponent';
import { CalendarIcon } from "@heroicons/react/24/outline";

interface User {
  id: string;
  name?: string;
  userType?: string;
}

interface TrainingItem {
  title: string;
  date: string;
  trainer: string;
}

interface TrainingDataItem {
  name: string;
  value: number;
}

interface CertificationTypeItem {
  name: string;
  value: number;
}

interface TrendIndicator {
  value: number;
  isUp: boolean;
}

interface Trends {
  trainers: TrendIndicator;
  participants: TrendIndicator;
  trainings: TrendIndicator;
  certificates: TrendIndicator;
  programs: TrendIndicator;
}

interface Counts {
  trainers: number;
  participants: number;
  trainings: number;
  certificates: number;
  programs: number;
}

interface TrainingPerformance {
  title: string;
  value: number;
  color: string;
}

interface DashboardProps {
  trainingData: TrainingDataItem[];
  certificationTypeData: CertificationTypeItem[];
  upcomingTrainings: TrainingItem[];
  localeString: string;
  user: User;
  counts?: Counts;
  trends?: Trends;
  topTrainingPerformance?: TrainingPerformance[];
}

export default function DashboardLayout({
  trainingData,
  certificationTypeData,
  upcomingTrainings,
  localeString = 'en-US',
  user,
  counts = {
    trainers: 0,
    participants: 0,
    trainings: 0,
    certificates: 0,
    programs: 0
  },
  trends = {
    trainers: { value: 0, isUp: true },
    participants: { value: 0, isUp: true },
    trainings: { value: 0, isUp: true },
    certificates: { value: 0, isUp: true },
    programs: { value: 0, isUp: true }
  },
  topTrainingPerformance = [
    { title: "Web Development", value: 92, color: "bg-blue-600" },
    { title: "Project Management", value: 85, color: "bg-green-600" },
    { title: "Data Science", value: 78, color: "bg-purple-600" }
  ]
}: DashboardProps) {
  const [dashboardData, setDashboardData] = useState({
    trainingData,
    certificationTypeData,
    upcomingTrainings,
  });
  // Tambahkan state baru untuk menyimpan counts
  const [dashboardCounts, setDashboardCounts] = useState(counts);
  // Tambahkan state baru untuk trends jika diperlukan
  const [dashboardTrends, setDashboardTrends] = useState(trends);
  // Tambahkan state baru untuk topTrainingPerformance
  const [dashboardPerformance, setDashboardPerformance] = useState(topTrainingPerformance);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const locale = localeString || 'en-US';

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log("Fetching dashboard data...");
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Menambahkan cache: 'no-store' untuk memastikan tidak ada data yang di-cache
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Dashboard API Response:", result);
        
        if (result.success && result.data) {
          // Update dashboardData
          setDashboardData({
            trainingData: result.data.trainingData || dashboardData.trainingData,
            certificationTypeData: result.data.certificationTypeData || dashboardData.certificationTypeData,
            upcomingTrainings: result.data.upcomingTrainings || dashboardData.upcomingTrainings,
          });
          
          // Update counts dari API response
          if (result.data.counts) {
            setDashboardCounts({
              trainers: result.data.counts.trainers || 0,
              participants: result.data.counts.participants || 0,
              trainings: result.data.counts.trainings || 0,
              certificates: result.data.counts.certificates || 0,
              programs: result.data.counts.programs || 0
            });
          }
          
          // Update trends dari API response
          if (result.data.trends) {
            setDashboardTrends(result.data.trends);
          }
          
          // Update topTrainingPerformance dari API response
          if (result.data.topTrainingPerformance) {
            setDashboardPerformance(result.data.topTrainingPerformance);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Gunakan nilai dari dashboardCounts state untuk menampilkan data
  const participantCount = dashboardCounts.participants;
  const trainingCount = dashboardCounts.trainings;
  const certificateCount = dashboardCounts.certificates;
  const trainerCount = dashboardCounts.trainers;
  const programCount = dashboardCounts.programs;

  return (
    <motion.div
      className="p-4 max-w-7xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header with welcome message and refresh button */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mb-6"
      >
        <div>
          <h1 className="text-xl text-gray-800 mb-1">
            Dashboard admin
          </h1>
          {/* Menampilkan info jika data statistik masih kosong */}
          {(dashboardCounts.trainers === 0 && dashboardCounts.participants === 0) && (
            <p className="text-xs text-gray-500">Klik "Refresh Data" untuk memuat data terbaru</p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Tombol untuk reload halaman jika refresh tidak berhasil */}
          <button 
            className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 py-1.5 px-3 rounded-full flex items-center gap-1 transition-colors"
            onClick={() => window.location.reload()}
            title="Muat ulang halaman"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload
          </button>
          <button 
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 px-3 rounded-full flex items-center gap-1 transition-colors"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 mr-1" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards - Now in a sleek minimal design */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-blue-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <UserGroupIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">{trainerCount}</span>
              </div>
              <span className="text-xs text-blue-600">Active Trainers</span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-green-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <UsersIcon className="w-4 h-4 text-green-600" />
                <span className="text-xl font-bold text-green-700">{participantCount}</span>
              </div>
              <span className="text-xs text-green-600">Active Participants</span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-purple-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xl font-bold text-purple-700">{trainingCount}</span>
              </div>
              <span className="text-xs text-purple-600">Ongoing Training</span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-orange-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <DocumentCheckIcon className="w-4 h-4 text-orange-600" />
                <span className="text-xl font-bold text-orange-700">{certificateCount}</span>
              </div>
              <span className="text-xs text-orange-600">Certificates Issued</span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-red-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <BookOpenIcon className="w-4 h-4 text-red-600" />
                <span className="text-xl font-bold text-red-700">{programCount}</span>
              </div>
              <span className="text-xs text-red-600">Training Programs</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-7 gap-4"
        variants={containerVariants}
      >
        {/* Left Column: Charts */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4">
          {/* Monthly Training Statistics */}
          <Card className="p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Monthly Training Statistics
              </h2>
              <select className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700">
                <option>This year</option>
                <option>Last 12 months</option>
                <option>Last 6 months</option>
              </select>
            </div>
            <div className="h-[250px]">
              <StatisticsChart trainingData={dashboardData.trainingData} />
            </div>
          </Card>

          {/* Training Types */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Training Types
              </h2>
              <div className="h-[150px]">
                <DistributionChart certificationTypeData={dashboardData.certificationTypeData} />
              </div>
            </Card>
            
            <Card className="p-4 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Top Training Performance
              </h2>
              <div className="space-y-3">
                {dashboardPerformance.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{item.title}</span>
                      <span className="text-blue-600 font-semibold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`${item.color} h-1.5 rounded-full`} 
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Right Column: Calendar and Upcoming Events */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="p-4 shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Training Schedule
              </h2>
              <Link href="/course-schedule" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            
            <div className="h-[calc(100%-3rem)] flex flex-col">
              <div className="flex-none">
                <TrainingCalendar
                  locale={locale}
                  upcomingTrainings={dashboardData.upcomingTrainings}
                />
              </div>
              {dashboardData.upcomingTrainings.length === 0 && (
                <div className="text-center text-gray-500 text-xs mt-4">
                  Belum ada jadwal training yang akan datang
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Access */}
      <motion.div variants={itemVariants} className="mt-6">
        <Card className="p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Participants", href: "/participant", icon: "👥" },
              { name: "Instructors", href: "/instructure", icon: "👨‍🏫" },
              { name: "Courses", href: "/courses", icon: "📚" },
              { name: "Schedule", href: "/course-schedule", icon: "📅" },
              { name: "Certificates", href: "/list-certificate", icon: "🎓" },
              { name: "Reports", href: "/payment-report", icon: "📊" }
            ].map((item, index) => (
              <Link key={index} href={item.href} className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700">{item.name}</span>
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
} 