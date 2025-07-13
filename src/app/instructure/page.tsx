"use client";

import React, { useState, useEffect } from "react";

import Button from "@/components/common/button";
import Layout from "@/components/common/Layout";
import Table from "@/components/common/table";
import Modal from "@/components/common/Modal";
import { useSession, getSession } from "next-auth/react";
import Link from "next/link";

interface Instructure {
  no: number;
  id: string;
  fullName: string;
  phoneNumber: string;
  proficiency: string;
  address: string;
  email?: string;
  birthDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface HistoryItem {
  id: string;
  type: string;
  description: string;
  changedBy: string;
  date: string | Date;
  details?: {
    [key: string]: any;
  };
}

interface Column {
  header: string;
  accessor: keyof Instructure | ((data: Instructure) => React.ReactNode);
  className?: string;
}

interface ApiResponse {
  data: Instructure[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const InstructurePage = () => {
  const { data: session, status } = useSession();
  const [authChecked, setAuthChecked] = useState(false);
  const [instructures, setInstructures] = useState<Instructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentInstructure, setCurrentInstructure] =
    useState<Instructure | null>(null);

  // State for history modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedInstructure, setSelectedInstructure] =
    useState<Instructure | null>(null);

  // State for eligible users
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // State for history data
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    proficiency: "",
    address: "",
    email: "",
    password: "",
    birthDate: "",
    username: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // State tambahan untuk modal delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instructureToDelete, setInstructureToDelete] = useState<string | null>(
    null
  );
  const [deleteReason, setDeleteReason] = useState<string>("");
  const [forceDelete, setForceDelete] = useState<boolean>(false);

