"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Card from "@/components/common/card";
import { StatisticsChart, DistributionChart } from "./ChartComponents";
import { TrainingCalendar } from "./CalendarComponent";
import InstructureProfileSetup from "@/components/InstructureProfileSetup";

interface User {
  id: string;
  name?: string;
  userType?: string;
}

interface DashboardLayoutProps {
  trainingData: Array<{ name: string; value: number }>;
  certificationTypeData: Array<{ name: string; value: number }>;
  upcomingTrainings: Array<{ title: string; date: string; trainer: string }>;
  localeString: string;
  user: User;
  pendingPaymentsCount?: number;
}

export default function DashboardLayout({
  trainingData,
  certificationTypeData,
  upcomingTrainings,
  localeString,
  user,
  pendingPaymentsCount = 0,
}: DashboardLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    trainingData,
    certificationTypeData,
    upcomingTrainings,
  });

  // Function to refresh data from API
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setDashboardData({
            trainingData: data.data.trainingData || trainingData,
            certificationTypeData:
              data.data.certificationTypeData || certificationTypeData,
            upcomingTrainings: data.data.upcomingTrainings || upcomingTrainings,
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create locale object here in the client component
  const locale = {
    locale: localeString,
    formatDay: (locale: string | undefined, date: Date) =>
      date.getDate().toString(),
    formatMonthYear: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(localeString, {
        month: "long",
        year: "numeric",
      }).format(date);
    },
    formatMonth: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(localeString, { month: "long" }).format(
        date
      );
    },
    formatWeekday: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(localeString, { weekday: "long" }).format(
        date
      );
    },
    formatShortWeekday: (locale: string | undefined, date: Date) => {
      return new Intl.DateTimeFormat(localeString, { weekday: "short" }).format(
        date
      );
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Get counts from data for summary cards
  const certificateCount = dashboardData.certificationTypeData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const trainingCount = dashboardData.upcomingTrainings.length;
  const participantCount = dashboardData.trainingData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const trainerCount = [
    ...new Set(dashboardData.upcomingTrainings.map((t) => t.trainer)),
  ].length;
  const programCount = [
    ...new Set(dashboardData.upcomingTrainings.map((t) => t.title)),
  ].length;

  return (
    <motion.div
      className="p-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mb-2"
      >
        <h1 className="text-lg font-bold text-gray-700">Training Dashboard</h1>
        <button
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          onClick={refreshData}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Refreshing...
            </>
          ) : (
            "Refresh Data"
          )}
        </button>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-blue-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <UserGroupIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">
                  {trainerCount}
                </span>
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
                <span className="text-xl font-bold text-green-700">
                  {participantCount}
                </span>
              </div>
              <span className="text-xs text-green-600">
                Active Participants
              </span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-purple-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xl font-bold text-purple-700">
                  {trainingCount}
                </span>
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
                <span className="text-xl font-bold text-orange-700">
                  {certificateCount}
                </span>
              </div>
              <span className="text-xs text-orange-600">
                Certificates Issued
              </span>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-2 bg-orange-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xl font-bold text-orange-700">
                  {pendingPaymentsCount}
                </span>
              </div>
              <span className="text-xs text-orange-600">Pending</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-2"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <StatisticsChart trainingData={dashboardData.trainingData} />
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-2">
          <TrainingCalendar
            locale={locale}
            upcomingTrainings={dashboardData.upcomingTrainings}
          />
        </motion.div>
      </motion.div>

      {/* This component will check if the user is an instructure who needs to complete their profile */}
      {/* Instructure should be redirected to their own dashboard, so this is not needed here */}
      {/* {user.userType === 'Instructure' && (
        <InstructureProfileSetup 
          userId={user.id} 
          username={user.name || ''} 
        />
      )} */}
    </motion.div>
  );
}
