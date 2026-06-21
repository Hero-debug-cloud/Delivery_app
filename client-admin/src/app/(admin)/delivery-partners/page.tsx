"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Truck, 
  MapPin, 
  Search, 
  UserCheck,
  AlertCircle,
  FileText,
  Plus
} from "lucide-react";
import { useDeliveryPartners } from "@/features/delivery-partners/hooks/useDeliveryPartners";
import { DriverVerificationModal } from "@/features/delivery-partners/components/DriverVerificationModal";
import { CreateDriverModal } from "@/features/delivery-partners/components/CreateDriverModal";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import type { DeliveryPartner } from "@/features/delivery-partners/types";

type OnboardingTab = "submitted" | "approved" | "rejected" | "pending" | "all";

export default function DeliveryPartnersPage() {
  const [activeTab, setActiveTab] = useState<OnboardingTab>("submitted");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<DeliveryPartner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Debounce search query to prevent excessive API hits
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page to 1 when search query changes
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Map activeTab to onboardingStatus query filter
  const onboardingStatus = activeTab === "all" ? undefined : activeTab;

  const {
    drivers,
    pagination,
    isLoading,
    approveDriver,
    isApproving,
    rejectDriver,
    isRejecting,
    createDriver,
    isCreating,
  } = useDeliveryPartners({
    onboardingStatus,
    search: debouncedSearch,
    page,
    limit: 10,
  });

  const handleRowClick = (driver: DeliveryPartner) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleTabChange = (tab: OnboardingTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Re-sync selected driver info if details change
  useEffect(() => {
    if (selectedDriver) {
      const updated = drivers.find((d) => d.id === selectedDriver.id);
      if (updated) {
        setSelectedDriver(updated);
      }
    }
  }, [drivers, selectedDriver]);

  return (
    <div className="flex flex-col gap-8">
      {/* Title + Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Delivery Partners</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">
            Review driver onboard applications, approve license/vehicle registrations, and monitor status.
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Driver</span>
        </button>
      </div>

      {/* Main content card */}
      <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/50">
          {[
            { id: "submitted", label: "Verification Queue" },
            { id: "approved", label: "Active Partners" },
            { id: "rejected", label: "Rejected" },
            { id: "pending", label: "Draft Setup" },
            { id: "all", label: "All Drivers" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as OnboardingTab)}
                className={`px-5 py-3.5 text-[13.5px] font-semibold transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "border-primary-600 text-primary-600 bg-white"
                    : "border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters bar */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/20">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search driver name, phone, license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary-100 border-t-primary-600 animate-spin" />
              <span className="text-[13px] text-neutral-500 font-medium">Fetching drivers from server...</span>
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3.5">
                <User size={24} />
              </div>
              <h3 className="font-bold text-neutral-800 text-[15px]">No Delivery Partners Found</h3>
              <p className="text-neutral-500 text-[13px] mt-1 max-w-sm">
                We couldn't find any partners matching the active filters or search query.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-[12px] font-bold bg-neutral-50/30">
                  <th className="p-4">Driver Profile</th>
                  <th className="p-4">Compliance ID</th>
                  <th className="p-4">Vehicle Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[13.5px]">
                {drivers.map((driver) => (
                  <tr 
                    key={driver.id} 
                    className="hover:bg-neutral-50/30 transition-all cursor-pointer"
                    onClick={() => handleRowClick(driver)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center text-neutral-600">
                          {driver.profilePictureUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={driver.profilePictureUrl} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-800 hover:text-primary-600 transition-colors">
                            {driver.name}
                          </span>
                          <span className="text-[11.5px] text-neutral-400 font-medium">
                            {driver.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-700 text-[13px]">
                          {driver.licenseNumber || "N/A"}
                        </span>
                        {driver.licenseExpiry && (
                          <span className="text-[11px] text-neutral-400 font-medium">
                            Expires: {driver.licenseExpiry}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600">
                      <div className="flex flex-col">
                        {driver.vehicleType ? (
                          <div className="flex items-center gap-1.5 font-semibold text-neutral-700 text-[13px]">
                            <Truck size={13} className="text-neutral-400" />
                            <span className="capitalize">{driver.vehicleType}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic text-[12px]">Not registered</span>
                        )}
                        {driver.vehicleNumber && (
                          <span className="text-[11px] text-neutral-400 uppercase font-bold mt-0.5">
                            {driver.vehicleNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Onboarding Approval Status */}
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold border uppercase tracking-wider ${
                          driver.onboardingStatus === "submitted" 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : driver.onboardingStatus === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : driver.onboardingStatus === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-neutral-100 text-neutral-500 border-neutral-200"
                        }`}>
                          {driver.onboardingStatus}
                        </span>

                        {/* Live Telemetry Status */}
                        {driver.onboardingStatus === "approved" && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            driver.status === "online" 
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" 
                              : driver.status === "busy"
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              : "bg-neutral-100 text-neutral-400 border-neutral-200"
                          }`}>
                            {driver.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleRowClick(driver)}
                        className="text-[13px] font-bold text-primary-600 hover:text-primary-700 transition-all px-3 py-1.5 hover:bg-primary-50 rounded-md border border-transparent hover:border-primary-100"
                      >
                        {driver.onboardingStatus === "submitted" ? "Verify Application" : "View Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <PaginationFooter
            currentPage={page}
            limit={pagination.limit}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Onboarding Verification Modal */}
      <DriverVerificationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDriver(null);
        }}
        driver={selectedDriver}
        onApprove={async (id) => {
          await approveDriver(id);
        }}
        onReject={async (id, reason) => {
          await rejectDriver({ id, reason });
        }}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />

      {/* Create Driver Modal */}
      <CreateDriverModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (data) => {
          await createDriver(data);
        }}
        isCreating={isCreating}
      />
    </div>
  );
}
