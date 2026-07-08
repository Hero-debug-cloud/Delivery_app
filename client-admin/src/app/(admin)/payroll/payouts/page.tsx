"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Store as StoreIcon, 
  Download, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  HelpCircle,
  Eye,
  CheckCircle,
  Building,
  Calendar,
  Layers,
  IndianRupee,
  Coins,
  Sparkles
} from "lucide-react";
import { usePayrollLedgers, usePayrollMutations } from "@/features/payroll/hooks/usePayroll";
import { getExportPayrollLedgersUrl } from "@/features/payroll/api";
import { useAuthStore } from "@/features/auth/store";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import type { PayrollLedger } from "@/features/payroll/types";
import { InfiniteSelect } from "@/components/shared/InfiniteSelect";
import { useInfiniteStores } from "@/features/products/hooks/useProducts";

export default function PayoutsLedgerPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const isStoreManager = user?.role === "store_manager";

  // Filter States
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<'draft' | 'approved' | 'hold' | 'paid'>('draft');
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageError, setPageError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedLedger, setSelectedLedger] = useState<PayrollLedger | null>(null);
  const [paymentRef, setPaymentRef] = useState("");

  // Load infinite stores for dropdown
  const {
    items: infiniteStores,
    isLoading: isLoadingInfiniteStores,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteStores();

  const storeOptions = [
    { id: "all", name: "Store Hub: All" },
    ...infiniteStores
  ];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pre-select store if user is store manager
  useEffect(() => {
    if (isStoreManager && user?.storeId) {
      setSelectedStoreId(user.storeId);
    }
  }, [user, isStoreManager]);

  // Reset page on tab or store change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, selectedStoreId]);

  // Load Ledgers query
  const { ledgers, pagination, isLoading, refetch } = usePayrollLedgers({
    storeId: selectedStoreId === "all" ? undefined : selectedStoreId,
    status: statusTab,
    page: currentPage,
    limit: 10,
    search: debouncedSearch, // backend-driven search filter
  });

  const { updateLedger, isUpdatingLedger } = usePayrollMutations();

  // Local list search filtering is now done on the backend.
  const filteredLedgers = ledgers;

  const handleUpdateStatus = async (ledgerId: string, status: 'approved' | 'hold' | 'paid' | 'draft', reference?: string) => {
    if (!isSuperAdmin) return;
    try {
      setPageError(null);
      await updateLedger({
        id: ledgerId,
        data: {
          status,
          paymentReference: reference || null
        }
      });
      setSelectedLedger(null);
      setPaymentRef("");
      refetch();
    } catch (err: any) {
      console.error(err);
      setPageError(err.message || "Failed to update ledger status.");
    }
  };

  const handleExportCSV = () => {
    const url = getExportPayrollLedgersUrl({
      storeId: selectedStoreId === "all" ? undefined : selectedStoreId,
    });
    window.open(url, "_blank");
  };

  const tabs: { key: typeof statusTab; label: string; countColor: string }[] = [
    { key: "draft", label: "Drafts", countColor: "bg-neutral-100 text-neutral-700" },
    { key: "approved", label: "Approved", countColor: "bg-blue-100 text-blue-700" },
    { key: "hold", label: "On Hold", countColor: "bg-amber-100 text-amber-700" },
    { key: "paid", label: "Settled", countColor: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Title section */}
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Payout Ledger</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Audit, approve, and track payouts for delivery partners.</p>
        </div>
        {statusTab === "approved" && (
          <button 
            onClick={handleExportCSV}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all cursor-pointer"
          >
            <Download size={16} />
            <span>Export Approved CSV</span>
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

      {/* Filters & Tabs container */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {/* Top filter bar */}
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-neutral-50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by driver name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all"
              />
            </div>
            
            {/* Store dropdown */}
            {!isStoreManager ? (
              <div className="w-full max-w-[200px] select-none">
                <InfiniteSelect
                  value={selectedStoreId}
                  onChange={setSelectedStoreId}
                  placeholder="Select Hub Point"
                  items={storeOptions}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={!!hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  isLoading={isLoadingInfiniteStores}
                />
              </div>
            ) : (
              <div className="px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-neutral-100 text-neutral-400 font-semibold cursor-not-allowed select-none">
                Store Hub: {ledgers[0]?.storeName || "Assigned Hub"}
              </div>
            )}
          </div>

          <span className="text-[12px] font-semibold text-neutral-500 self-center">
            {pagination?.totalItems ?? 0} ledgers matched
          </span>
        </div>

        {/* Tab row */}
        <div className="flex border-b border-neutral-200 px-4 bg-white overflow-x-auto gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`py-3.5 px-3 border-b-2 text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusTab === tab.key
                  ? "border-primary-600 text-primary-600 font-extrabold"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary-600" size={32} />
              <span className="text-[13px] text-neutral-500 font-semibold">Loading ledger records...</span>
            </div>
          ) : filteredLedgers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                <HelpCircle size={24} />
              </div>
              <h3 className="font-bold text-[15px] text-neutral-800">No ledgers found</h3>
              <p className="text-[12px] text-neutral-400 max-w-sm mt-1 mx-auto">
                No payroll items are currently in {statusTab} status for the selected store filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-[13px] text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200 select-none">
                  <th className="p-4">Driver Details</th>
                  <th className="p-4">Hub Point</th>
                  <th className="p-4">Billing Range</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4 text-center">Distance</th>
                  <th className="p-4 text-right">Net Salary</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredLedgers.map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-semibold text-neutral-800">
                      <div className="flex flex-col">
                        <span>{ledger.driverName || "Unknown Driver"}</span>
                        <span className="text-[11px] text-neutral-400 mt-0.5">{ledger.driverPhone || "No Phone"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-600">{ledger.storeName || "Global Store"}</td>
                    <td className="p-4 font-medium text-neutral-500">
                      {ledger.startDate} to {ledger.endDate}
                    </td>
                    <td className="p-4 text-center font-bold text-neutral-700">{ledger.totalDeliveries}</td>
                    <td className="p-4 text-center font-medium text-neutral-600">
                      {(ledger.totalDistanceMeters / 1000).toFixed(2)} km
                    </td>
                    <td className="p-4 text-right font-extrabold text-neutral-900">
                      ₹{(ledger.netPayout / 100).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedLedger(ledger)}
                          className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {isSuperAdmin && statusTab === "draft" && (
                          <button
                            onClick={() => handleUpdateStatus(ledger.id, "approved")}
                            className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                            title="Approve Ledger"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        
                        {isSuperAdmin && statusTab === "draft" && (
                          <button
                            onClick={() => handleUpdateStatus(ledger.id, "hold")}
                            className="p-1.5 hover:bg-amber-50 rounded text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                            title="Hold Payout"
                          >
                            <ShieldAlert size={16} />
                          </button>
                        )}

                        {isSuperAdmin && statusTab === "hold" && (
                          <button
                            onClick={() => handleUpdateStatus(ledger.id, "draft")}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer"
                            title="Release Hold to Draft"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <PaginationFooter
            currentPage={currentPage}
            limit={pagination.limit}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Drill-down Detail Modal */}
      {selectedLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-[16px] text-neutral-800">
                  Salary Breakdown
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Driver: {selectedLedger.driverName} ({selectedLedger.driverPhone})
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedLedger(null);
                  setPaymentRef("");
                }}
                className="p-1 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {/* Hub and Dates */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 rounded-lg p-4 border border-neutral-150">
                <div className="flex items-center gap-2.5">
                  <Building size={16} className="text-neutral-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Store hub</span>
                    <span className="text-[13px] font-bold text-neutral-700">{selectedLedger.storeName || "Global"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-neutral-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Billing Period</span>
                    <span className="text-[12px] font-medium text-neutral-700">{selectedLedger.startDate} to {selectedLedger.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Ledger Items */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[12px] font-extrabold text-neutral-400 uppercase tracking-wider select-none">Earnings Breakdown</h4>
                
                {/* 1. Base Pay */}
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <IndianRupee size={14} className="text-neutral-400" />
                    <span>Base Delivery Commission ({selectedLedger.totalDeliveries} orders)</span>
                  </div>
                  <span className="font-extrabold text-neutral-800">₹{(selectedLedger.baseOrderEarnings / 100).toFixed(2)}</span>
                </div>

                {/* 2. Distance Pay */}
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Coins size={14} className="text-neutral-400" />
                    <span>Distance Coverage ({(selectedLedger.totalDistanceMeters / 1000).toFixed(2)} km)</span>
                  </div>
                  <span className="font-extrabold text-neutral-800">₹{(selectedLedger.distanceEarnings / 100).toFixed(2)}</span>
                </div>

                {/* 3. Bonuses */}
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Sparkles size={14} className="text-emerald-500" />
                    <span>Surge & Night Bonuses</span>
                  </div>
                  <span className="font-extrabold text-emerald-600">₹{(selectedLedger.bonusEarnings / 100).toFixed(2)}</span>
                </div>

                {/* 4. Penalties */}
                <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <ShieldAlert size={14} className="text-amber-500" />
                    <span>SLA Penalties & Deductions</span>
                  </div>
                  <span className="font-extrabold text-amber-600">-₹{(selectedLedger.penaltyDeductions / 100).toFixed(2)}</span>
                </div>

                {/* Net Payout */}
                <div className="flex justify-between items-center py-3 bg-neutral-50 rounded px-3 border border-neutral-150 mt-2">
                  <span className="text-[14px] font-bold text-neutral-800">Net Calculated Salary</span>
                  <span className="text-[18px] font-extrabold text-primary-600">₹{(selectedLedger.netPayout / 100).toLocaleString()}</span>
                </div>
              </div>

              {/* Settlement Reference Form (only for approved -> settling status) */}
              {isSuperAdmin && selectedLedger.status === "approved" && (
                <div className="flex flex-col gap-2.5 p-4 border border-emerald-100 bg-emerald-50/50 rounded-lg">
                  <h5 className="text-[12px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    Settle Driver Payment
                  </h5>
                  <p className="text-[11px] text-neutral-500">
                    Provide a transaction clearing reference (bank transaction number, check #, or stripe token) to record payment completion.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="e.g. TXN987219082"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-emerald-600 transition-all font-medium"
                    />
                    <button
                      onClick={() => handleUpdateStatus(selectedLedger.id, "paid", paymentRef)}
                      disabled={!paymentRef || isUpdatingLedger}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-[12px] px-4 py-2 rounded-md transition-all cursor-pointer"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              )}

              {/* Show Settlement Reference once settled */}
              {selectedLedger.status === "paid" && (
                <div className="p-3 border border-neutral-200 bg-neutral-50 rounded-lg text-[12px] flex justify-between">
                  <span className="font-bold text-neutral-500">Payment Reference:</span>
                  <span className="font-extrabold text-neutral-700 font-mono">{selectedLedger.paymentReference || "N/A"}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3">
              {isSuperAdmin && selectedLedger.status === "draft" && (
                <button
                  onClick={() => handleUpdateStatus(selectedLedger.id, "approved")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] px-4 py-2 rounded-md transition-all cursor-pointer"
                >
                  Approve Payout
                </button>
              )}
              {isSuperAdmin && selectedLedger.status === "draft" && (
                <button
                  onClick={() => handleUpdateStatus(selectedLedger.id, "hold")}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] px-4 py-2 rounded-md transition-all cursor-pointer"
                >
                  Place On Hold
                </button>
              )}
              {isSuperAdmin && selectedLedger.status === "hold" && (
                <button
                  onClick={() => handleUpdateStatus(selectedLedger.id, "draft")}
                  className="bg-neutral-600 hover:bg-neutral-700 text-white font-bold text-[13px] px-4 py-2 rounded-md transition-all cursor-pointer"
                >
                  Release Hold
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedLedger(null);
                  setPaymentRef("");
                }}
                className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-[13px] px-4 py-2 rounded-md transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
