import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

interface InfiniteSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  items: { id: string; name: string }[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading?: boolean;
}

export function InfiniteSelect({
  value,
  onChange,
  placeholder = "Select an option",
  label,
  error,
  items,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading = false,
}: InfiniteSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Intersection Observer to trigger next page loading
  useEffect(() => {
    if (!isOpen || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const selectedItem = items.find((item) => item.id === value);

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={dropdownRef}>
      {label && <span className="text-[13px] font-semibold text-neutral-700">{label}</span>}

      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`px-3 py-2 border rounded-md text-[14px] bg-white flex justify-between items-center text-left transition-all ${
          error ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
        } ${isLoading ? "bg-neutral-50 text-neutral-400 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={selectedItem ? "text-neutral-800 font-medium" : "text-neutral-400"}>
          {isLoading ? "Loading..." : selectedItem ? selectedItem.name : placeholder}
        </span>
        <ChevronDown size={16} className={`text-neutral-400 transition-all ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {error && <span className="text-[11px] font-medium text-red-500">{error}</span>}

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-40 border border-neutral-200 bg-white rounded-md shadow-card max-h-[200px] overflow-y-auto flex flex-col p-1.5">
          {items.length === 0 && !isLoading && (
            <div className="p-3 text-[13px] text-neutral-400 text-center font-medium">No options available</div>
          )}

          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-[13px] font-semibold rounded hover:bg-neutral-50 transition-all ${
                item.id === value ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:text-neutral-900"
              }`}
            >
              {item.name}
            </button>
          ))}

          {hasNextPage && (
            <div ref={sentinelRef} className="py-2.5 flex justify-center items-center gap-1.5 text-neutral-400">
              <Loader2 className="animate-spin text-primary-500" size={13} />
              <span className="text-[11px] font-medium">Loading more options...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
