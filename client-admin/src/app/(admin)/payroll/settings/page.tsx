"use client";

import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Settings2, 
  Building, 
  Plus, 
  Sparkles, 
  Check, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  ArrowRight,
  HelpCircle,
  TrendingUp,
  MapPin,
  Save
} from "lucide-react";
import { 
  usePayrollConfigurations, 
  usePayrollMutations,
  usePayrollConfigurationByStore
} from "@/features/payroll/hooks/usePayroll";
import { useAuthStore } from "@/features/auth/store";
import type { PayrollConfiguration } from "@/features/payroll/types";
import { InfiniteSelect } from "@/components/shared/InfiniteSelect";
import { useInfiniteStores } from "@/features/products/hooks/useProducts";

export default function PayrollSettingsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  // UI State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Global Config Form State
  const [globalPerOrder, setGlobalPerOrder] = useState<number>(20);
  const [globalPerKm, setGlobalPerKm] = useState<number>(5);
  const [globalNightSurge, setGlobalNightSurge] = useState<number>(10);
  const [globalWeatherSurge, setGlobalWeatherSurge] = useState<number>(15);
  const [globalLatePenalty, setGlobalLatePenalty] = useState<number>(5);

  // Store Override Form State
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storePerOrder, setStorePerOrder] = useState<number>(20);
  const [storePerKm, setStorePerKm] = useState<number>(5);
  const [storeNightSurge, setStoreNightSurge] = useState<number>(10);
  const [storeWeatherSurge, setStoreWeatherSurge] = useState<number>(15);
  const [storeLatePenalty, setStoreLatePenalty] = useState<number>(5);

  // Local Override pagination state
  const [overridePage, setOverridePage] = useState(1);

  // Search state for overrides list
  const [overrideSearch, setOverrideSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(overrideSearch);
      setOverridePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [overrideSearch]);

  // Load global configurations singleton
  const { 
    configuration: globalConfig, 
    isLoading: isLoadingGlobal, 
    refetch: refetchGlobal 
  } = usePayrollConfigurationByStore("global");

  // Load paginated store overrides from backend
  const OVERRIDES_PER_PAGE = 5;
  const { 
    configurations: storeOverrides, 
    pagination: overridePagination,
    isLoading: isLoadingConfigs, 
    refetch: refetchOverrides 
  } = usePayrollConfigurations({
    page: overridePage,
    limit: OVERRIDES_PER_PAGE,
    search: debouncedSearch,
  });

  const { upsertConfig, isUpsertingConfig, deleteConfig } = usePayrollMutations();

  // Infinite scroll stores for Target Store Hub selection
  const {
    items: infiniteStores,
    isLoading: isLoadingInfiniteStores,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteStores();

  // Populate Global Form from loaded global config
  useEffect(() => {
    if (globalConfig) {
      setGlobalPerOrder(globalConfig.perOrderRate / 100);
      setGlobalPerKm(globalConfig.perKmRate / 100);
      setGlobalNightSurge(globalConfig.nightSurgeRate / 100);
      setGlobalWeatherSurge(globalConfig.weatherSurgeRate / 100);
      setGlobalLatePenalty(globalConfig.latePenalty / 100);
    }
  }, [globalConfig]);

  const totalOverridePages = overridePagination?.totalPages ?? 1;

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await upsertConfig({
        storeId: null, // Global
        perOrderRate: Math.round(globalPerOrder * 100),
        perKmRate: Math.round(globalPerKm * 100),
        nightSurgeRate: Math.round(globalNightSurge * 100),
        weatherSurgeRate: Math.round(globalWeatherSurge * 100),
        latePenalty: Math.round(globalLatePenalty * 100),
      });
      setSuccessMsg("Global default payroll parameters saved successfully.");
      refetchGlobal();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update global configurations.");
    }
  };

  const handleSaveStoreOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedStoreId) {
      setErrorMsg("Please select a store to apply the override.");
      return;
    }

    try {
      await upsertConfig({
        storeId: selectedStoreId,
        perOrderRate: Math.round(storePerOrder * 100),
        perKmRate: Math.round(storePerKm * 100),
        nightSurgeRate: Math.round(storeNightSurge * 100),
        weatherSurgeRate: Math.round(storeWeatherSurge * 100),
        latePenalty: Math.round(storeLatePenalty * 100),
      });
      setSuccessMsg(`Store-specific overrides applied successfully.`);
      setSelectedStoreId("");
      refetchOverrides();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save store override configurations.");
    }
  };

  const handleEditOverride = (config: PayrollConfiguration) => {
    if (config.storeId) {
      setSelectedStoreId(config.storeId);
      setStorePerOrder(config.perOrderRate / 100);
      setStorePerKm(config.perKmRate / 100);
      setStoreNightSurge(config.nightSurgeRate / 100);
      setStoreWeatherSurge(config.weatherSurgeRate / 100);
      setStoreLatePenalty(config.latePenalty / 100);
    }
  };

  const handleDeleteOverride = async (configId: string) => {
    if (!isSuperAdmin) return;
    if (!window.confirm("Are you sure you want to delete this store override? This store will revert to global default rates.")) return;
    try {
      setSuccessMsg(null);
      setErrorMsg(null);
      await deleteConfig(configId);
      setSuccessMsg("Store override deleted successfully. Store has reverted to global defaults.");
      refetchOverrides();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delete store override.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Payroll Settings</h1>
        <p className="text-caption-14-regular text-neutral-500 mt-1">Configure compensation rates, telemetric per-km multipliers, and surge policies.</p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-3 text-[13px] font-semibold animate-fade-in">
          <Check className="text-emerald-600 shrink-0" size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-center gap-3 text-[13px] font-semibold animate-fade-in">
          <AlertCircle className="text-red-600 shrink-0" size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoadingConfigs || isLoadingGlobal ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-primary-600" size={32} />
          <span className="text-[13px] text-neutral-500 font-semibold">Loading configurations canvas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Global Config form */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-[16px] font-bold text-neutral-800 flex items-center gap-2">
                <Settings2 className="text-primary-600" size={18} />
                Global Parameters (Fallback)
              </h2>
              <p className="text-[12px] text-neutral-500 mt-1">
                These rates are automatically applied to any order whose dispatch store does not have an active override.
              </p>
            </div>

            <form onSubmit={handleSaveGlobal} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-700">Base Commission (per order)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={globalPerOrder}
                      onChange={(e) => setGlobalPerOrder(parseFloat(e.target.value) || 0)}
                      disabled={!isSuperAdmin}
                      className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-700">Mileage Pay (per km)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={globalPerKm}
                      onChange={(e) => setGlobalPerKm(parseFloat(e.target.value) || 0)}
                      disabled={!isSuperAdmin}
                      className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-700">Night Surge (10 PM - 6 AM)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={globalNightSurge}
                      onChange={(e) => setGlobalNightSurge(parseFloat(e.target.value) || 0)}
                      disabled={!isSuperAdmin}
                      className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-700">Weather Surge (flat rate)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={globalWeatherSurge}
                      onChange={(e) => setGlobalWeatherSurge(parseFloat(e.target.value) || 0)}
                      disabled={!isSuperAdmin}
                      className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-neutral-700">Late Penalty (delivery &gt;30 mins)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={globalLatePenalty}
                    onChange={(e) => setGlobalLatePenalty(parseFloat(e.target.value) || 0)}
                    disabled={!isSuperAdmin}
                    className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-800"
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <button
                  type="submit"
                  disabled={isUpsertingConfig}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold text-[13px] py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all mt-2 cursor-pointer"
                >
                  <Save size={16} />
                  <span>Save Global Defaults</span>
                </button>
              )}
            </form>
          </div>

          {/* Right Column: Store overrides */}
          <div className="flex flex-col gap-6">
            {/* Create Override Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h2 className="text-[16px] font-bold text-neutral-800 flex items-center gap-2">
                  <Building className="text-primary-600" size={18} />
                  Configure Store Overrides
                </h2>
                <p className="text-[12px] text-neutral-500 mt-1">
                  Assign dynamic pricing policies to individual warehouse zones or stores.
                </p>
              </div>

              <form onSubmit={handleSaveStoreOverride} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-700">Target Store Hub</label>
                  <InfiniteSelect
                    value={selectedStoreId}
                    onChange={setSelectedStoreId}
                    placeholder="Select Hub Point"
                    items={infiniteStores}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isLoadingInfiniteStores}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-neutral-700">Base Commission</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={storePerOrder}
                        onChange={(e) => setStorePerOrder(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-805"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-neutral-700">Mileage Pay</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={storePerKm}
                        onChange={(e) => setStorePerKm(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-805"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-neutral-700">Night Surge</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={storeNightSurge}
                        onChange={(e) => setStoreNightSurge(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-805"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-neutral-700">Weather Surge</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={storeWeatherSurge}
                        onChange={(e) => setStoreWeatherSurge(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-805"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-700">Late Penalty</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-neutral-400 text-[13px] font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={storeLatePenalty}
                      onChange={(e) => setStoreLatePenalty(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-805"
                    />
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    type="submit"
                    disabled={isUpsertingConfig}
                    className="bg-neutral-800 hover:bg-neutral-900 disabled:bg-neutral-600 text-white font-bold text-[13px] py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all mt-2 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Apply Store Overrides</span>
                  </button>
                )}
              </form>
            </div>

            {/* List Overrides */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center select-none">
                  <h3 className="font-extrabold text-[14px] text-neutral-800">Active Store-wise Override Policies</h3>
                  {totalOverridePages > 1 && (
                    <span className="text-[11px] font-semibold text-neutral-400">
                      Page {overridePage} of {totalOverridePages}
                    </span>
                  )}
                </div>
                {/* Search Overrides Bar */}
                <input
                  type="text"
                  placeholder="Search overrides by store name..."
                  value={overrideSearch}
                  onChange={(e) => setOverrideSearch(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-lg text-[12px] bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-primary-600 transition-all font-semibold text-neutral-800 placeholder-neutral-400"
                />
              </div>
              {storeOverrides.length === 0 ? (
                <p className="text-[12px] text-neutral-400 py-6 text-center">
                  {overrideSearch ? "No matching override policies found." : "No active overrides. All stores use Global defaults."}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {storeOverrides.map(override => (
                    <div 
                      key={override.id} 
                      className="flex justify-between items-center p-3.5 border border-neutral-150 rounded-lg hover:border-primary-200 hover:bg-neutral-50/50 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-[13px] font-extrabold text-neutral-800">{override.storeName || "Store override"}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500 mt-1 select-none">
                          <span>Base: ₹{override.perOrderRate / 100}</span>
                          <span>Dist: ₹{override.perKmRate / 100}/km</span>
                          <span>Night: ₹{override.nightSurgeRate / 100}</span>
                          <span>Weather: ₹{override.weatherSurgeRate / 100}</span>
                          <span>SLA: -₹{override.latePenalty / 100}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditOverride(override)}
                          className="text-[12px] font-bold text-primary-600 hover:text-primary-800 transition-colors shrink-0 px-2 py-1 hover:bg-neutral-100 rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDeleteOverride(override.id)}
                            className="text-[12px] font-bold text-red-600 hover:text-red-800 transition-colors shrink-0 px-2 py-1 hover:bg-neutral-100 rounded cursor-pointer flex items-center gap-1"
                            title="Delete Override"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Override Pagination controls */}
              {totalOverridePages > 1 && (
                <div className="flex justify-between items-center pt-3 border-t border-neutral-100 select-none">
                  <button
                    onClick={() => setOverridePage(prev => Math.max(prev - 1, 1))}
                    disabled={overridePage === 1}
                    className="text-[12px] font-bold text-neutral-500 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setOverridePage(prev => Math.min(prev + 1, totalOverridePages))}
                    disabled={overridePage === totalOverridePages}
                    className="text-[12px] font-bold text-neutral-500 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
