import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import { X, Sparkles, MapPin, Phone, Store as StoreIcon, Check, Loader2, Navigation } from "lucide-react";
import type { Store } from "../types";

// Dynamically load the Leaflet Map component with SSR disabled
const StoreMap = dynamic(
  () => import("./StoreMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] bg-neutral-100 animate-pulse rounded border border-neutral-200 flex items-center justify-center select-none">
        <span className="text-[12px] text-neutral-400 font-semibold">Loading mapping canvas...</span>
      </div>
    )
  }
);

const storeFormSchema = z.object({
  name: z.string().min(1, "Store name is required").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Please pick a location on the map"),
  latitude: z.number({ invalid_type_error: "Please pick a location on the map" }),
  longitude: z.number({ invalid_type_error: "Please pick a location on the map" }),
  isActive: z.boolean().default(true),
  openingTime: z.string().min(1, "Opening time is required"),
  closingTime: z.string().min(1, "Closing time is required"),
  catchmentPolygon: z.string().optional().nullable(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

interface SearchLocationResult {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StoreFormValues) => Promise<void>;
  store?: Store | null;
  isSaving: boolean;
}

export function StoreModal({ isOpen, onClose, onSave, store, isSaving }: StoreModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Map interactive states
  const [mapSearch, setMapSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      isActive: true,
      openingTime: "10:00",
      closingTime: "19:00",
      catchmentPolygon: null,
    },
  });

  const watchedAddress = watch("address");
  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");
  const watchedIsActive = watch("isActive");

  // Load store details for editing
  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      setMapSearch("");
      setSearchResults([]);
      
      if (store) {
        reset({
          name: store.name,
          phone: store.phone,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          isActive: store.isActive,
          openingTime: store.openingTime || "10:00",
          closingTime: store.closingTime || "19:00",
          catchmentPolygon: store.catchmentPolygon || null,
        });
        
        setTempCoords({
          lat: store.latitude,
          lng: store.longitude,
          address: store.address,
        });
        setIsConfirmed(true);
      } else {
        reset({
          name: "",
          phone: "",
          address: "",
          latitude: undefined,
          longitude: undefined,
          isActive: true,
          openingTime: "10:00",
          closingTime: "19:00",
          catchmentPolygon: null,
        });
        setTempCoords(null);
        setIsConfirmed(false);
      }
    }
  }, [store, reset, isOpen]);

  // Debounced geocoding search querying Nominatim API
  useEffect(() => {
    if (mapSearch.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearch)}&format=json&limit=5`,
          {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "LogiRoute-Admin-Dashboard/1.0",
            },
          }
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        
        const matches = data.map((item: any) => ({
          name: item.name || item.display_name.split(",")[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name,
        }));
        
        setSearchResults(matches);
      } catch (err) {
        console.error("Geocoding search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [mapSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapSearch(e.target.value);
  };

  // Select preset location
  const selectPreset = (loc: SearchLocationResult) => {
    setTempCoords(loc);
    setIsConfirmed(false);
    setSearchResults([]);
    setMapSearch(loc.name);
  };

  // Click on Leaflet Map handler
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setTempCoords({ lat, lng, address });
    setIsConfirmed(false);
  };

  // Geolocation locate current position
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        try {
          // Call Nominatim reverse-geocode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "LogiRoute-Admin-Dashboard/1.0",
              },
            }
          );
          if (!response.ok) throw new Error("Reverse geocoding failed");
          const data = await response.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          
          setTempCoords({ lat, lng, address });
          setIsConfirmed(false);
          setMapSearch("My Location");
        } catch (err) {
          console.error(err);
          // Fallback if reverse geocode fails
          setTempCoords({ 
            lat, 
            lng, 
            address: `Position at (${lat.toFixed(5)}, ${lng.toFixed(5)})` 
          });
          setIsConfirmed(false);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        alert(
          "Unable to retrieve your current location. Please verify your browser's location permission settings."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Lock in location coordinates
  const confirmLocation = () => {
    if (tempCoords) {
      setValue("address", tempCoords.address);
      setValue("latitude", tempCoords.lat);
      setValue("longitude", tempCoords.lng);
      setIsConfirmed(true);
    }
  };

  const onSubmit = async (values: StoreFormValues) => {
    try {
      setSubmitError(null);
      await onSave(values);
      onClose();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Failed to save store. Please check the inputs.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-neutral-200 rounded-md shadow-card w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-[18px] font-bold text-neutral-900">
              {store ? "Edit Logistics Store" : "Create New Logistics Store"}
            </h2>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Set up or modify a dispatch warehouse points for courier allocation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition-all p-1.5 hover:bg-neutral-100 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50/30">
          
          {/* Left Column: Form Fields */}
          <div className="flex flex-col gap-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] font-semibold">
                {submitError}
              </div>
            )}

            {/* Store Identity Card */}
            <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                <StoreIcon size={14} className="text-primary-600" />
                <span>Store Identity</span>
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-neutral-600">Store Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Central Hub"
                  {...register("name")}
                  className={`px-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                    errors.name ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                  }`}
                />
                {errors.name && <span className="text-[11px] font-medium text-red-500">{errors.name.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-neutral-600">Contact Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    {...register("phone")}
                    className={`w-full pl-9 pr-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                      errors.phone ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                    }`}
                  />
                </div>
                {errors.phone && <span className="text-[11px] font-medium text-red-500">{errors.phone.message}</span>}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
              <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-2 mb-3">
                <span>🚦 Store Operations</span>
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-neutral-700">Active Status</span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">Inactive stores do not accept orders or drivers.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={watchedIsActive}
                    onChange={(e) => setValue("isActive", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                <span>🕒 Operating Hours</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-neutral-600">Opening Time *</label>
                  <input
                    type="time"
                    {...register("openingTime")}
                    className={`px-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                      errors.openingTime ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                    }`}
                  />
                  {errors.openingTime && <span className="text-[11px] font-medium text-red-500">{errors.openingTime.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-neutral-600">Closing Time *</label>
                  <input
                    type="time"
                    {...register("closingTime")}
                    className={`px-3 py-2 border rounded-md text-[13px] focus:outline-none transition-all ${
                      errors.closingTime ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-primary-600"
                    }`}
                  />
                  {errors.closingTime && <span className="text-[11px] font-medium text-red-500">{errors.closingTime.message}</span>}
                </div>
              </div>
            </div>

            {/* Confirmed Location Read-Only Display */}
            <div className="bg-white border border-neutral-200 rounded-md p-4 shadow-sm flex flex-col gap-3">
              <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-100 pb-2">
                <MapPin size={14} className="text-primary-600" />
                <span>Confirmed Location</span>
              </h3>
              
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-neutral-500">Address</span>
                <span className="text-[12px] text-neutral-800 font-medium bg-neutral-50 p-2 rounded border border-neutral-100 min-h-[36px] flex items-center">
                  {watchedAddress || "No location selected yet"}
                </span>
                {errors.address && <span className="text-[11px] font-medium text-red-500">{errors.address.message}</span>}
              </div>

              {watchedLat !== undefined && watchedLng !== undefined && (
                <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-neutral-100 pt-2.5">
                  <div className="flex flex-col">
                    <span className="text-neutral-400">Latitude</span>
                    <span className="font-semibold text-neutral-700 font-mono mt-0.5">{watchedLat.toFixed(6)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neutral-400">Longitude</span>
                    <span className="font-semibold text-neutral-700 font-mono mt-0.5">{watchedLng.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Leaflet Map Picker */}
          <div className="flex flex-col gap-3 bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
            <h3 className="text-[13px] font-bold text-neutral-800 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100 pb-2">
              <span>📍 Map Coordinates Picker</span>
              <span className="text-[10px] text-neutral-400 lowercase italic">click map to place pin</span>
            </h3>

            {/* Map Autocomplete Search & Locate Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={mapSearch}
                  onChange={handleSearchChange}
                  placeholder="Search address worldwide..."
                  className="w-full pl-9 pr-8 py-2 border border-neutral-200 rounded-md text-[12px] bg-white focus:outline-none focus:border-primary-600 font-medium text-neutral-800"
                />
                <Sparkles size={14} className="absolute left-3 top-3 text-primary-500" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 animate-spin text-neutral-400" size={14} />
                )}
              </div>
              
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[12px] hover:bg-neutral-50 active:bg-neutral-100 transition-all font-bold text-neutral-600 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                title="Use Current Location"
              >
                {isLocating ? (
                  <Loader2 className="animate-spin text-primary-600" size={14} />
                ) : (
                  <Navigation size={14} className="rotate-45 text-primary-600" />
                )}
                <span>Locate Me</span>
              </button>
            </div>

            {/* Autocomplete Dropdown list */}
            {searchResults.length > 0 && (
              <div className="relative">
                <div className="absolute w-full mt-[-8px] bg-white border border-neutral-200 rounded-md shadow-lg z-20 divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                  {searchResults.map((loc) => (
                    <button
                      key={loc.address}
                      type="button"
                      onClick={() => selectPreset(loc)}
                      className="w-full text-left px-3 py-2 text-[12px] hover:bg-neutral-50 transition-all flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-neutral-800">{loc.name}</span>
                      <span className="text-[10px] text-neutral-400 truncate">{loc.address}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Leaflet Dynamic Client Component */}
            <StoreMap
              latitude={tempCoords?.lat}
              longitude={tempCoords?.lng}
              onLocationSelect={handleLocationSelect}
              isConfirmed={isConfirmed}
              catchmentPolygon={watch("catchmentPolygon")}
              onPolygonChange={(wkt) => setValue("catchmentPolygon", wkt)}
            />

            {/* Confirm Location button row */}
            {tempCoords && (
              <div className="mt-1 flex flex-col gap-2 bg-neutral-50 p-2.5 rounded border border-neutral-100">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[11px] text-neutral-500 font-semibold truncate max-w-[200px]" title={tempCoords.address}>
                    📍 {tempCoords.address}
                  </span>
                  {isConfirmed ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1 select-none shrink-0">
                      <Check size={10} /> Confirmed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={confirmLocation}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-[11px] px-3 py-1.5 rounded transition-all shadow-button-primary shrink-0 cursor-pointer"
                    >
                      Confirm Location
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="col-span-1 md:col-span-2 pt-4 border-t border-neutral-200 flex justify-end gap-3 bg-white mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-[13px] font-semibold transition-all cursor-pointer"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold text-[13px] px-5 py-2 rounded-md shadow-button-primary transition-all min-w-[90px] cursor-pointer"
              disabled={isSaving || (tempCoords !== null && !isConfirmed)}
            >
              {isSaving ? "Saving..." : store ? "Update Store" : "Save Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
