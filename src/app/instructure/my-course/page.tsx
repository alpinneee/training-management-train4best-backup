'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/common/Layout';
import { useRouter } from 'next/navigation';

// Define interfaces for type safety
interface Course {
  id: string;
  courseName: string;
  courseType: string;
  location: string;
  room: string;
  startDate: string;
  endDate: string;
  students: number;
  quota: number;
  price: number;
  status: 'active' | 'completed' | 'upcoming';
}

export default function InstructureMyCourse() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Get email from localStorage if available
        const email = localStorage.getItem('userEmail');
        if (email) {
          setUserEmail(email);
        }

        // Fetch courses assigned to the instructure
        const response = await fetch(`/api/instructure/my-courses${email ? `?email=${email}` : ''}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setCourses(data.data);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);
  
  // Filter courses based on selected filter
  const filteredCourses = filter === 'all' 
    ? courses 
    : courses.filter(course => course.status === filter);

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Function to get first letter of course name
  const getFirstLetter = (courseName: string) => {
    return courseName.charAt(0).toUpperCase();
  };
  
  return (
    <Layout variant="instructure">
      <div className="p-2 sm:p-3 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-3">My Courses</h1>
        
        {/* Filter buttons */}
        <div className="inline-flex bg-gray-100 rounded-md mb-4">
          <button 
            onClick={() => setFilter('all')}
            className={`px-5 py-2 text-sm rounded-l-md ${filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`px-5 py-2 text-sm ${filter === 'active' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-5 py-2 text-sm ${filter === 'upcoming' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-5 py-2 text-sm rounded-r-md ${filter === 'completed' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Completed
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-6 rounded-md text-center">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm mt-1">You are not assigned to any courses{filter !== 'all' ? ` with "${filter}" status` : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="relative">
                  {/* Course Type Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-500 text-white">
                      {course.courseType}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {course.status === 'upcoming' ? 'Upcoming' : 'Active'}
                    </span>
                  </div>
                  
                  {/* Course Letter Background */}
                  <div className="bg-blue-50 h-40 flex justify-center items-center">
                    <div className="text-blue-200 text-[170px] font-bold leading-none">
                      {getFirstLetter(course.courseName)}
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 mb-2 text-base">{course.courseName}</h3>

                  <div className="space-y-1 text-sm">
                    <div>
                      <p className="text-gray-500">Jadwal:</p>
                      <p className="text-gray-800">{course.location} - {formatDate(course.startDate).split(' ')[0]} {formatDate(course.startDate).split(' ')[1]}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500">Mulai:</p>
                        <p className="text-gray-800">{formatDate(course.startDate).split(' ')[0]} {formatDate(course.startDate).split(' ')[1]}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Selesai:</p>
                        <p className="text-gray-800">{formatDate(course.endDate).split(' ')[0]} {formatDate(course.endDate).split(' ')[1]}</p>
                      </div>
                    </div>

                 
                  </div>
                  
                  <div className="mt-3">
                    <button 
                      onClick={() => router.push(`/instructure/my-course/${course.id}`)}
                      className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 