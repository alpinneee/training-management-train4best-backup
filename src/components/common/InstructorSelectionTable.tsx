"use client";

import { useState } from "react";
import Table from "./table";
import Button from "@/components/common/button";

import { CheckCircle, XCircle } from "lucide-react";

interface Instructor {
  id: string;
  full_name: string;
  profiency: string;
  phone_number?: string;
  isAssigned?: boolean;
}

interface InstructorSelectionTableProps {
  instructors: Instructor[];
  selectedInstructors: string[];
  onSelectInstructor: (instructorId: string) => void;
  onRemoveInstructor: (instructorId: string) => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  totalItems?: number;
}

export default function InstructorSelectionTable({
  instructors,
  selectedInstructors,
  onSelectInstructor,
  onRemoveInstructor,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 5,
  totalItems = 0,
}: InstructorSelectionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter instructors based on search term
  const filteredInstructors = instructors.filter(
    (instructor) =>
      (instructor.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (instructor.profiency?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Define columns for the table
  const columns = [
    {
      header: "Name",
      accessor: (instructor: Instructor) => instructor.full_name,
      className: "font-medium"
    },
    {
      header: "Expertise",
      accessor: (instructor: Instructor) => instructor.profiency,
    },
    {
      header: "Phone",
      accessor: (instructor: Instructor) => instructor.phone_number || "-",
    },
    {
      header: "Status",
      accessor: (instructor: Instructor) => (
        <div className="flex items-center">
          {selectedInstructors.includes(instructor.id) ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Assigned
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <XCircle className="w-3 h-3 mr-1" />
              Not Assigned
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Action",
      accessor: (instructor: Instructor) => (
        <div className="flex justify-end">
          {selectedInstructors.includes(instructor.id) ? (
            <Button
              variant="red"
              size="small"
              onClick={() => onRemoveInstructor(instructor.id)}
              className="text-xs px-2 py-1 h-7"
            >
              Remove
            </Button>
          ) : (
            <Button
              variant="primary"
              size="small"
              onClick={() => onSelectInstructor(instructor.id)}
              className="text-xs px-2 py-1 h-7"
            >
              Assign
            </Button>
          )}
        </div>
      ),
      className: "w-24"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Instructors</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <Table
        columns={columns}
        data={filteredInstructors}
        onPageChange={onPageChange}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
      />
      
      {selectedInstructors.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <h4 className="text-sm font-medium text-blue-800">Selected Instructors: {selectedInstructors.length}</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedInstructors.map((id) => {
              const instructor = instructors.find(i => i.id === id);
              return (
                <div 
                  key={id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {instructor?.full_name}
                  <button
                    onClick={() => onRemoveInstructor(id)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 