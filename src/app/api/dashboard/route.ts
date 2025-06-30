import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { format } from 'date-fns';

// Fungsi untuk logging
function logDebug(message: string, data?: any) {
  console.log(`[DASHBOARD-API] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Data fallback jika database tidak tersedia
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

export async function GET() {
  try {
    // Get current date
    const currentDate = new Date();
    
    // Fetch upcoming classes with course information
    const upcomingClasses = await prisma.class.findMany({
      where: {
        start_date: {
          gte: currentDate,
        },
        status: "Active",
      },
      include: {
        course: true,
        instructureclass: {
          include: {
            instructure: true,
          },
        },
      },
      orderBy: {
        start_date: 'asc',
      },
      take: 10, // Limit to 10 upcoming classes
    });

    // Format the data for the calendar
    const upcomingTrainings = upcomingClasses.map(classItem => {
      // Get the instructor name if available
      const instructor = classItem.instructureclass[0]?.instructure?.full_name || "Unassigned";
      
      return {
        title: classItem.course.course_name,
        date: format(classItem.start_date, 'yyyy-MM-dd'),
        trainer: instructor,
      };
    });

    // Get monthly training counts for the chart
    const monthlyTrainingData = await getMonthlyTrainingData();
    
    // Get certification type data
    const certificationTypeData = await getCertificationTypeData();

    // Get current user info (placeholder - would normally come from session)
    const user = {
      id: '1',
      name: 'Admin User',
      userType: 'Admin'
    };

    return NextResponse.json({
      success: true,
      data: {
        trainingData: monthlyTrainingData,
        certificationTypeData: certificationTypeData,
        upcomingTrainings: upcomingTrainings,
        user: user
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// Helper function to get monthly training data
async function getMonthlyTrainingData() {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);

  // Get all classes for the current year
  const classes = await prisma.class.findMany({
    where: {
      start_date: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
  });

  // Count classes per month
  const monthlyData = Array(12).fill(0).map((_, index) => ({
    name: format(new Date(currentYear, index, 1), 'MMM'),
    value: 0
  }));

  classes.forEach(classItem => {
    const month = classItem.start_date.getMonth();
    monthlyData[month].value += 1;
  });

  return monthlyData;
}

// Helper function to get certification type data
async function getCertificationTypeData() {
  // Get course types with count of certificates
  const courseTypes = await prisma.courseType.findMany({
    include: {
      course: {
        include: {
          certificates: true,
        },
      },
    },
  });

  // Count certificates by course type
  const certData = courseTypes.map(type => ({
    name: type.course_type,
    value: type.course.reduce((sum, course) => sum + course.certificates.length, 0)
  }));

  return certData;
} 