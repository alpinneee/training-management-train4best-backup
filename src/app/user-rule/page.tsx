"use client";

import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import Button from "@/components/common/button";
import Modal from "@/components/common/Modal";
import Layout from "@/components/common/Layout";
import Table from "@/components/common/table";
import { toast } from "react-hot-toast";

interface Rule {
  id: string;
  no: number;
  roleName: string;
  description: string;
  status: "Active" | "Inactive";
}

interface Column {
  header: string;
  accessor: keyof Rule | ((data: Rule) => React.ReactNode);
}

export default function UserRulePage(): ReactElement {
  const [userRules, setUserRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  
  const [newRule, setNewRule] = useState({
    roleName: "",
    description: "",
    status: "Active" as "Active" | "Inactive",
  });

  const itemsPerPage = 10;

  // Fetch rules on component mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user-rule");
      if (!response.ok) {
        throw new Error("Failed to fetch user rules");
      }
      const data = await response.json();
      setUserRules(data);
    } catch (error) {
      console.error("Error fetching user rules:", error);
      setError("Failed to load user rules. Please try again.");
      toast.error("Failed to load user rules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (rule: Rule) => {
    setSelectedRule(rule);
    setNewRule({
      roleName: rule.roleName,
      description: rule.description,
      status: rule.status,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (rule: Rule) => {
    setSelectedRule(rule);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewRule((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!newRule.roleName) {
        throw new Error("Role name is required");
      }

      const response = await fetch("/api/user-rule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName: newRule.roleName,
          description: newRule.description,
          status: newRule.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add user rule");
      }

      // Add new rule to state with proper numbering
      setUserRules(prev => {
        const newRuleWithNo = {
          ...data,
          no: prev.length + 1
        };
        return [...prev, newRuleWithNo];
      });
      
      setIsModalOpen(false);
      setNewRule({
        roleName: "",
        description: "",
        status: "Active",
      });
      
      toast.success("User rule added successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    
    setError("");
    setIsLoading(true);

    try {
      // Validate input
      if (!newRule.roleName.trim()) {
        throw new Error("Role name is required");
      }

      const response = await fetch(`/api/user-rule/${selectedRule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleName: newRule.roleName.trim(),
          description: newRule.description.trim(),
          status: newRule.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || "Failed to update user rule");
      }

      // Update rule in state
      setUserRules(prev => 
        prev.map(rule => rule.id === selectedRule.id ? { ...data, no: rule.no } : rule)
      );
      
      setIsEditModalOpen(false);
      setSelectedRule(null);
      setNewRule({
        roleName: "",
        description: "",
        status: "Active",
      });
      
      toast.success("User rule updated successfully");
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!selectedRule) return;
    
    setIsLoading(true);
    setError("");

    try {
      const url = force 
        ? `/api/user-rule/${selectedRule.id}?force=true` 
        : `/api/user-rule/${selectedRule.id}`;
      
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        
        // If error is about rules in use and we're not forcing deletion
        if (data.error?.includes('in use by users') && !force) {
          setIsLoading(false);
          setError("This rule is in use by users. Delete anyway?");
          return;
        }
        
        throw new Error(data.error || "Failed to delete user rule");
      }

      // Remove rule from state and renumber
      setUserRules(prev => {
        const filtered = prev.filter(rule => rule.id !== selectedRule.id);
        return filtered.map((rule, index) => ({
          ...rule,
          no: index + 1
        }));
      });
      
      setIsDeleteModalOpen(false);
      setSelectedRule(null);
      toast.success("User rule deleted successfully");
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter rules by search term
  const filteredRules = userRules.filter(rule => 
    searchTerm === "" || 
    rule.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRules = filteredRules.slice(indexOfFirstItem, indexOfLastItem);

  const columns: Column[] = [
    {
      header: "No",
      accessor: "no",
    },
    {
      header: "Role Name",
      accessor: "roleName",
    },
    {
      header: "Description", 
      accessor: "description",
    },
    {
      header: "Status",
      accessor: (rule) => (
        <span
          className={`px-1.5 py-0.5 rounded text-xs ${
            rule.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {rule.status}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: (rule) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(rule)}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(rule)}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (isLoading && userRules.length === 0) {
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
          User Rules
        </h1>

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

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto text-xs"
          >
            Add New Rule
          </Button>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="px-2 py-1 text-xs border rounded-lg w-full sm:w-auto text-gray-700"
          />
        </div>

        {userRules.length === 0 && !isLoading ? (
          <div className="text-center py-4 text-gray-500">No user rules found</div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <Table 
              columns={columns} 
              data={currentRules} 
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredRules.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Add Rule Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Add New Rule
            </h2>
            <form onSubmit={handleSubmit} className="space-y-2 text-gray-700">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  name="roleName"
                  value={newRule.roleName}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={newRule.description}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newRule.status}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Rule"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Rule Modal */}
        {isEditModalOpen && (
          <Modal onClose={() => setIsEditModalOpen(false)}>
            <h2 className="text-base font-semibold mb-2 text-gray-700">
              Edit Rule
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  name="roleName"
                  value={newRule.roleName}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={newRule.description}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newRule.status}
                  onChange={handleInputChange}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="gray"
                  size="small"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  type="submit"
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedRule && (
          <Modal onClose={() => setIsDeleteModalOpen(false)}>
            <h2 className="text-base font-semibold text-gray-700">Delete Rule</h2>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to delete the rule <span className="font-semibold">{selectedRule.roleName}</span>?
            </p>
            {error && error.includes("in use by users") && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 mt-2 rounded text-xs">
                <p>Warning: This rule is in use by users. Force deletion may cause data inconsistency.</p>
              </div>
            )}
            <div className="flex justify-end mt-3 gap-2">
              <Button
                variant="gray"
                size="small"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs px-2 py-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              {error && error.includes("in use by users") ? (
                <Button
                  variant="red"
                  size="small"
                  onClick={() => handleDelete(true)}
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  Force Delete
                </Button>
              ) : (
                <Button
                  variant="red"
                  size="small"
                  onClick={() => handleDelete()}
                  className="text-xs px-2 py-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
