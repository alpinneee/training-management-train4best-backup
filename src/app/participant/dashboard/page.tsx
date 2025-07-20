"use client";

import { useState, useEffect } from "react";
import ParticipantLayout from "@/components/layouts/ParticipantLayout";
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  progress: number;
  nextSession: string;
  status: "active" | "completed" | "upcoming";
}

interface Certificate {
  id: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expired" | "expiring";
}

interface Stat {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface Notification {
  type: string;
  icon: string;
  title: string;
  message: string;
  color: string;
}

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbConfigured, setIsDbConfigured] = useState(true);
  const [configuring, setConfiguring] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Ensure we preserve auth state on refresh
        const preserveParticipantAuth = () => {
          // Mark this as participant session in localStorage
          if (typeof window !== 'undefined') {
            // Set a timestamp to indicate active participant session
            localStorage.setItem('participant_login_timestamp', Date.now().toString());
            
            // If we have session info, store it
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail) {
              localStorage.setItem('participant_email', userEmail);
            }
            
            // Store userType to prevent logout on refresh
            localStorage.setItem('userType', 'participant');
          }
        };
        
        // Try to preserve auth state when dashboard loads
        preserveParticipantAuth();
        
        // Try to get email from localStorage for demo purposes
        let userEmail = localStorage.getItem('userEmail');
        
        // If no email in localStorage, try to load profile data first
        if (!userEmail) {
          try {
            const profileResponse = await fetch('/api/profile/get?email=demo@example.com');
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.data && profileData.data.email) {
                userEmail = profileData.data.email;
                if (userEmail) {
                  localStorage.setItem('userEmail', userEmail);
                  console.log('Loaded email from profile:', userEmail);
                }
              }
            }
          } catch (profileError) {
            console.log('Could not load profile data, using fallback email');
            userEmail = 'demo@example.com';
            localStorage.setItem('userEmail', userEmail);
          }
        }
        
        const queryParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
        
        const response = await fetch(`/api/participant/dashboard${queryParam}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          
          // Check if database is not configured
          if (response.status === 500 && errorText.includes('database')) {
            setIsDbConfigured(false);
            throw new Error('Database not configured');
          }
          
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data) {
          setCourses(data.data.courses || []);
          setCertificates(data.data.certificates || []);
          setStats(data.data.stats || []);
          setNotifications(data.data.notifications || []);
          setIsDbConfigured(true);
          
          // After successful data fetch, ensure auth state is preserved again
          preserveParticipantAuth();
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        if (err instanceof Error && err.message.includes('Database not configured')) {
          setIsDbConfigured(false);
          setError('Database not configured. Please click the button below to configure the database.');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Add a separate useEffect to ensure profile data is loaded
  useEffect(() => {
    const loadProfileData = async () => {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        try {
          const profileResponse = await fetch(`/api/profile/get?email=${encodeURIComponent(userEmail)}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.data) {
              // Store profile data in localStorage for consistency
              localStorage.setItem('userProfile', JSON.stringify(profileData.data));
              console.log('Profile data loaded and stored:', profileData.data);
            }
          }
        } catch (error) {
          console.log('Could not load profile data:', error);
        }
      }
    };
    
    loadProfileData();
  }, []);

  // Setup database
  const setupDatabase = async () => {
    setConfiguring(true);
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode: 'minimal' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsDbConfigured(true);
        
        // Save demo email for seamless experience
        localStorage.setItem('userEmail', 'demo@example.com');
        
        alert('Database configured successfully!');
        window.location.reload();
      } else {
        const error = await response.text();
        console.error('Error configuring database:', error);
        alert('Failed to configure database. See console for details.');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      alert('An error occurred while configuring the database.');
    } finally {
      setConfiguring(false);
    }
  };

  // Render icon based on name
  const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
    switch (iconName) {
      case "BookOpen": return <BookOpen className={className} />;
      case "FileText": return <FileText className={className} />;
      case "CreditCard": return <CreditCard className={className} />;
      case "Calendar": return <Calendar className={className} />;
      case "Clock": return <Clock className={className} />;
      case "CheckCircle2": return <CheckCircle2 className={className} />;
      case "AlertCircle": return <AlertCircle className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  // Show database configuration if needed
  if (!isDbConfigured) {
    return (
      <ParticipantLayout>
        <div className="p-4">
          <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Database Configuration Required</h2>
            <p className="text-gray-600 mb-6">
              The database needs to be configured before you can view your dashboard. 
              Click the button below to set up the database with sample data.
            </p>
            <button
              onClick={setupDatabase}
              disabled={configuring}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {configuring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                  Configuring...
                </>
              ) : 'Configure Database'}
            </button>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <ParticipantLayout>
        <div className="p-4 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <ParticipantLayout>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout>
      <div className="p-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
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
                My Courses
              </button>
              <button
                onClick={() => setActiveTab("certificates")}
                className={`py-3 px-4 text-sm font-medium ${
                  activeTab === "certificates"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Certificates
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "courses" && (
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No courses found. Register for a course to see it here.
                  </div>
                ) : (
                  courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-700">{course.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>Next session: {course.nextSession}</span>
                        </div>
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
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "certificates" && (
              <div className="space-y-4">
                {certificates.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No certificates found. Complete a course to earn a certificate.
                  </div>
                ) : (
                  certificates.map((cert, idx) => (
                    <Link
                      key={cert.id || idx}
                      href={`/participant/certificate/${cert.id}`}
                      className={`block p-4 rounded-lg mb-2 ${
                        cert.status === "valid"
                          ? "bg-green-50 border border-green-100"
                          : cert.status === "expired"
                          ? "bg-red-50 border border-red-100"
                          : "bg-yellow-50 border border-yellow-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">
                          {cert.courseName}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            cert.status === "valid"
                              ? "bg-green-100 text-green-800"
                              : cert.status === "expired"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {cert.status === "valid"
                            ? "Valid"
                            : cert.status === "expired"
                            ? "Expired"
                            : "Expiring Soon"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                        <p>
                          Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3 text-gray-700">Important Notifications</h3>
          {notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No notifications at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="flex items-start gap-3">
                  {notification.icon === "AlertCircle" && (
                    <AlertCircle className={`w-5 h-5 text-${notification.color}-500 mt-0.5`} />
                  )}
                  {notification.icon === "CheckCircle2" && (
                    <CheckCircle2 className={`w-5 h-5 text-${notification.color}-500 mt-0.5`} />
                  )}
                  {notification.icon === "CreditCard" && (
                    <CreditCard className={`w-5 h-5 text-${notification.color}-500 mt-0.5`} />
                  )}
              <div>
                    <p className="text-sm font-medium text-gray-700">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.message}</p>
                  </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ParticipantLayout>
  );
};

export default DashboardPage;
