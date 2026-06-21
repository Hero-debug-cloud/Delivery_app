"use client";

import React, { useState, useEffect } from "react";
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Trash2,
  AlertCircle,
  Calendar
} from "lucide-react";
import { useUsers } from "@/features/users/hooks/useUsers";
import { UserModal } from "@/features/users/components/UserModal";
import { useAuthStore } from "@/features/auth/store";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import type { User } from "@/features/users/types";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  store_manager: "Store Manager",
  dispatcher: "Dispatcher",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-50 text-red-700 border-red-200",
  store_manager: "bg-blue-50 text-blue-700 border-blue-200",
  dispatcher: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function StaffPage() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isManagerOrDispatcher = currentUser?.role === "store_manager" || currentUser?.role === "dispatcher";

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, roleFilter]);

  // Query Params mapping
  const isActiveParam = statusFilter === "all" ? undefined : statusFilter === "active";
  const roleParam = roleFilter === "all" ? undefined : roleFilter;

  const {
    users,
    pagination,
    isLoading,
    createUser,
    isCreating,
    updateUser,
    isUpdating,
    deleteUser,
  } = useUsers({
    type: "staff",
    search: debouncedSearch || undefined,
    isActive: isActiveParam,
    role: roleParam,
    page: currentPage,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  const handleToggleActive = async (user: User) => {
    if (!isSuperAdmin) return;
    if (user.id === currentUser?.id) {
      setPageError("You cannot deactivate your own administrative account.");
      return;
    }
    try {
      setPageError(null);
      await updateUser({
        id: user.id,
        data: { isActive: !user.isActive },
      });
    } catch (err: any) {
      console.error(err);
      setPageError(err.message || "Failed to update staff account status.");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!isSuperAdmin) return;
    if (user.id === currentUser?.id) {
      setPageError("You cannot delete your own administrative account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the staff account for ${user.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setPageError(null);
      await deleteUser(user.id);
    } catch (err: any) {
      console.error(err);
      setPageError(err.message || "Failed to delete staff account.");
      // Auto clear error after 6s
      setTimeout(() => setPageError(null), 6000);
    }
  };

  const handleSaveUser = async (values: any) => {
    try {
      setPageError(null);
      if (selectedUser) {
        await updateUser({
          id: selectedUser.id,
          data: values,
        });
      } else {
        await createUser(values);
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
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Staff Management</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Configure administrative profiles, assign permissions, and audit platform credentials.</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Add New Staff</span>
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
        <div className="p-4 border-b border-neutral-200 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-neutral-50">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Filter by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
            
            {/* Role Filter dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-700 cursor-pointer"
            >
              <option value="all">Role: All Staff Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="store_manager">Store Manager</option>
              <option value="dispatcher">Dispatcher</option>
            </select>

            {/* Status Filter dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-700 cursor-pointer"
            >
              <option value="all">Status: All Statuses</option>
              <option value="active">Status: Active</option>
              <option value="inactive">Status: Inactive</option>
            </select>
          </div>

          <span className="text-[12px] font-semibold text-neutral-500 self-center">
            {pagination?.totalItems ?? 0} staff accounts registered
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary-600" size={32} />
              <span className="text-[13px] text-neutral-500 font-semibold">Loading staff database...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <UsersIcon className="text-neutral-300 mb-3" size={48} />
              <h3 className="text-[15px] font-bold text-neutral-800">No staff found</h3>
              <p className="text-[12px] text-neutral-400 mt-1 max-w-xs">
                Try adjusting your search criteria or register a new staff member.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-[12px] font-bold bg-neutral-50/50 uppercase tracking-wider">
                  <th className="p-4 pl-6">Profile Info</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Account Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[13px] font-medium text-neutral-700">
                {users.map((item) => {
                  const initials = item.name
                    ? item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                    : 'US';

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-all align-middle">
                      {/* Profile info */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[13px] shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">{item.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono mt-0.5">{item.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-neutral-700 font-semibold">{item.email ?? <span className="text-neutral-400 font-normal italic">No email</span>}</span>
                          <span className="text-[11px] text-neutral-400">{item.phone ?? <span className="text-neutral-400 italic">No phone</span>}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${ROLE_COLORS[item.role] || "bg-neutral-100 text-neutral-600"}`}>
                          {ROLE_LABELS[item.role] || item.role}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                          <Calendar size={13} className="text-neutral-400 shrink-0" />
                          <span>{new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          item.isActive 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-neutral-100 text-neutral-500 border-neutral-200"
                        }`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {/* Toggle active switch - accessible by Super Admin only */}
                          {isSuperAdmin && (
                            <button 
                              onClick={() => handleToggleActive(item)} 
                              className={`text-neutral-400 hover:text-neutral-700 transition-all cursor-pointer ${
                                item.id === currentUser?.id ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              disabled={item.id === currentUser?.id}
                              title={item.isActive ? "Deactivate Staff" : "Activate Staff"}
                            >
                              {item.isActive ? (
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
                                setSelectedUser(item);
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
                              onClick={() => handleDeleteUser(item)} 
                              className={`text-neutral-400 hover:text-red-600 transition-all p-1 hover:bg-red-50 rounded cursor-pointer ${
                                item.id === currentUser?.id ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              disabled={item.id === currentUser?.id}
                              title="Delete Staff"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}

                          {/* View only indicator for other roles */}
                          {isManagerOrDispatcher && !isSuperAdmin && (
                            <span className="text-[11px] text-neutral-400 italic">Read-only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        isSaving={isCreating || isUpdating}
        fixedRole="staff"
      />
    </div>
  );
}
