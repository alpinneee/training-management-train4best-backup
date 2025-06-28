"use client";

import Image from "next/image";
import {
  Eye,
  PenSquare,
  Trash2,
  Plus,
  Upload,
  Info,
  Book,
  Bookmark,
  CalendarRange,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Card from "@/components/common/card";
import Layout from "@/components/common/Layout";

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
    course_name: "",
    description: "",
    courseTypeId: "",
    image: "/default-course.jpg",
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  // Fetch course and course types on initial render
  useEffect(() => {
    fetchCourses();
    fetchCourseTypes();
  }, [currentPage, searchTerm]);

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
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
      setError(err instanceof Error ? err.message : "Failed to load courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course types for dropdown
  const fetchCourseTypes = async () => {
    try {
      const response = await fetch("/api/course-types");

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setCourseTypes(data);
    } catch (err) {
      console.error("Error fetching course types:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setNewCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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
      formData.append("file", imageFile);
      formData.append("courseId", courseId);

      const response = await fetch("/api/upload/course-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCourse),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create course");
      }

      const courseData = await response.json();

      // Upload image if available
      if (courseImage) {
        try {
          const imageUrl = await uploadImage(courseData.id, courseImage);
          courseData.image = imageUrl;
        } catch (imgError) {
          console.error("Error uploading course image:", imgError);
          // Continue even if image upload fails
        }
      }

      // Reset form and close modal
      setIsModalOpen(false);
      setNewCourse({
        course_name: "",
        description: "",
        courseTypeId: "",
        image: "/default-course.jpg",
      });
      setCourseImage(null);
      setImagePreview(null);

      // Refresh courses
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setNewCourse({
      course_name: course.course_name,
      description: course.description || "",
      courseTypeId: course.courseTypeId,
      image: course.image || "/default-course.jpg",
    });
    setEditImagePreview(course.image || null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) return;

    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCourse),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update course");
      }

      // Upload new image if selected
      if (editCourseImage) {
        try {
          const imageUrl = await uploadImage(
            selectedCourse.id,
            editCourseImage
          );
          // Update the course with new image URL
          await fetch(`/api/courses/${selectedCourse.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: imageUrl }),
          });
        } catch (imgError) {
          console.error("Error uploading course image:", imgError);
          // Continue even if image upload fails
        }
      }

      // Reset form and close modal
      setIsEditModalOpen(false);
      setSelectedCourse(null);
      setNewCourse({
        course_name: "",
        description: "",
        courseTypeId: "",
        image: "/default-course.jpg",
      });
      setEditCourseImage(null);
      setEditImagePreview(null);

      // Refresh courses
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
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
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          data.hint &&
          data.hint.includes("force=true") &&
          window.confirm(
            `${data.error}\n\nAre you sure you want to delete this course and all related classes?`
          )
        ) {
          // Force delete if there are classes
          const forceResponse = await fetch(
            `/api/courses/${selectedCourse.id}?force=true`,
            {
              method: "DELETE",
            }
          );

          if (!forceResponse.ok) {
            const forceData = await forceResponse.json();
            throw new Error(forceData.error || "Failed to delete course");
          }
        } else {
          throw new Error(data.error || "Failed to delete course");
        }
      }

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Function to handle view detail
  const handleViewDetail = (course: Course) => {
    setDetailCourse(course);
    setIsDetailModalOpen(true);
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
            className="w-full sm:w-auto px-2 py-1 text-xs border rounded-lg"
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <Card>
                    <div className="relative h-32 w-full">
                      <Image
                        src={course.image || "/default-course.jpg"}
                        alt={course.course_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {course.course_name}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        Type: {course.courseType}
                      </p>
                      <div className="flex justify-between">
                        <button
                          className="text-blue-600 p-1"
                          onClick={() => handleViewDetail(course)}
                        >
                          <Eye size={14} />
                        </button>
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
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Add New Course
            </h2>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Course Name
                </label>
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
                <label className="block text-xs text-gray-700 mb-1">
                  Course Type
                </label>
                <select
                  name="courseTypeId"
                  value={newCourse.courseTypeId}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course Type</option>
                  {courseTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.course_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newCourse.description}
                  onChange={handleInputChange}
                  placeholder="Enter course description"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Course Image
                </label>
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
                    <span className="ml-2 text-xs text-gray-500">
                      Max size: 2MB
                    </span>
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
                  {uploadingImage ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Course Modal */}
        {isEditModalOpen && selectedCourse && (
          <Modal onClose={() => setIsEditModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Edit Course
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Course Name
                </label>
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
                <label className="block text-xs text-gray-700 mb-1">
                  Course Type
                </label>
                <select
                  name="courseTypeId"
                  value={newCourse.courseTypeId}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course Type</option>
                  {courseTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.course_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newCourse.description}
                  onChange={handleInputChange}
                  placeholder="Enter course description"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Course Image
                </label>
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
                    <span className="ml-2 text-xs text-gray-500">
                      Max size: 2MB
                    </span>
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
                  {uploadingImage ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedCourse && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700">
              Delete Course
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to delete{" "}
              <strong>{selectedCourse.course_name}</strong>?
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

        {/* Detail Course Modal */}
        {isDetailModalOpen && detailCourse && (
          <Modal onClose={() => setIsDetailModalOpen(false)}>
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Course Detail
              </h2>

              <div className="grid grid-cols-1 gap-3">
                <div className="relative h-40 w-full mb-2">
                  <Image
                    src={detailCourse.image || "/default-course.jpg"}
                    alt={detailCourse.course_name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>

                <div className="border rounded-md p-3 bg-gray-50">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    {detailCourse.course_name}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <p className="flex items-center gap-2">
                      <Book size={14} className="text-blue-600" />
                      <span className="font-medium">Type:</span>{" "}
                      {detailCourse.courseType}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarRange size={14} className="text-blue-600" />
                      <span className="font-medium">ID:</span> {detailCourse.id}
                    </p>

                    {detailCourse.description && (
                      <p className="flex items-start gap-2">
                        <Bookmark
                          size={14}
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                        />
                        <span>
                          <span className="font-medium">Description:</span>
                          <br />
                          {detailCourse.description}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-xs px-3 py-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
