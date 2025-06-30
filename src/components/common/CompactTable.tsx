"use client";

import { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T, index?: number) => ReactNode);
  className?: string;
}

interface CompactTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  totalItems?: number;
}

export default function CompactTable<T>({
  columns,
  data,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 5,
  totalItems = 0,
}: CompactTableProps<T>) {
  const renderCell = (item: T, column: Column<T>, rowIndex: number): ReactNode => {
    if (typeof column.accessor === "function") {
      return column.accessor(item, rowIndex);
    }
    const value = item[column.accessor as keyof T];
    return value === undefined || value === null ? "" : String(value);
  };

  return (
    <div className="bg-white rounded shadow">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto" style={{ maxWidth: '100%' }}>
        <table className="w-full border-collapse min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-1.5 py-1 text-xs text-gray-500 ${column.className}`}
                  >
                    {renderCell(item, column, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.map((item, rowIndex) => (
          <div 
            key={rowIndex} 
            className="border-b p-1.5 hover:bg-gray-50 text-xs"
          >
            {columns.map((column, colIndex) => (
              <div 
                key={colIndex} 
                className="flex justify-between py-0.5"
              >
                <span className="font-medium text-gray-500 text-xs">
                  {column.header}
                </span>
                <span className={`text-gray-900 break-words text-xs ${column.className}`}>
                  {renderCell(item, column, rowIndex)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {onPageChange && (
        <div className="bg-white px-1.5 py-1 flex items-center justify-between border-t">
          {/* Mobile pagination */}
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-1.5 py-0.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-1 relative inline-flex items-center px-1.5 py-0.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-1.5 py-0.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => onPageChange(i + 1)}
                    className={`relative inline-flex items-center px-2 py-0.5 border text-xs font-medium ${
                      currentPage === i + 1
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-1.5 py-0.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 