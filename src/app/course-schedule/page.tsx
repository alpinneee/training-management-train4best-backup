"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/common/Layout";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/table";
import { useSession, getSession } from "next-auth/react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
}

interface Schedule {
  no: number;
  id: string;
  className: string;
  date: string;
  location: string;
  room: string;
  status: string;
  price: number;
  quota: number;
  courseId: string;
}

interface Course {
  id: string;
  course_name: string;
}

const CourseSchedulePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authChecked, setAuthChecked] = useState(false);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    courseId: "",
    startDate: "",
    endDate: "",
    startRegDate: "",
    endRegDate: "",
    location: "",
    room: "",
    price: "",
    quota: "",
    durationDay: "",
    status: "Active",
  });

  // Fetch course schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const response = await fetch(`/api/course-schedule?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      setSchedules(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedules");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available courses for dropdown
  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses?format=simple");

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setCourses(data.courses || []); // Menggunakan property 'courses' yang sesuai dengan API response
      console.log("Fetched courses:", data.courses); // Menambahkan log untuk debugging
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]); // Set to empty array on error
    }
  };

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
    fetchSchedules();
    fetchCourses();
  }, [authChecked, currentPage, searchTerm]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewSchedule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Konversi nilai string menjadi number untuk fields numerik
      const formattedData = {
        ...newSchedule,
        price: Number(newSchedule.price),
        quota: Number(newSchedule.quota),
        durationDay: Number(newSchedule.durationDay),
      };

      console.log("Submitting course schedule data:", formattedData);

      const response = await fetch("/api/course-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to create schedule");
      }

      const responseData = await response.json();
      console.log("Success response:", responseData);

      // Reset form and close modal
      setIsModalOpen(false);
      setNewSchedule({
        courseId: "",
        startDate: "",
        endDate: "",
        startRegDate: "",
        endRegDate: "",
        location: "",
        room: "",
        price: "",
        quota: "",
        durationDay: "",
        status: "Active",
      });

      // Refresh schedules
      fetchSchedules();
    } catch (err) {
      console.error("Error creating schedule:", err);
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDetailClick = (id: string) => {
    router.push(`/course-schedule/${id}`);
  };

  const handleDeleteClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSchedule) return;

    try {
      const response = await fetch(
        `/api/course-schedule/${selectedSchedule.id}`,
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
            `${data.error}\n\nAre you sure you want to delete this schedule and all related data?`
          )
        ) {
          // Force delete if there are registrations or instructors
          const forceResponse = await fetch(
            `/api/course-schedule/${selectedSchedule.id}?force=true`,
            {
              method: "DELETE",
            }
          );

          if (!forceResponse.ok) {
            const forceData = await forceResponse.json();
            throw new Error(forceData.error || "Failed to delete schedule");
          }
        } else {
          throw new Error(data.error || "Failed to delete schedule");
        }
      }

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const columns: Column<Schedule>[] = [
    {
      header: "No",
      accessor: "no",
      className: "w-12 text-center",
    },
    {
      header: "Class Name",
      accessor: (data: Schedule) => (
        <span className="text-xs">{data.className}</span>
      ),
      className: "min-w-[120px]",
    },
    {
      header: "Date",
      accessor: (data: Schedule) => (
        <span className="text-xs">{data.date}</span>
      ),
      className: "min-w-[150px]",
    },
    {
      header: "Location",
      accessor: (data: Schedule) => (
        <span className="text-xs">{data.location}</span>
      ),
      className: "min-w-[100px]",
    },
    {
      header: "Status",
      accessor: (data: Schedule) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            data.status === "Active"
              ? "bg-green-100 text-green-800"
              : data.status === "Completed"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {data.status}
        </span>
      ),
      className: "w-24 text-center",
    },
    {
      header: "Action",
      accessor: (schedule: Schedule) => (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => handleDetailClick(schedule.id)}
            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
          >
            Detail
          </button>
          <button
            className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
            onClick={() => handleDeleteClick(schedule)}
          >
            Delete
          </button>
        </div>
      ),
      className: "w-24 text-center",
    },
  ];

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

  return (
    <Layout>
      <div className="p-2">
        <h1 className="text-lg md:text-xl text-gray-700 mb-2">
          Course Schedule
        </h1>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
          <div>
            <Button
              variant="primary"
              size="small"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto text-xs"
            >
              Add New Course Schedule
            </Button>
          </div>
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
          <div className="overflow-x-auto -mx-2 px-2">
            <Table
              columns={columns}
              data={schedules}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Add Schedule Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Add New Schedule
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Course
                  </label>
                  <select
                    name="courseId"
                    value={newSchedule.courseId}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses && courses.length > 0 ? (
                      courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading courses...</option>
                    )}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newSchedule.status}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={newSchedule.startDate}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={newSchedule.endDate}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Registration Start Date
                  </label>
                  <input
                    type="date"
                    name="startRegDate"
                    value={newSchedule.startRegDate}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Registration End Date
                  </label>
                  <input
                    type="date"
                    name="endRegDate"
                    value={newSchedule.endRegDate}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={newSchedule.location}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={newSchedule.room}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newSchedule.price}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    min="0"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Quota
                  </label>
                  <input
                    type="number"
                    name="quota"
                    value={newSchedule.quota}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    min="1"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    name="durationDay"
                    value={newSchedule.durationDay}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
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
                >
                  Add Schedule
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedSchedule && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700">
              Delete Schedule
            </h2>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to delete the schedule for{" "}
              <strong>{selectedSchedule.className}</strong>?
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
};
export default CourseSchedulePage;
