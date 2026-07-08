"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Calendar, 
  Store as StoreIcon, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Truck,
  MapPin,
  ClipboardCheck
} from "lucide-react";
import { useStores } from "@/features/stores/hooks/useStores";
import { usePayrollLedgers, usePayrollMutations } from "@/features/payroll/hooks/usePayroll";
import { useAuthStore } from "@/features/auth/store";
import Link from "next/link";

export default function PayrollConsolePage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";
  const isStoreManager = user?.role === "store_manager";

  // Form State
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // UI Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load stores to populate dropdown
  const { stores, isLoading: isLoadingStores } = useStores({ limit: 100 });

  // Get mutations
  const { generatePayroll, isGeneratingPayroll } = usePayrollMutations();

  // Load recent ledgers for overview stats
  const { ledgers, isLoading: isLoadingLedgers } = usePayrollLedgers({
    page: 1,
    limit: 100,
    status: 'draft',
  });

  // Set default dates to current week (Monday to Sunday)
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monday = new Date(today.setDate(diffToMonday));
    const sunday = new Date(today.setDate(diffToMonday + 6));
    
    setStartDate(monday.toISOString().split("T")[0]);
    setEndDate(sunday.toISOString().split("T")[0]);
  }, []);

  // Pre-select store if user is store manager
  useEffect(() => {
    if (isStoreManager && user?.storeId) {
      setSelectedStoreId(user.storeId);
    } else if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, user, isStoreManager]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedStoreId) {
      setErrorMsg("Please select a store hub.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("Start date cannot be after end date.");
      return;
    }

    try {
      const res = await generatePayroll({
        storeId: selectedStoreId,
        startDate,
        endDate
      });
      setSuccessMsg(res.message || `Successfully generated payroll ledgers for ${res.data.generatedCount} drivers.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate payroll. Ensure there are delivered orders in this date range.");
    }
  };

  // Calculate overview metrics from loaded draft ledgers
  const totalDraftPayout = ledgers.reduce((acc, curr) => acc + curr.netPayout, 0);
  const totalDraftDeliveries = ledgers.reduce((acc, curr) => acc + curr.totalDeliveries, 0);
  const totalDraftDistance = ledgers.reduce((acc, curr) => acc + curr.totalDistanceMeters, 0) / 1000;
  const uniqueDriversCount = new Set(ledgers.map(l => l.driverId)).size;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight flex items-center gap-3">
            <DollarSign className="text-primary-600 bg-primary-50 p-1.5 rounded-lg w-10 h-10" />
            Payroll & Settlement Console
          </h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">
            Generate and audit driver payroll batches based on completed deliveries and location telemetry.
          </p>
        </div>
        <Link 
          href="/payroll/payouts"
          className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-sm transition-all"
        >
          <span>View All Ledgers</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Generation Form Card */}
        <div className="md:col-span-1 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 h-fit">
          <div>
            <h2 className="text-[16px] font-bold text-neutral-800 flex items-center gap-2">
              <Sparkles className="text-primary-600" size={18} />
              Run Payroll Engine
            </h2>
            <p className="text-[12px] text-neutral-500 mt-1">
              Select a store and period to calculate payouts. Existing drafts for the same range will be regenerated.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            {/* Store Hub Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-neutral-700 flex items-center gap-1.5">
                <StoreIcon size={14} className="text-neutral-400" />
                Store Hub
              </label>
              {isLoadingStores ? (
                <div className="h-10 bg-neutral-50 border border-neutral-200 rounded-md animate-pulse flex items-center px-3">
                  <Loader2 className="animate-spin text-neutral-400 mr-2" size={14} />
                  <span className="text-[12px] text-neutral-400">Loading stores...</span>
                </div>
              ) : (
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  disabled={isStoreManager}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-medium text-neutral-800 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a Store Hub</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Range Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-neutral-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-neutral-400" />
                Billing Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-medium text-neutral-800"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-neutral-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-neutral-400" />
                Billing End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-medium text-neutral-800"
              />
            </div>

            {/* Error or Success Alerts */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start gap-2.5 text-[12px] font-medium leading-relaxed">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-start gap-2.5 text-[12px] font-medium leading-relaxed">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Run Button */}
            <button
              type="submit"
              disabled={isGeneratingPayroll}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold text-[14px] py-3 rounded-lg flex items-center justify-center gap-2 shadow-button-primary transition-all cursor-pointer"
            >
              {isGeneratingPayroll ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Computing Salaries...</span>
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  <span>Generate Store Payroll</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Overview Stats & Navigation Shortcut */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-primary-600">
                <TrendingUp size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Unapproved Payouts</span>
                <span className="text-[20px] font-extrabold text-neutral-800 mt-0.5">
                  {isLoadingLedgers ? "..." : `₹${(totalDraftPayout / 100).toLocaleString()}`}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Draft Ledgers Ledger</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-emerald-600">
                <Truck size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Drivers Accounted</span>
                <span className="text-[20px] font-extrabold text-neutral-800 mt-0.5">
                  {isLoadingLedgers ? "..." : uniqueDriversCount}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Active field personnel</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-blue-600">
                <ClipboardCheck size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Deliveries</span>
                <span className="text-[20px] font-extrabold text-neutral-800 mt-0.5">
                  {isLoadingLedgers ? "..." : totalDraftDeliveries}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Completed orders billed</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg text-amber-600">
                <MapPin size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Distance Covered</span>
                <span className="text-[20px] font-extrabold text-neutral-800 mt-0.5">
                  {isLoadingLedgers ? "..." : `${totalDraftDistance.toFixed(1)} km`}
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Telemetry-measured distance</span>
              </div>
            </div>
          </div>

          {/* Quick Info & Action Center */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-white/80 text-[11px] font-bold uppercase tracking-wider">Settlement & Audit Flow</span>
              <h3 className="text-[18px] font-bold">Verify payouts and export CSV</h3>
              <p className="text-white/70 text-[13px] leading-relaxed">
                Review driver details, view order-by-order drill-down logs, freeze payouts on hold for audits, and batch export statements for bank settlement processing.
              </p>
            </div>
            <Link
              href="/payroll/payouts"
              className="bg-white hover:bg-neutral-50 text-primary-700 font-bold text-[13px] px-5 py-3 rounded-lg shadow-md shrink-0 flex items-center gap-1.5 transition-all self-stretch sm:self-auto justify-center"
            >
              <span>Go to Ledger</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
