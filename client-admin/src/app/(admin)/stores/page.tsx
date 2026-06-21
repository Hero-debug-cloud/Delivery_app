"use client";

import React, { useState, useEffect } from "react";
import { 
  Store as StoreIcon, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useStores } from "@/features/stores/hooks/useStores";
import { StoreModal } from "@/features/stores/components/StoreModal";
import { useAuthStore } from "@/features/auth/store";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import type { Store } from "@/features/stores/types";

export default function StoresPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const isManagerOrDispatcher = user?.role === "store_manager" || user?.role === "dispatcher";

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Query Params mapping
  const isActiveParam = statusFilter === "all" ? undefined : statusFilter === "active";
  const {
    stores,
    pagination,
    isLoading,
    createStore,
    isCreating,
    updateStore,
    isUpdating,
    deleteStore,
  } = useStores({
    search: debouncedSearch || undefined,
    isActive: isActiveParam,
    page: currentPage,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  const handleToggleActive = async (store: Store) => {
    if (!isSuperAdmin && user?.role !== "store_manager") return;
    try {
      setPageError(null);
      await updateStore({
        id: store.id,
        data: { isActive: !store.isActive },
      });
    } catch (err: any) {
      console.error(err);
      setPageError(err.message || "Failed to update store status.");
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!isSuperAdmin) return;
    if (!window.confirm("Are you sure you want to delete this store? This action cannot be undone.")) return;
    
    try {
      setPageError(null);
      await deleteStore(storeId);
    } catch (err: any) {
      console.error(err);
      setPageError(err.message || "Failed to delete store.");
      // Auto clear error after 5s
      setTimeout(() => setPageError(null), 5000);
    }
  };

  const handleSaveStore = async (values: any) => {
    try {
      setPageError(null);
      if (selectedStore) {
        await updateStore({
          id: selectedStore.id,
          data: values,
        });
      } else {
        await createStore(values);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      throw err; // Propagate to modal for inline error
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title + Action */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Store Management</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Configure and manage logistics dispatch points.</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => {
              setSelectedStore(null);
              setIsModalOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Store</span>
          </button>
        )}
      </div>

      {/* Global Error Notice */}
      {pageError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-center gap-3 text-[13px] font-medium">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-neutral-50">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Filter stores by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
            
            {/* Status Filter dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-700 cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="inactive">Status: Inactive</option>
            </select>
          </div>

          <span className="text-[12px] font-semibold text-neutral-500 self-center">
            {pagination?.totalItems ?? 0} stores configured
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary-600" size={32} />
              <span className="text-[13px] text-neutral-500 font-semibold">Loading stores database...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <StoreIcon className="text-neutral-300 mb-3" size={48} />
              <h3 className="text-[15px] font-bold text-neutral-800">No stores found</h3>
              <p className="text-[12px] text-neutral-400 mt-1 max-w-xs">
                Try adjusting your search filters or create a new store in the system.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-[12px] font-bold bg-neutral-50/50 uppercase tracking-wider">
                  <th className="p-4 pl-6">Store Info</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Coordinates (Lat/Lng)</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[13px] font-medium text-neutral-700">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-neutral-50/50 transition-all align-middle">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          <StoreIcon size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900">{store.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">{store.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-500 max-w-xs truncate">{store.address}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-neutral-500 font-mono text-[12px]">
                        <MapPin size={13} className="text-neutral-400 shrink-0" />
                        <span>{store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-neutral-400 shrink-0" />
                        <span>{store.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        store.isActive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-neutral-100 text-neutral-500 border-neutral-200"
                      }`}>
                        {store.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end items-center gap-3">
                        {/* Toggle active switch - accessible by Super Admin and Store Manager */}
                        {(isSuperAdmin || (user?.role === "store_manager")) && (
                          <button 
                            onClick={() => handleToggleActive(store)} 
                            className="text-neutral-400 hover:text-neutral-700 transition-all cursor-pointer"
                            title={store.isActive ? "Deactivate Store" : "Activate Store"}
                          >
                            {store.isActive ? (
                              <ToggleRight size={28} className="text-primary-600" />
                            ) : (
                              <ToggleLeft size={28} className="text-neutral-300" />
                            )}
                          </button>
                        )}
                        
                        {/* Edit - Super Admin only */}
                        {isSuperAdmin && (
                          <button 
                            onClick={() => {
                              setSelectedStore(store);
                              setIsModalOpen(true);
                            }}
                            className="text-[12px] font-bold text-primary-600 hover:text-primary-700 transition-all px-2.5 py-1 hover:bg-primary-50 rounded cursor-pointer"
                          >
                            Edit
                          </button>
                        )}

                        {/* Delete - Super Admin only */}
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDeleteStore(store.id)} 
                            className="text-neutral-400 hover:text-red-600 transition-all p-1 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}

                        {/* View only indicator for other roles */}
                        {isManagerOrDispatcher && !isSuperAdmin && user?.role !== "store_manager" && (
                          <span className="text-[11px] text-neutral-400 italic">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination && (
          <PaginationFooter
            currentPage={currentPage}
            limit={pagination.limit}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onPageChange={(page) => setCurrentPage(page)}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Edit/Create Dialog Popover */}
      <StoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStore}
        store={selectedStore}
        isSaving={isCreating || isUpdating}
      />
    </div>
  );
}