  // Fetch data from API
  const fetchInstructures = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const response = await fetch(`/api/instructure?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch instructures");
      }

      const data: ApiResponse = await response.json();

      setInstructures(data.data);
      setTotalItems(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching instructures:", err);
    } finally {
      setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
      if (sessionData.user.userType?.toLowerCase() !== "admin") {
        setError("Admin access required");
        setAuthChecked(true);
        setIsLoading(false);
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
    fetchInstructures();
  }, [authChecked, currentPage, searchTerm]);

  // Handle search with debounce
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Form handling
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: "",
      phoneNumber: "",
      proficiency: "",
      address: "",
      email: "",
      password: "",
      birthDate: "",
      username: "",
    });
    setIsEditMode(false);
    setCurrentInstructure(null);
  };

  // Open modal for adding
  const handleAddClick = () => {
    resetForm();
    setIsEditMode(false);
    fetchEligibleUsers(); // Fetch eligible users when opening the modal
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditClick = async (instructure: Instructure) => {
    try {
      const response = await fetch(`/api/instructure/${instructure.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch instructure details");
      }

      const data = await response.json();

      // Format birthDate jika ada
      const formattedBirthDate = data.birthDate
        ? new Date(data.birthDate).toISOString().split("T")[0]
        : "";

      setFormData({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        proficiency: data.proficiency,
        address: data.address,
        email: data.email || "",
        username: data.username || "",
        password: data.password || "",
        birthDate: formattedBirthDate,
      });

      setCurrentInstructure(instructure);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching instructure details:", err);
      alert("Failed to load instructure details for editing");
    }
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && currentInstructure) {
      // Validasi untuk mode edit
      if (
        !formData.fullName ||
        !formData.phoneNumber ||
        !formData.proficiency ||
        !formData.address
      ) {
        alert("Please fill all required fields");
        return;
      }

      try {
        // Update existing instructure - only update instructure data, not user data
        const response = await fetch(
          `/api/instructure/${currentInstructure.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName: formData.fullName,
              phoneNumber: formData.phoneNumber,
              proficiency: formData.proficiency,
              address: formData.address,
              birthDate: formData.birthDate,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update instructure");
        }

        // Refresh data after update
        fetchInstructures();
        setIsModalOpen(false);
        resetForm();
        alert("Instructure updated successfully");
      } catch (err) {
        console.error("Error submitting form:", err);
        alert(err instanceof Error ? err.message : "An unknown error occurred");
      }
    } else {
      // Validasi untuk mode tambah baru
      if (
        !formData.fullName ||
        !formData.phoneNumber ||
        !formData.proficiency ||
        !formData.address ||
        !formData.username ||
        !formData.password
      ) {
        alert("Please fill all required fields");
        return;
      }

      try {
        // Create new instructure
        const response = await fetch("/api/instructure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to create instructure");
        }

        // Refresh data after creation
        fetchInstructures();
        setIsModalOpen(false);
        resetForm();
        alert("Instructure created successfully");
      } catch (err) {
        console.error("Error submitting form:", err);
        alert(err instanceof Error ? err.message : "An unknown error occurred");
      }
    }
  };

  // Function to fetch eligible users (users who are not instructors)
  const fetchEligibleUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user?role=participant");

      if (!response.ok) {
        throw new Error("Failed to fetch eligible users");
      }

      const data = await response.json();
      // Filter users who are not instructors
      const filteredUsers = data.users.filter(
        (user: User) => !user.role.toLowerCase().includes("instruct")
      );

      setEligibleUsers(filteredUsers);
    } catch (err) {
      console.error("Error fetching eligible users:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load eligible users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to promote a user to instructor
  const promoteToInstructor = async (user: User) => {
    setIsLoading(true);
    try {
      console.log("Promoting user to instructor:", user);

      // Fetch complete participant data first
      const participantResponse = await fetch(`/api/participant/${user.id}`);
      let participantData = null;

      if (participantResponse.ok) {
        participantData = await participantResponse.json();
        console.log("Found participant data:", participantData);
      } else {
        console.warn("Could not find participant data for user:", user.id);
      }

      // Step 1: Update user role to Instructure
      const userResponse = await fetch(`/api/user/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: "Instructure",
          username: user.name, // Make sure username is passed
        }),
      });

      const userResult = await userResponse.json();
      console.log("User role update response:", userResult);

      if (!userResponse.ok) {
        throw new Error(
          `Failed to update user role: ${userResult.error || "Unknown error"}`
        );
      }

      // Check if the user already has an instructure ID after role update
      if (!userResult.instructureId) {
        // Only create instructure record if one wasn't created during role update
        console.log("No instructureId found, creating new instructure record");

        // Step 2: Create instructure record with all available participant data
        const instructureData = {
          fullName: participantData?.full_name || user.name,
          phoneNumber: participantData?.phone_number || "",
          address: participantData?.address || "",
          email: user.email || participantData?.email || "",
          birthDate: participantData?.birth_date || null,
          proficiency: participantData?.job_title || "", // Gunakan job title sebagai proficiency awal
        };
        console.log("Creating instructure with data:", instructureData);

        const instructureResponse = await fetch("/api/instructure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(instructureData),
        });

        if (!instructureResponse.ok) {
          const errorData = await instructureResponse.json();
          console.error("Error creating instructure:", errorData);
          throw new Error(
            `Failed to create instructure: ${
              errorData.error || "Unknown error"
            }`
          );
        }

        const instructureResult = await instructureResponse.json();
        console.log("Instructure creation response:", instructureResult);

        if (!instructureResponse.ok) {
          throw new Error(
            `Failed to create instructure record: ${
              instructureResult.error || "Unknown error"
            }`
          );
        }
      } else {
        console.log(
          "User already has instructureId:",
          userResult.instructureId
        );
      }

      // Refresh data
      fetchInstructures();

      // Remove the user from eligible users list
      setEligibleUsers((prev) => prev.filter((u) => u.id !== user.id));

      // When promoting multiple users, don't close modal or show alert for each one
      console.log(`${user.name} has been promoted to Instructor`);
    } catch (err) {
      console.error("Error promoting user:", err);
      setError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete click untuk membuka modal konfirmasi
  const handleDeleteClick = (id: string) => {
    setInstructureToDelete(id);
    setDeleteReason("");
    setForceDelete(false);
    setIsDeleteModalOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!instructureToDelete) {
      return;
    }

    const id = instructureToDelete;
    setIsLoading(true);

    try {
      console.log(`Attempting to delete instructure ID: ${id}`);
      const url = forceDelete
        ? `/api/instructure/${id}?force=true`
        : `/api/instructure/${id}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Delete error:", data);

        // Jika ada hint tentang force delete, tampilkan opsi untuk force delete
        if (data.hint && data.hint.includes("force=true") && !forceDelete) {
          setDeleteReason(
            data.error || "There are associated items with this instructure"
          );
          setForceDelete(true);
          return;
        }

        throw new Error(data.error || "Failed to delete instructure");
      }

      console.log("Delete success:", data);

      // Tutup modal dan reset state
      setIsDeleteModalOpen(false);
      setInstructureToDelete(null);
      setDeleteReason("");
      setForceDelete(false);

      if (data.usersUpdated && data.usersUpdated.length > 0) {
        alert(
          `Instructure deleted successfully. ${
            data.usersUpdated.length
          } user(s) have been changed to ${data.newRole || "default"} role.`
        );
      } else {
        alert("Instructure deleted successfully");
      }

      // Refresh data after deletion
      fetchInstructures();
    } catch (err) {
      console.error("Error deleting instructure:", err);

      // Show a more user-friendly error message
      if (err instanceof Error) {
        if (err.message.includes("associated with users")) {
          setDeleteReason(
            "Cannot delete this instructure because they are associated with users. Please use force delete to proceed."
          );
          setForceDelete(true);
        } else if (err.message.includes("associated with classes")) {
          setDeleteReason(
            "Cannot delete this instructure because they are associated with classes. Please use force delete to proceed."
          );
          setForceDelete(true);
        } else {
          alert(`Failed to delete instructure: ${err.message}`);
          setIsDeleteModalOpen(false);
          setInstructureToDelete(null);
        }
      } else {
        alert("Failed to delete instructure due to an unknown error");
        setIsDeleteModalOpen(false);
        setInstructureToDelete(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch history data for an instructor
  const fetchInstructureHistory = async (instructure: Instructure) => {
    setIsLoadingHistory(true);
    setHistoryItems([]);

    try {
      const response = await fetch(
        `/api/instructure/${instructure.id}/history`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch history data");
      }

      const data = await response.json();

      if (data && Array.isArray(data.history)) {
        setHistoryItems(data.history);
      } else {
        // If API doesn't return history yet, set empty array
        setHistoryItems([]);
      }

      setSelectedInstructure(instructure);
      setIsHistoryModalOpen(true);
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistoryItems([]);
      setSelectedInstructure(instructure);
      setIsHistoryModalOpen(true);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateStr: string | Date): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return String(dateStr);

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      return `${date.getDate()} ${
        months[date.getMonth()]
      } ${date.getFullYear()}`;
    } catch (e) {
      return String(dateStr);
    }
  };

  const columns: Column[] = [
    {
      header: "NO",
      accessor: "no",
      className: "w-12 text-center",
    },
    {
      header: "Full Name",
      accessor: (data: Instructure) => (
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <span className="text-xs">{data.fullName}</span>
        </div>
      ),
      className: "min-w-[200px]",
    },
    {
      header: "Phone Number",
      accessor: (data: Instructure) => (
        <span className="text-xs">{data.phoneNumber}</span>
      ),
      className: "min-w-[120px]",
    },
    {
      header: "Email",
      accessor: (data: Instructure) => (
        <span className="text-xs">{data.email}</span>
      ),
      className: "min-w-[150px]",
    },
    {
      header: "Proficiency",
      accessor: (data: Instructure) => (
        <span className="text-xs">{data.proficiency}</span>
      ),
      className: "min-w-[120px]",
    },
    {
      header: "Action",
      accessor: (data: Instructure) => (
        <div className="flex gap-1 justify-center">
          <button
            className="p-1 border rounded hover:bg-gray-100"
            title="View History"
            onClick={() => fetchInstructureHistory(data)}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="#374151"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            className="p-1 border rounded hover:bg-gray-100"
            title="Edit"
            onClick={() => handleEditClick(data)}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="#374151"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            className="p-1 border rounded hover:bg-gray-100"
            title="Delete"
            onClick={() => handleDeleteClick(data.id)}
          >
            <svg
              className="w-3 h-3 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
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
          <div className="flex flex-col space-y-3">
            <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout variant="admin">
      <div className="p-2">
        <h1 className="text-lg md:text-xl text-gray-700 mb-2">Instructure</h1>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={handleAddClick}
              className="w-full sm:w-auto text-xs"
            >
              Add New Instructure
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className="px-2 py-1 text-xs border rounded-lg w-full sm:w-auto text-gray-700"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-60">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table
              columns={columns}
              data={instructures}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        {/* Add/Edit Instructure Modal */}
        {isModalOpen && !isEditMode && (
          <Modal
            onClose={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          >
            <div className="w-full">
              <h2 className="text-base mb-2 text-gray-700">Select Users</h2>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Current Role
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Select
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eligibleUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                          {user.name}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                          {user.role}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers((prev) => [...prev, user]);
                              } else {
                                setSelectedUsers((prev) =>
                                  prev.filter((u) => u.id !== user.id)
                                );
                              }
                            }}
                            checked={selectedUsers.some(
                              (u) => u.id === user.id
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                    {eligibleUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-2 py-4 text-center text-xs text-gray-500"
                        >
                          No eligible users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    if (selectedUsers.length > 0) {
                      // Promote all selected users
                      Promise.all(
                        selectedUsers.map((user) => promoteToInstructor(user))
                      )
                        .then(() => {
                          alert(
                            `Successfully promoted ${selectedUsers.length} user(s) to Instructor`
                          );
                          setSelectedUsers([]);
                          setIsModalOpen(false);
                        })
                        .catch((err) => {
                          console.error("Error promoting users:", err);
                          alert("An error occurred while promoting users");
                        });
                    } else {
                      alert("Please select at least one user");
                    }
                  }}
                  disabled={selectedUsers.length === 0 || isLoading}
                  className="text-xs px-2 py-1"
                >
                  {isLoading
                    ? "Processing..."
                    : `Promote ${selectedUsers.length} Selected User(s)`}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {isModalOpen && isEditMode && (
          <Modal
            onClose={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          >
            <div className="w-full">
              <h2 className="text-base font-semibold mb-2 text-gray-700">
                Edit Instructure
              </h2>
              <form onSubmit={handleSubmit} className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    readOnly={isEditMode}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Proficiency
                  </label>
                  <input
                    type="text"
                    name="proficiency"
                    value={formData.proficiency}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Enter your proficiency"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate || ""}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="gray"
                    size="small"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
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
                    Update Instructure
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* History Modal */}
        {isHistoryModalOpen && selectedInstructure && (
          <Modal onClose={() => setIsHistoryModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700 mb-2">
              History - {selectedInstructure.fullName}
            </h2>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {historyItems.length > 0 ? (
                  historyItems.map((item) => (
                    <div key={item.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {item.type}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Changed by: {item.changedBy}
                      </p>

                      {/* Display additional details if available */}
                      {item.details && (
                        <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-1 rounded">
                          {item.details.courseName && (
                            <p>
                              Course:{" "}
                              <span className="font-medium">
                                {item.details.courseName}
                              </span>
                            </p>
                          )}
                          {item.details.location && (
                            <p>
                              Location:{" "}
                              <span className="font-medium">
                                {item.details.location}
                              </span>
                            </p>
                          )}
                          {item.details.startDate && (
                            <p>
                              Start Date:{" "}
                              <span className="font-medium">
                                {formatDate(item.details.startDate)}
                              </span>
                            </p>
                          )}
                          {item.details.endDate && (
                            <p>
                              End Date:{" "}
                              <span className="font-medium">
                                {formatDate(item.details.endDate)}
                              </span>
                            </p>
                          )}
                          {item.details.value && (
                            <p>
                              Value:{" "}
                              <span className="font-medium">
                                {item.details.value}
                              </span>
                            </p>
                          )}
                          {item.details.valueType && (
                            <p>
                              Type:{" "}
                              <span className="font-medium">
                                {item.details.valueType}
                              </span>
                            </p>
                          )}
                          {item.details.participantName && (
                            <p>
                              Participant:{" "}
                              <span className="font-medium">
                                {item.details.participantName}
                              </span>
                            </p>
                          )}
                          {item.details.remark && (
                            <p>
                              Remark:{" "}
                              <span className="font-medium">
                                {item.details.remark}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No history records found
                  </p>
                )}
              </div>
            )}
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <div className="w-full">
              <h2 className="text-base font-semibold mb-2 text-gray-700">
                Confirm Delete
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this instructure?
              </p>

              {deleteReason && (
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-md mb-4">
                  <p className="text-xs">{deleteReason}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setInstructureToDelete(null);
                    setDeleteReason("");
                    setForceDelete(false);
                  }}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="red"
                  size="small"
                  onClick={handleDelete}
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Processing..."
                    : forceDelete
                    ? "Force Delete"
                    : "Delete"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default InstructurePage;
