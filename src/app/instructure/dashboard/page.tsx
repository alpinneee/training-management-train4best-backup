"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Layout from "@/components/common/Layout";
import InstructureProfileSetup from "@/components/InstructureProfileSetup";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar,
  AlertCircle,
  GraduationCap,
  MessageSquare
} from "lucide-react";

// Helper function to get cookies
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

interface TeachingCourse {
  id: number | string;
  name: string;
  students: number;
  nextSession: string | null;
  status: "active" | "completed" | "upcoming";
}

interface StudentProgress {
  id: number | string;
  name: string;
  course: string;
  progress: number;
  lastActive: string;
}

interface Stat {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface Notification {
  type: string;
  message: string;
  icon: string;
  color: string;
}

interface DashboardData {
  teachingCourses: TeachingCourse[];
  studentProgress: StudentProgress[];
  stats: Stat[];
  notifications: Notification[];
}

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for cookies and set localStorage
  useEffect(() => {
    const userEmailCookie = getCookie('userEmail');
    const userNameCookie = getCookie('userName');
    
    if (userEmailCookie) {
      localStorage.setItem('userEmail', userEmailCookie);
      console.log('Set userEmail in localStorage from cookie');
    }
    
    if (userNameCookie) {
      localStorage.setItem('userName', userNameCookie);
      console.log('Set userName in localStorage from cookie');
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to get email from localStorage for demo purposes
        const userEmail = localStorage.getItem('userEmail');
        const queryParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
        
        const response = await fetch(`/api/instructure/dashboard${queryParam}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setDashboardData(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to render the appropriate icon
  const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
    switch (iconName) {
      case "Users":
        return <Users className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Calendar":
        return <Calendar className={className} />;
      case "GraduationCap":
        return <GraduationCap className={className} />;
      case "AlertCircle":
        return <AlertCircle className={className} />;
      case "MessageSquare":
        return <MessageSquare className={className} />;
      default:
        return <AlertCircle className={className} />;
    }
  };

  return (
    <Layout variant="instructure">
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
            <div className="mt-4">
              <button 
                onClick={() => window.location.href = "/api/debug-login-instructure"}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Login as Debug Instructure
              </button>
            </div>
          </div>
        ) : dashboardData ? (
          <>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {dashboardData.stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-700">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.color}`}>
                      {renderIcon(stat.icon)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("courses")}
                className={`py-3 px-4 text-sm font-medium ${
                  activeTab === "courses"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Teaching Courses
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`py-3 px-4 text-sm font-medium ${
                  activeTab === "students"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Student Progress
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "courses" && (
              <div className="space-y-4">
                    {dashboardData.teachingCourses.length > 0 ? (
                      dashboardData.teachingCourses.map((course) => (
                        <div key={course.id.toString()} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-700">{course.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Users className="w-4 h-4" />
                          <span>{course.students} Students</span>
                        </div>
                              {course.nextSession && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Next session: {course.nextSession}</span>
                        </div>
                              )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        course.status === "active" 
                          ? "bg-green-100 text-green-600"
                          : course.status === "completed"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {course.status}
                      </div>
                    </div>
                  </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>You don't have any teaching courses yet.</p>
                      </div>
                    )}
              </div>
            )}

            {activeTab === "students" && (
              <div className="space-y-4">
                    {dashboardData.studentProgress.length > 0 ? (
                      dashboardData.studentProgress.map((student) => (
                        <div key={student.id.toString()} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-700">{student.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{student.course}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Last active: {student.lastActive}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">{student.progress}%</div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No student progress data available.</p>
                      </div>
                    )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3 text-gray-700">Important Notifications</h3>
              {dashboardData.notifications.length > 0 ? (
          <div className="space-y-3">
                  {dashboardData.notifications.map((notification, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 ${notification.color}`}>
                        {renderIcon(notification.icon, "w-5 h-5")}
                      </div>
              <div>
                        <p className="text-sm font-medium text-gray-700">
                          {notification.type === "review" ? "Assignment Review Needed" : 
                           notification.type === "session" ? "Upcoming Sessions" : 
                           "Notification"}
                        </p>
                        <p className="text-xs text-gray-500">{notification.message}</p>
              </div>
            </div>
                  ))}
              </div>
              ) : (
                <p className="text-center text-gray-500 py-2">No notifications at this time</p>
              )}
            </div>
          </>
        ) : null}
        
        {/* Instructure Profile Setup - will show if profile completion is needed */}
        {session?.user?.id && (
          <InstructureProfileSetup 
            userId={session.user.id} 
            username={session.user.name || ''} 
          />
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;

