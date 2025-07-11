"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Layout from "@/components/common/Layout";

interface Instructor {
  id: string;
  full_name: string;
  email?: string;
}

interface Course {
  id: string;
  course_name: string;
}

export default function SendInstructorCertificatePage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Form data
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  // Fetch instructors and courses on component mount
  useEffect(() => {
    fetchInstructors();
    fetchCourses();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/instructure?format=simple");
      const data = await response.json();
      if (response.ok) {
        setInstructors(data.instructors || []);
      } else {
        toast.error("Failed to fetch instructors");
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Failed to fetch instructors");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses?format=simple");
      const data = await response.json();
      if (response.ok) {
        setCourses(data.courses || []);
      } else {
        toast.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInstructor || !selectedCourse || !certificateName || !issueDate || !expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);
    
    try {
      const response = await fetch("/api/instructure/certificate/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructureId: selectedInstructor,
          courseId: selectedCourse,
          certificateName,
          issueDate,
          expiryDate,
          driveLink: driveLink || undefined,
          pdfUrl: pdfUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Certificate sent successfully to instructor!");
        
        // Reset form
        setSelectedInstructor("");
        setSelectedCourse("");
        setCertificateName("");
        setIssueDate("");
        setExpiryDate("");
        setDriveLink("");
        setPdfUrl("");
      } else {
        toast.error(data.error || "Failed to send certificate");
      }
    } catch (error) {
      console.error("Error sending certificate:", error);
      toast.error("Failed to send certificate");
    } finally {
      setSending(false);
    }
  };

  const selectedInstructorData = instructors.find(i => i.id === selectedInstructor);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">
                Send Certificate to Instructor
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Issue a new certificate to an instructor for a specific course
              </p>
            </div>

            {loading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading instructors...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                {/* Instructor Selection */}
                <div>
                  <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Instructor *
                  </label>
                  <select
                    id="instructor"
                    value={selectedInstructor}
                    onChange={(e) => setSelectedInstructor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose an instructor...</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.full_name} {instructor.email ? `(${instructor.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Selection */}
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Course *
                  </label>
                  <select
                    id="course"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Certificate Name */}
                <div>
                  <label htmlFor="certificateName" className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Name *
                  </label>
                  <input
                    type="text"
                    id="certificateName"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Advanced Web Development Certificate"
                    required
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Drive Link */}
                <div>
                  <label htmlFor="driveLink" className="block text-sm font-medium text-gray-700 mb-2">
                    Google Drive Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="driveLink"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>

                {/* PDF URL */}
                <div>
                  <label htmlFor="pdfUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    PDF URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="pdfUrl"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/certificate.pdf"
                  />
                </div>

                {/* Selected Instructor Info */}
                {selectedInstructorData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Instructor</h3>
                    <p className="text-sm text-blue-700">
                      <strong>Name:</strong> {selectedInstructorData.full_name}
                    </p>
                    {selectedInstructorData.email && (
                      <p className="text-sm text-blue-700">
                        <strong>Email:</strong> {selectedInstructorData.email}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending..." : "Send Certificate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 