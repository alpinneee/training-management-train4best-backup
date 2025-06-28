"use client";

import React from "react";
import Card from "@/components/common/card";
import Layout from "@/components/common/Layout";
import Calendar from "react-calendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "react-calendar/dist/Calendar.css";
import {
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import InstructureProfileSetup from '@/components/InstructureProfileSetup';

interface User {
  id: string;
  name: string;
  role: string;
}

interface DashboardClientProps {
  user: User;
}

const trainingData = [
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

const certificationTypeData = [
  { name: "Basic Training", value: 45 },
  { name: "Advanced Training", value: 30 },
  { name: "Professional Training", value: 25 },
];

const COLORS = ["#4338ca", "#fb923c", "#fbbf24"];

// Tambahkan konfigurasi locale untuk kalender
const locale = {
  locale: "id-ID",
  formatDay: (locale: string | undefined, date: Date) => date.getDate().toString(),
  formatMonthYear: (locale: string | undefined, date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
  },
  formatMonth: (locale: string | undefined, date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
  },
  formatWeekday: (locale: string | undefined, date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(date);
  },
  formatShortWeekday: (locale: string | undefined, date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
  }
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const upcomingTrainings = [
    {
      title: "Basic Web Development",
      date: "2024-03-25",
      trainer: "John Doe",
    },
    {
      title: "Advanced React", 
      date: "2024-03-28",
      trainer: "Jane Smith",
    },
    {
      title: "Cloud Computing",
      date: "2024-04-01", 
      trainer: "Mike Johnsonn",
    },
  ];

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

  return (
    <Layout>
      <motion.div
        className="p-2" // Reduced padding from p-4 to p-2
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center mb-2"
        >
          <h1 className="text-lg font-bold text-gray-700">
            Training Dashboard
          </h1>
          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
            Refresh Data
          </button>
        </motion.div>

        {/* Menu Cepat */}
        <motion.div 
          className="mb-4"
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Link href="/dashboard/training">
              <motion.div variants={itemVariants}>
                <Card className="p-3 hover:bg-gray-50 cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <UserGroupIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Kelola Pelatihan</h3>
                      <p className="text-xs text-gray-500">Atur jadwal dan materi</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>

            <Link href="/dashboard/participants">
              <motion.div variants={itemVariants}>
                <Card className="p-3 hover:bg-gray-50 cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <UsersIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Peserta</h3>
                      <p className="text-xs text-gray-500">Kelola data peserta</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>

            <Link href="/dashboard/certification">
              <motion.div variants={itemVariants}>
                <Card className="p-3 hover:bg-gray-50 cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <DocumentCheckIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Sertifikasi</h3>
                      <p className="text-xs text-gray-500">Kelola sertifikat</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>

            <Link href="/dashboard/course-type">
              <motion.div variants={itemVariants}>
                <Card className="p-3 hover:bg-gray-50 cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <BookOpenIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Materi</h3>
                      <p className="text-xs text-gray-500">Kelola konten</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card className="p-2 bg-blue-50"> {/* Reduced padding from p-4 to p-2 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-0.5"> {/* Reduced gap and margin */}
                  <UserGroupIcon className="w-4 h-4 text-blue-600" /> {/* Reduced icon size from 6 to 4 */}
                  <span className="text-xl font-bold text-blue-700">22</span> {/* Reduced from 2xl to xl */}
                </div>
                <span className="text-xs text-blue-600">Active Trainers</span> {/* Reduced from sm to xs */}
              </div>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="p-2 bg-green-50">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-0.5">
                  <UsersIcon className="w-4 h-4 text-green-600" />
                  <span className="text-xl font-bold text-green-700">156</span>
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
                  <span className="text-xl font-bold text-purple-700">15</span>
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
                  <span className="text-xl font-bold text-orange-700">289</span>
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
                  <span className="text-xl font-bold text-red-700">8</span>
                </div>
                <span className="text-xs text-red-600">Training Programs</span>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-2" // Reduced gap from 4 to 2
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card className="p-2"> {/* Reduced padding */}
              <h2 className="text-base font-bold mb-1 text-gray-700"> {/* Reduced text and margin */}
                Monthly Training Statistics
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trainingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Bar dataKey="value" fill="#4338ca" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-2"> {/* Reduced padding */}
              <h2 className="text-base font-bold text-gray-700 mb-2"> {/* Reduced text size */}
                Training Calendar
              </h2>
              <div className="calendar-container text-xs"> {/* Added text-xs for smaller calendar text */}
                <Calendar 
                  className="w-full border-none shadow-none text-black"
                  locale={locale.locale}
                  formatDay={locale.formatDay}
                  formatMonth={locale.formatMonth}
                  formatMonthYear={locale.formatMonthYear}
                  formatWeekday={locale.formatWeekday}
                  formatShortWeekday={locale.formatShortWeekday}
                />
              </div>
              <div className="mt-2"> {/* Reduced margin */}
                <h3 className="font-semibold text-gray-700 mb-1 text-xs"> {/* Reduced text and margin */}
                  Upcoming Trainings:
                </h3>
                <div className="space-y-0.5"> {/* Reduced spacing */}
                  {upcomingTrainings.map((training, index) => (
                    <div key={index} className="bg-gray-50 p-1.5 rounded"> {/* Reduced padding */}
                      <div className="font-medium text-gray-700 text-xs"> {/* Reduced text size */}
                        {training.title}
                      </div>
                      <div className="text-[10px] text-gray-500"> {/* Even smaller text */}
                        {training.date} - {training.trainer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-2"> {/* Reduced padding */}
              <h2 className="text-base font-bold text-gray-700 mb-2"> {/* Reduced text size */}
                Training Type Distribution
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={certificationTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {certificationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </motion.div>

        {/* This component will check if the user is an instructure who needs to complete their profile */}
        {user.role === 'Instructure' && (
          <InstructureProfileSetup 
            userId={user.id} 
            username={user.name} 
          />
        )}
        
      </motion.div>
    </Layout>
  );
} 