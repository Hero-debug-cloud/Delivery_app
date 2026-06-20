import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationFooterProps {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PaginationFooter({
  currentPage,
  limit,
  totalItems,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  isLoading = false,
}: PaginationFooterProps) {
  // Compute the range of items currently displayed for UI layout purposes
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(totalItems, currentPage * limit);

  // Generate pagination page array with smart truncation (e.g. [1, "...", 4, 5, 6, "...", 10])
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push("...");
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  const handlePrev = () => {
    if (hasPrevious && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-6 py-4 select-none">
      {/* Items Range Info */}
      <div className="text-[13px] text-neutral-500 font-medium">
        Showing <span className="font-semibold text-neutral-800">{startItem}</span> to{" "}
        <span className="font-semibold text-neutral-800">{endItem}</span> of{" "}
        <span className="font-semibold text-neutral-800">{totalItems}</span> entries
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={!hasPrevious || isLoading}
          className={`p-1.5 rounded-md border text-neutral-600 transition-all flex items-center justify-center cursor-pointer ${
            !hasPrevious || isLoading
              ? "border-neutral-200 bg-neutral-50/50 text-neutral-300 cursor-not-allowed"
              : "border-neutral-200 bg-white hover:bg-neutral-50 active:bg-neutral-100"
          }`}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2.5 py-1.5 text-[13px] text-neutral-400 font-medium select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = currentPage === pageNum;

            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => !isLoading && onPageChange(pageNum)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-[13px] font-semibold rounded-md border transition-all cursor-pointer min-w-[34px] text-center ${
                  isActive
                    ? "bg-primary-600 border-primary-600 text-white shadow-button-primary"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!hasNext || isLoading}
          className={`p-1.5 rounded-md border text-neutral-600 transition-all flex items-center justify-center cursor-pointer ${
            !hasNext || isLoading
              ? "border-neutral-200 bg-neutral-50/50 text-neutral-300 cursor-not-allowed"
              : "border-neutral-200 bg-white hover:bg-neutral-50 active:bg-neutral-100"
          }`}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
