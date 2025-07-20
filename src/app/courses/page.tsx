"use client";

import Image from "next/image";
import { Eye, PenSquare, Trash2, Plus, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Card from "@/components/common/card";
import Layout from "@/components/common/Layout";
import { useSession, getSession } from "next-auth/react";

interface Course {
  id: string;
  course_name: string;
  description: string | null;
  image: string | null;
  courseTypeId: string;
  courseType: string; 
}

interface CourseType {
  id: string;
  course_type: string;
}

export default function Courses() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authChecked, setAuthChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(8);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseImage, setCourseImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editCourseImage, setEditCourseImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_name: '',
    description: '',
    courseTypeId: '',
    image: '/default-course.jpg'
  });

  // Auth check for admin
  useEffect(() => {
    async function checkAuth() {
      if (status === "loading") return;
      let sessionData = session;
      if (!sessionData) {
        for (let i = 0; i < 10; i++) {
          sessionData = await getSession();
          if (sessionData?.user) break;
          await new Promise(res => setTimeout(res, 200));
        }
      }
      if (!sessionData?.user) {
        setError("Authentication required");
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      if (sessionData.user.userType?.toLowerCase() !== "admin") {
        setError("Admin access required");
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      setAuthChecked(true);
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // Load initial data
  useEffect(() => {
    if (!authChecked) return;
    if (error) return;
    fetchCourses();
    fetchCourseTypes();
  }, [authChecked, currentPage, searchTerm]);

  if (error && (error.includes("Authentication required") || error.includes("Admin access required"))) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/courses?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      setCourses(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course types for dropdown
  const fetchCourseTypes = async () => {
    try {
      const response = await fetch('/api/course-types');
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      setCourseTypes(data);
    } catch (err) {
      console.error('Error fetching course types:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      return;
    }
    
    setCourseImage(file);
    
    // Create preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      return;
    }
    
    setEditCourseImage(file);
    
    // Create preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (courseId: string, imageFile: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('courseId', courseId);
      
      const response = await fetch('/api/upload/course-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi manual
    if (!newCourse.course_name.trim() || !newCourse.courseTypeId) {
      alert("Course name and course type are required");
      return;
    }
    
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: newCourse.course_name,
          courseTypeId: newCourse.courseTypeId,
          description: newCourse.description,
          image: newCourse.image,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create course');
      }
      
      const courseData = await response.json();
      
      // Upload image if available
      if (courseImage) {
        try {
          const imageUrl = await uploadImage(courseData.id, courseImage);
          courseData.image = imageUrl;
        } catch (imgError) {
          console.error('Error uploading course image:', imgError);
          // Continue even if image upload fails
        }
      }
      
      // Reset form and close modal
      setIsModalOpen(false);
      setNewCourse({
        course_name: '',
        description: '',
        courseTypeId: '',
        image: '/default-course.jpg'
      });
      setCourseImage(null);
      setImagePreview(null);
      
      // Refresh courses
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setNewCourse({
      course_name: course.course_name,
      description: course.description || '',
      courseTypeId: course.courseTypeId,
      image: course.image || '/default-course.jpg'
    });
    setEditImagePreview(course.image || null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse) return;
    
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update course');
      }
      
      // Upload new image if selected
      if (editCourseImage) {
        try {
          const imageUrl = await uploadImage(selectedCourse.id, editCourseImage);
          // Update the course with new image URL
          await fetch(`/api/courses/${selectedCourse.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageUrl }),
          });
        } catch (imgError) {
          console.error('Error uploading course image:', imgError);
          // Continue even if image upload fails
        }
      }
      
      // Reset form and close modal
      setIsEditModalOpen(false);
      setSelectedCourse(null);
      setNewCourse({
        course_name: '',
        description: '',
        courseTypeId: '',
        image: '/default-course.jpg'
      });
      setEditCourseImage(null);
      setEditImagePreview(null);
      
      // Refresh courses
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourse) return;
    
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.hint && data.hint.includes('force=true') && 
            window.confirm(`${data.error}\n\nAre you sure you want to delete this course and all related classes?`)) {
          // Force delete if there are classes
          const forceResponse = await fetch(`/api/courses/${selectedCourse.id}?force=true`, {
            method: 'DELETE',
          });
          
          if (!forceResponse.ok) {
            const forceData = await forceResponse.json();
            throw new Error(forceData.error || 'Failed to delete course');
          }
        } else {
          throw new Error(data.error || 'Failed to delete course');
        }
      }
      
      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="p-2">
        <h1 className="text-lg md:text-xl text-gray-600 mb-2">Courses</h1>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto text-xs"
          >
            Add Course
          </Button>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={handleSearch}
            className="w-full sm:w-auto px-2 py-1 text-xs border rounded-lg text-gray-700"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
            <div className="flex justify-center py-60">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
        ):  (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <Card>
                    <div className="relative h-32 w-full">
                      {course.image && course.image.startsWith('/') ? (
                        // Untuk static files lokal, gunakan img tag
                        <img
                          src={course.image}
                          alt={course.course_name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        // Untuk remote images, gunakan Next.js Image
                        <Image
                          src={course.image || "/default-course.jpg"}
                          alt={course.course_name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">{course.course_name}</p>
                      <p className="text-xs text-gray-600 mb-2">Type: {course.courseType}</p>
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          <button 
                            className="text-gray-600 p-1"
                            onClick={() => handleEditCourse(course)}
                          >
                            <PenSquare size={14} />
                          </button>
                          <button 
                            className="text-red-500 p-1"
                            onClick={() => handleDeleteClick(course)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No courses found
              </div>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Add Course Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">Add New Course</h2>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  name="course_name"
                  value={newCourse.course_name}
                  onChange={handleInputChange}
                  placeholder="Enter course name"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Course Type</label>
                <select
                  name="courseTypeId"
                  value={newCourse.courseTypeId}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course Type</option>
                  {courseTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.course_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={newCourse.description}
                  onChange={handleInputChange}
                  placeholder="Enter course description"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Course Image</label>
                <div className="flex flex-col space-y-2">
                  {imagePreview && (
                    <div className="relative h-32 w-full mb-2">
                      <Image
                        src={imagePreview}
                        alt="Course Preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="gray"
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs flex items-center"
                    >
                      <Upload size={12} className="mr-1" /> Upload Image
                    </Button>
                    <span className="ml-2 text-xs text-gray-500">Max size: 2MB</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Course Modal */}
        {isEditModalOpen && selectedCourse && (
          <Modal onClose={() => setIsEditModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">Edit Course</h2>
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Course Name</label>
                <input
                  type="text"
                  name="course_name"
                  value={newCourse.course_name}
                  onChange={handleInputChange}
                  placeholder="Enter course name"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Course Type</label>
                <select
                  name="courseTypeId"
                  value={newCourse.courseTypeId}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course Type</option>
                  {courseTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.course_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={newCourse.description}
                  onChange={handleInputChange}
                  placeholder="Enter course description"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Course Image</label>
                <div className="flex flex-col space-y-2">
                  {editImagePreview && (
                    <div className="relative h-32 w-full mb-2">
                      <Image
                        src={editImagePreview}
                        alt="Course Preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditFileChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="gray"
                      size="small"
                      onClick={() => editFileInputRef.current?.click()}
                      className="text-xs flex items-center"
                    >
                      <Upload size={12} className="mr-1" /> Change Image
                    </Button>
                    <span className="ml-2 text-xs text-gray-500">Max size: 2MB</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedCourse && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700">Delete Course</h2>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to delete <strong>{selectedCourse.course_name}</strong>?
            </p>
            <div className="flex justify-end mt-2">
              <Button 
                variant="gray" 
                size="small"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs px-2 py-1 mr-2"
              >
                Cancel
              </Button>
              <Button 
                variant="red" 
                size="small"
                onClick={handleDeleteConfirm}
                className="text-xs px-2 py-1"
              >
                Delete
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
