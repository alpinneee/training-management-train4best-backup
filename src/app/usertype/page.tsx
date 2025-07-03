"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/common/Layout";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/table";
import type { ReactElement } from "react";

interface User {
  no: number;
  idUsertype: string;
  usertype: string;
}

interface NewUser {
  idUsertype?: string; // Made optional for creating new usertypes
  usertype: string;
}

interface Column {
  header: string;
  accessor: keyof User | ((data: User) => React.ReactNode);
}

// API functions
const fetchUsertypesAPI = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/usertype');
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch usertypes:", error);
    throw error;
  }
};

const addUsertypeAPI = async (newUser: NewUser): Promise<User> => {
  try {
    const response = await fetch('/api/usertype', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usertype: newUser.usertype }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to add usertype:", error);
    throw error;
  }
};

const editUsertypeAPI = async (idUsertype: string, updatedUser: NewUser): Promise<User> => {
  try {
    const response = await fetch(`/api/usertype/${idUsertype}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usertype: updatedUser.usertype }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to update usertype:", error);
    throw error;
  }
};

const deleteUsertypeAPI = async (idUsertype: string, force: boolean = false): Promise<void> => {
  try {
    console.log(`Attempting to delete usertype: ${idUsertype}, force: ${force}`);
    const url = force ? `/api/usertype/${idUsertype}?force=true` : `/api/usertype/${idUsertype}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    console.log(`Response status: ${response.status}`);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.error || `Error: ${response.status}`);
    }
    
    console.log('Delete successful');
  } catch (error) {
    console.error("Failed to delete usertype:", error);
    throw error;
  }
};

const UserPage = (): ReactElement => {
  const [usertypeData, setUsertypeData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUsertype, setSelectedUsertype] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<NewUser>({
    idUsertype: "",
    usertype: "",
  });
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [searchTerm, setSearchTerm] = useState<string>(""); // Add search state
  const itemsPerPage = 10;

  // Fetch initial data
  useEffect(() => {
    const loadUsertypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUsertypesAPI();
        setUsertypeData(data);
      } catch (error) {
        console.error("Failed to fetch usertypes:", error);
        setError("Failed to load usertypes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadUsertypes();
  }, []);

  const usertypes = ["all", ...new Set(usertypeData.map((user) => user.usertype))];

  // Filter by selected usertype and search term
  const filteredUsers = usertypeData
    .filter(user => selectedUsertype === "all" || user.usertype === selectedUsertype)
    .filter(user => 
      searchTerm === "" || 
      user.usertype.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.idUsertype.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleUsertypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUsertype(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setNewUser({
      idUsertype: user.idUsertype,
      usertype: user.usertype,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const addedUser = await addUsertypeAPI({ usertype: newUser.usertype });
      // Update the state with the new usertype
      setUsertypeData(prev => {
        const newNo = prev.length > 0 ? Math.max(...prev.map(u => u.no)) + 1 : 1;
        return [...prev, { ...addedUser, no: newNo }];
      });
      setIsModalOpen(false);
      setNewUser({ usertype: "" });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to add usertype");
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setError(null);

    try {
      const updatedUser = await editUsertypeAPI(userToEdit.idUsertype, { usertype: newUser.usertype });
      setUsertypeData(prev =>
        prev.map(user =>
          user.idUsertype === userToEdit.idUsertype ? { ...updatedUser, no: user.no } : user
        )
      );
      setIsEditModalOpen(false);
      setNewUser({ usertype: "" });
      setUserToEdit(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update usertype");
      }
    }
  };

  const handleDeleteConfirm = async (force: boolean = false) => {
    if (!userToDelete) return;
    setError(null);

    try {
      await deleteUsertypeAPI(userToDelete.idUsertype, force);
      setUsertypeData(prev =>
        prev.filter(user => user.idUsertype !== userToDelete.idUsertype)
      );
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        // Cek apakah error berisi informasi tentang user yang menggunakan usertype ini
        if (errorMessage.includes('in use by users')) {
          setError(`${errorMessage}\n\nKlik tombol "Force Delete" untuk menghapus paksa. User akan dialihkan ke usertype default.`);
        } else {
          setError(errorMessage);
        }
      } else {
        setError("Failed to delete usertype");
      }
    }
  };

  const columns: Column[] = [
    { header: "No", accessor: "no" },
    { header: "ID Usertype", accessor: "idUsertype" },
    { header: "Usertype", accessor: "usertype" },
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
            onClick={() => handleDeleteClick(user)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
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
      <div className="p-2">
        <h1 className="text-lg md:text-xl text-gray-700 mb-2">
          UserType
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-2 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-2"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto text-xs"
          >
            Add New Usertype
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 text-gray-700 w-full sm:w-auto">
            <select
              value={selectedUsertype}
              onChange={handleUsertypeChange}
              className="px-2 py-1 text-xs border rounded-lg w-full sm:w-auto"
            >
              {usertypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Usertypes" : type}
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
        </div>

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

        {/* Add Usertype Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Add New Usertype
            </h2>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Usertype</label>
                <input
                  type="text"
                  name="usertype"
                  value={newUser.usertype}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
                  Add Usertype
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Usertype Modal */}
        {isEditModalOpen && (
          <Modal onClose={() => setIsEditModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Edit Usertype
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">ID Usertype</label>
                <input
                  type="text"
                  name="idUsertype"
                  value={newUser.idUsertype}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Usertype</label>
                <input
                  type="text"
                  name="usertype"
                  value={newUser.usertype}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                  required
                />
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
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700">Delete Usertype</h2>
            <p className="text-xs text-gray-600 mt-2">
              Apakah Anda yakin ingin menghapus usertype <span className="font-semibold">{userToDelete?.usertype}</span>?
            </p>
            {error && error.includes('in use by users') && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <p>{error}</p>
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
              {error && error.includes('in use by users') ? (
                <Button
                  variant="red"
                  size="small"
                  onClick={() => handleDeleteConfirm(true)}
                  className="text-xs px-2 py-1"
                >
                  Force Delete
                </Button>
              ) : (
                <Button
                  variant="red"
                  size="small"
                  onClick={() => handleDeleteConfirm()}
                  className="text-xs px-2 py-1"
                >
                  Hapus
                </Button>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default UserPage;
