"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/table";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserType {
  id: string;
  usertype: string;
}

interface Column {
  header: string;
  accessor: keyof User | ((data: User) => React.ReactNode);
}

const UserPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Declare all state variables at the top level, regardless of authorization status
  const [users, setUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newUser, setNewUser] = useState({
    username: "",
    jobTitle: "",
    password: "password123",
  });

  const itemsPerPage = 10;

  // Check if user is authenticated as admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      
      // Check localStorage for admin flag (used by direct-login)
      const adminLoginTimestamp = localStorage.getItem("admin_login_timestamp");
      const adminEmail = localStorage.getItem("admin_email");
      
      if (adminLoginTimestamp && adminEmail) {
        console.log("Found admin login data in localStorage");
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }
      
      // Check NextAuth session
      if (status === "authenticated" && session?.user) {
        const userType = String(session.user.userType || "").toLowerCase();
        if (userType === "admin" || userType.includes("admin")) {
          console.log("Admin access granted via NextAuth session");
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }
      }
      
      // If no admin access found and session is loaded, redirect
      if (status !== "loading") {
        console.log("No admin access found, redirecting");
        toast.error("You don't have permission to access this page");
        
        // Check if we have any user type info to redirect appropriately
        const userType = session?.user?.userType?.toLowerCase();
        if (userType?.includes("instruct")) {
          router.replace("/instructure/dashboard");
        } else if (userType?.includes("participant")) {
          router.replace("/participant/dashboard");
        } else {
          router.replace("/login");
        }
      }
      
      setIsLoading(false);
    };
    
    checkAdminAccess();
  }, [status, session, router]);

  // Fetch users and user types on component mount (only if admin)
  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchUsers();
      fetchUserTypes();
      
      // Set up periodic refresh of user data
      const refreshInterval = setInterval(() => {
        fetchUsers();
      }, 5000); // Refresh every 5 seconds
      
      // Clean up interval on unmount
      return () => clearInterval(refreshInterval);
    }
  }, [isAdmin, isLoading]);

  const fetchUserTypes = async () => {
    try {
      const response = await fetch("/api/usertype");
      if (!response.ok) {
        throw new Error("Failed to fetch user types");
      }
      const data = await response.json();
      setUserTypes(data || []);
    } catch (error) {
      console.error("Error fetching user types:", error);
      toast.error("Failed to load user types");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!newUser.username || !newUser.jobTitle) {
        throw new Error("Username and role are required");
      }

      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newUser.username,
          jobTitle: newUser.jobTitle,
          password: newUser.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add user");
      }

      // Add the new user to the state
      setUsers(prev => [...prev, data]);
      
      // Reset form
      setNewUser({
        username: "",
        jobTitle: "",
        password: "password123",
      });
      
      setIsModalOpen(false);
      toast.success("User added successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-60">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }
  
  // If not admin, don't render anything (redirect will happen)
  if (!isAdmin) {
    return null;
  }

  // Get unique roles from users
  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));
  const roles = ["all", ...uniqueRoles];

  // Filter by role and search term
  const filteredUsers = users
    .filter(user => selectedRole === "all" || user.role === selectedRole)
    .filter(user => 
      searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setNewUser({
      username: user.name,
      jobTitle: user.role,
      password: "", // Empty password means don't change it
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/user/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newUser.username,
          jobTitle: newUser.jobTitle,
          password: newUser.password || undefined, // Only send password if changed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      // Update user in state
      setUsers(prev => 
        prev.map(user => user.id === selectedUser.id ? data : user)
      );
      
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setNewUser({
        username: "",
        jobTitle: "",
        password: "",
      });
      
      toast.success("User updated successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError("");

    try {
      const url = force 
        ? `/api/user/${selectedUser.id}?force=true` 
        : `/api/user/${selectedUser.id}`;
      
      console.log(`Sending DELETE request to: ${url}`);
      
      const response = await fetch(url, {
        method: "DELETE",
      });

      // Always try to get the response data
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Error parsing response:", e);
        data = { error: "Failed to parse server response" };
      }

      console.log("Delete response:", response.status, data);

      if (!response.ok) {
        // If error is about associated records and we're not forcing deletion
        if (data.error === 'Cannot delete user that has associated records' && !force) {
          setLoading(false);
          // Set custom error with action button
          setError("This user has associated records. Delete anyway?");
          return; // Stop here and wait for user decision
        }
        
        throw new Error(data.error || "Failed to delete user");
      }

      // Remove user from state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      toast.success("User deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      setError(error.message || "Failed to delete user");
      toast.error(error.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Function to promote a user to instructor role
  const promoteToInstructor = async (user: User) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle: "Instructure", // Change role to Instructure
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to promote user to instructor");
      }
      
      // Update user in state
      setUsers(prev => 
        prev.map(u => u.id === user.id ? {...u, role: "Instructure"} : u)
      );
      
      setIsModalOpen(false);
      setSelectedUser(null);
      toast.success(`${user.name} has been promoted to Instructor`);
    } catch (error: any) {
      console.error("Promotion error:", error);
      setError(error.message || "Failed to promote user");
      toast.error(error.message || "Failed to promote user");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column[] = [
    {
      header: "No",
      accessor: (user: User) => {
        const index = filteredUsers.indexOf(user);
        return index + 1;
      },
    },
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Email",
      accessor: "email",
    },
    {
      header: "Role",
      accessor: "role",
    },
    {
      header: "Action",
      accessor: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(user)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setIsDeleteModalOpen(true);
            }}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <Layout>
          <div className="flex justify-center py-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl text-gray-700">User Management</h1>
          
          {/* Debug button for admin access */}
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/force-login?userType=admin');
                const data = await response.json();
                
                if (data.success) {
                  toast.success("Admin access refreshed");
                  // Store admin data in localStorage
                  localStorage.setItem("admin_login_timestamp", Date.now().toString());
                  localStorage.setItem("admin_email", data.user?.email || "admin@example.com");
                  // Reload the page
                  window.location.reload();
                } else {
                  toast.error("Failed to refresh admin access");
                }
              } catch (error) {
                console.error("Error refreshing admin access:", error);
                toast.error("Error refreshing admin access");
              }
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
          >
            Refresh Admin Access
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 text-gray-700 w-full sm:w-auto mb-4 justify-end">
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="px-2 py-1 text-xs border rounded-lg w-full sm:w-auto"
            >
              {roles.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Roles" : type}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="px-2 py-1 text-xs border rounded-lg w-full sm:w-auto"
            />
          </div>

        <div className="flex flex-col gap-2 p-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-2 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-2"
                onClick={() => setError("")}
              >
                &times;
              </button>
            </div>
          )}

          {users.length === 0 && !loading ? (
            <div className="text-center py-4 text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <Table
                columns={columns}
                data={currentUsers}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredUsers.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Add User Modal */}
          {isModalOpen && (
            <Modal onClose={() => setIsModalOpen(false)}>
              <h2 className="text-base font-semibold mb-2 text-gray-700">
                Select Users to Become Instructors
              </h2>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.filter(user => !user.role.toLowerCase().includes('instruct')).map((user) => (
                      <tr key={user.id}>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            onChange={(e) => {
                              // Handle checkbox selection
                              if (e.target.checked) {
                                setSelectedUser(user);
                              } else {
                                setSelectedUser(null);
                              }
                            }}
                            checked={selectedUser?.id === user.id}
                          />
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                          {user.name}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">
                          {user.role}
                        </td>
                      </tr>
                    ))}
                    {users.filter(user => !user.role.toLowerCase().includes('instruct')).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-xs text-gray-500">
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
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => {
                    if (selectedUser) {
                      promoteToInstructor(selectedUser);
                    } else {
                      toast.error("Please select a user first");
                    }
                  }}
                  disabled={!selectedUser || loading}
                  className="text-xs px-2 py-1"
                >
                  {loading ? "Processing..." : "Promote to Instructor"}
                </Button>
              </div>
            </Modal>
          )}

          {/* Edit User Modal */}
          {isEditModalOpen && (
            <Modal onClose={() => setIsEditModalOpen(false)}>
              <h2 className="text-base font-semibold mb-2 text-gray-700">
                Edit User
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-gray-300 text-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Role</label>
                  <select
                    name="jobTitle"
                    value={newUser.jobTitle}
                    onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-gray-300 text-gray-700"
                    required
                  >
                    <option value="">Select Role</option>
                    {userTypes.map((type) => (
                      <option key={type.id} value={type.usertype}>
                        {type.usertype}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-gray-300 text-gray-700"
                    placeholder="Leave empty to keep current password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to keep current password</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
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
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Modal>
          )}

          {/* Delete Modal */}
          {isDeleteModalOpen && selectedUser && (
            <Modal onClose={() => setIsDeleteModalOpen(false)}>
              <h2 className="text-base font-semibold text-gray-700">Delete User</h2>
              <p className="text-xs text-gray-600 mt-2">
                Are you sure you want to delete user <span className="font-semibold">{selectedUser.name}</span>?
              </p>
              {(error && (error.includes("associated records") || error.includes("Delete anyway?"))) && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 mt-2 rounded text-xs">
                  <p>Warning: This user has associated records. Force deletion may cause data inconsistency.</p>
                </div>
              )}
              <div className="flex justify-end mt-3 gap-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-xs px-2 py-1"
                >
                  Cancel
                </Button>
                {error && (error.includes("Delete anyway?") || error.includes("associated records")) ? (
                  <Button
                    variant="red"
                    size="small"
                    onClick={() => handleDelete(true)}
                    className="text-xs px-2 py-1"
                  >
                    Force Delete
                  </Button>
                ) : (
                  <Button
                    variant="red"
                    size="small"
                    onClick={() => handleDelete()}
                    className="text-xs px-2 py-1" 
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            </Modal>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserPage;

