"use client";

import Image from "next/image";
import {
  Eye,
  PenSquare,
  Trash2,
  Plus,
  Info,
  Book,
  Bookmark,
} from "lucide-react";
import { useState, useEffect } from "react";
import Pagination from "@/components/common/Pagination";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Card from "@/components/common/card";
import Layout from "@/components/common/Layout";
import { toast, Toaster } from "react-hot-toast";

interface CourseType {
  id: string;
  course_type: string;
}

export default function CourseTypePage() {
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCourseType, setSelectedCourseType] =
    useState<CourseType | null>(null);
  const [newCourseType, setNewCourseType] = useState({
    course_type: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load course types on initial render
  useEffect(() => {
    fetchCourseTypes();
  }, [currentPage, searchTerm]);

  // Fetch course types with pagination
  const fetchCourseTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
      });

      const response = await fetch(`/api/course-types?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      // Handle pagination on client side for now
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

      setCourseTypes(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load course types"
      );
      setCourseTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCourseType((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear form error when user types
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (!newCourseType.course_type.trim()) {
        setFormError("Course type name is required");
        return;
      }

      const response = await fetch("/api/course-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCourseType),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create course type");
      }

      // Reset form and close modal
      setIsModalOpen(false);
      setNewCourseType({
        course_type: "",
      });

      // Show success message
      toast.success("Course type added successfully");

      // Refresh course types
      fetchCourseTypes();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCourseType = (courseType: CourseType) => {
    setSelectedCourseType(courseType);
    setNewCourseType({
      course_type: courseType.course_type,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseType) return;

    setFormLoading(true);
    setFormError(null);

    try {
      if (!newCourseType.course_type.trim()) {
        setFormError("Course type name is required");
        return;
      }

      const response = await fetch(
        `/api/course-types/${selectedCourseType.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCourseType),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update course type");
      }

      // Reset form and close modal
      setIsEditModalOpen(false);
      setSelectedCourseType(null);
      setNewCourseType({
        course_type: "",
      });

      // Show success message
      toast.success("Course type updated successfully");

      // Refresh course types
      fetchCourseTypes();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePreviewCourseType = (courseType: CourseType) => {
    setSelectedCourseType(courseType);
    setIsPreviewModalOpen(true);
  };

  const handleDeleteClick = (courseType: CourseType) => {
    setSelectedCourseType(courseType);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourseType) return;

    setFormLoading(true);

    try {
      const response = await fetch(
        `/api/course-types/${selectedCourseType.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          data.hint &&
          data.hint.includes("force=true") &&
          window.confirm(
            `${data.error}\n\nAre you sure you want to delete this course type and all related courses?`
          )
        ) {
          // Force delete if there are related courses
          const forceResponse = await fetch(
            `/api/course-types/${selectedCourseType.id}?force=true`,
            {
              method: "DELETE",
            }
          );

          const forceData = await forceResponse.json();

          if (!forceResponse.ok) {
            throw new Error(forceData.error || "Failed to delete course type");
          }

          toast.success("Course type and related courses deleted successfully");
        } else {
          throw new Error(data.error || "Failed to delete course type");
        }
      } else {
        toast.success("Course type deleted successfully");
      }

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setSelectedCourseType(null);
      fetchCourseTypes();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Get paginated items
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return courseTypes.slice(indexOfFirstItem, indexOfLastItem);
  };

  return (
    <Layout>
      <div className="p-2">
        <Toaster position="top-right" />
        <h1 className="text-lg md:text-xl text-gray-600 mb-2">Course Type</h1>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto text-xs"
          >
            Add Course Type
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
            {getCurrentItems().length > 0 ? (
              getCurrentItems().map((courseType, index) => (
                <div
                  key={courseType.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <Card>
                    <div className="relative h-32 w-full bg-gray-100 flex items-center justify-center">
                      <div className="text-3xl font-bold text-gray-300">
                        {courseType.course_type.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-gray-700 mb-2">
                        Course Type: {courseType.course_type}
                      </p>
                      <div className="flex justify-between">
                        <button
                          className="text-blue-600 p-1"
                          onClick={() => handlePreviewCourseType(courseType)}
                        >
                          <Eye size={14} />
                        </button>
                        <div className="flex gap-1">
                          <button
                            className="text-gray-600 p-1"
                            onClick={() => handleEditCourseType(courseType)}
                          >
                            <PenSquare size={14} />
                          </button>
                          <button
                            className="text-red-500 p-1"
                            onClick={() => handleDeleteClick(courseType)}
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
                No course types found
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

        {/* Add Course Type Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Add New Course Type
            </h2>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Course Type Name
                </label>
                <input
                  type="text"
                  name="course_type"
                  value={newCourseType.course_type}
                  onChange={handleInputChange}
                  placeholder="Enter course type name"
                  className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formError ? "border-red-500" : ""
                  }`}
                  required
                  disabled={formLoading}
                />
                {formError && (
                  <p className="text-red-500 text-xs mt-1">{formError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs px-2 py-1"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={formLoading}
                >
                  {formLoading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Course Type Modal */}
        {isEditModalOpen && selectedCourseType && (
          <Modal onClose={() => setIsEditModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Edit Course Type
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Course Type Name
                </label>
                <input
                  type="text"
                  name="course_type"
                  value={newCourseType.course_type}
                  onChange={handleInputChange}
                  placeholder="Enter course type name"
                  className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formError ? "border-red-500" : ""
                  }`}
                  required
                  disabled={formLoading}
                />
                {formError && (
                  <p className="text-red-500 text-xs mt-1">{formError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs px-2 py-1"
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={formLoading}
                >
                  {formLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Preview Course Type Modal */}
        {isPreviewModalOpen && selectedCourseType && (
          <Modal onClose={() => setIsPreviewModalOpen(false)}>
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Course Type Detail
              </h2>

              <div className="grid grid-cols-1 gap-3">
                <div className="relative h-40 w-full mb-2 bg-gray-100 flex items-center justify-center">
                  <div className="text-6xl font-bold text-gray-300">
                    {selectedCourseType.course_type
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                </div>

                <div className="border rounded-md p-3 bg-gray-50">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    {selectedCourseType.course_type}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <p className="flex items-center gap-2">
                      <Book size={14} className="text-blue-600" />
                      <span className="font-medium">Type ID:</span>{" "}
                      {selectedCourseType.id}
                    </p>

                    <p className="flex items-center gap-2">
                      <Bookmark size={14} className="text-blue-600" />
                      <span className="font-medium">Name:</span>{" "}
                      {selectedCourseType.course_type}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-xs px-3 py-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedCourseType && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700">
              Delete Course Type
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to delete{" "}
              <strong>{selectedCourseType.course_type}</strong>?
            </p>
            <div className="flex justify-end mt-2">
              <Button
                variant="gray"
                size="small"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs px-2 py-1 mr-2"
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                variant="red"
                size="small"
                onClick={handleDeleteConfirm}
                className="text-xs px-2 py-1"
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
