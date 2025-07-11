interface PaginationCompactProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationCompact = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationCompactProps) => {
  // If we have fewer than 7 pages, show all pages
  // Otherwise, show a limited set with ellipses
  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-2 py-0.5 text-xs rounded-sm ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      ));
    }

    // Always show first page, last page, current page, and pages adjacent to current
    let pages = [1];
    
    // Calculate range around current page
    const leftSide = Math.max(2, currentPage - 1);
    const rightSide = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis if needed before current page area
    if (leftSide > 2) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add pages around current page
    for (let i = leftSide; i <= rightSide; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed after current page area
    if (rightSide < totalPages - 1) {
      pages.push(-2); // -2 represents ellipsis (different key from first ellipsis)
    }

    // Add last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((page, index) => {
      if (page < 0) {
        // This is an ellipsis
        return <span key={page} className="px-1 text-xs text-gray-500">...</span>;
      }
      
      return (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-2 py-0.5 text-xs rounded-sm ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-2 py-0.5 text-xs rounded-sm bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
      >
        Prev
      </button>
      
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-2 py-0.5 text-xs rounded-sm bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  );
};

export default PaginationCompact; 