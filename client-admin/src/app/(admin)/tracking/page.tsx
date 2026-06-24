"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Search, 
  Battery, 
  Info,
  Wifi,
  WifiOff,
  AlertTriangle,
  MapPin
} from "lucide-react";

// Dynamically load the Leaflet tracking map with SSR disabled to prevent window object errors
const TrackingMap = dynamic(
  () => import("./TrackingMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-neutral-100 flex flex-col items-center justify-center gap-2">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-neutral-500 font-semibold text-[14px]">Loading interactive map modules...</span>
      </div>
    )
  }
);

interface DriverLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  battery: number;
  speed: string;
  activeOrder: string;
}

export default function TrackingPage() {
  const [activeTracking, setActiveTracking] = useState<DriverLocation[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isLoading, setIsLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const isFirstMount = useRef(true);
  const searchQueryRef = useRef(searchQuery);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const WS_URL = API_URL.replace(/^http/, "ws") + "/locations/ws";

  // Keep search query ref updated
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // 1. Fetch initially online drivers on mount or search query change
  const fetchInitialFleet = async (isInitial = false, searchVal = searchQueryRef.current) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      }
      const res = await fetch(
        `${API_URL}/locations/live?page=1&limit=10&search=${encodeURIComponent(searchVal)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch active fleet");
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data as DriverLocation[];
        setActiveTracking(data);
        setPage(1);
        setHasMore(result.pagination ? result.pagination.page < result.pagination.pages : false);

      }
    } catch (err) {
      console.error("Failed to load online drivers:", err);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  };

  // 1b. Fetch next page for infinite scroll
  const fetchNextPage = async () => {
    if (!hasMore || isFetchingNextPage || isLoading) return;
    
    try {
      setIsFetchingNextPage(true);
      const nextPage = page + 1;
      const res = await fetch(
        `${API_URL}/locations/live?page=${nextPage}&limit=10&search=${encodeURIComponent(searchQueryRef.current)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch next page");
      const result = await res.json();
      if (result.success && result.data) {
        const newData = result.data as DriverLocation[];
        setActiveTracking((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const uniqueNewData = newData.filter((d) => !existingIds.has(d.id));
          return [...prev, ...uniqueNewData];
        });
        setPage(nextPage);
        setHasMore(result.pagination ? result.pagination.page < result.pagination.pages : false);
      }
    } catch (err) {
      console.error("Failed to load next page of online drivers:", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  };

  // 1c. Scroll handler to detect bottom reach
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
      fetchNextPage();
    }
  };

  // 2. Establish WebSocket stream and handle status change / telemetry messages
  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus("connecting");
      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("[WebSocket] Connected to telemetry broadcast server");
        setConnectionStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "status_change") {
            console.log(`[WebSocket] Status change event: driver ${message.id} is now ${message.status}`);
            if (message.status === "offline") {
              setSelectedDriverId((prevSelected) => (prevSelected === message.id ? undefined : prevSelected));
            }
            fetchInitialFleet(false, searchQueryRef.current);
          } else if (message.type === "telemetry") {
            setActiveTracking((prev) => {
              const index = prev.findIndex((d) => d.id === message.id);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = {
                  id: message.id,
                  name: message.name,
                  lat: message.lat,
                  lng: message.lng,
                  status: message.status,
                  battery: message.battery,
                  speed: message.speed,
                  activeOrder: message.activeOrder || "None",
                };
                return updated;
              } else {
                return prev;
              }
            });
          }
        } catch (err) {
          console.error("[WebSocket] Failed to parse message:", err);
        }
      };

      socket.onclose = () => {
        console.log("[WebSocket] Connection closed. Retrying in 3s...");
        setConnectionStatus("disconnected");
        setTimeout(() => {
          if (wsRef.current === socket) {
            connectWebSocket();
          }
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error("[WebSocket] Stream error:", err);
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // 3. Send subscription message when selected driver changes
  useEffect(() => {
    if (connectionStatus === "connected" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (selectedDriverId) {
        wsRef.current.send(JSON.stringify({ action: "subscribe", driverId: selectedDriverId }));
        console.log(`[WebSocket] Sent subscription for driver: ${selectedDriverId}`);
      } else {
        wsRef.current.send(JSON.stringify({ action: "unsubscribe" }));
        console.log(`[WebSocket] Sent unsubscribe`);
      }
    }
  }, [selectedDriverId, connectionStatus]);

  // 4. Handle debounced search input changes and initial load
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchInitialFleet(true, "");
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchInitialFleet(false, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectedDriver = activeTracking.find((d) => d.id === selectedDriverId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 -m-4 bg-neutral-50">
      {/* Submodule title bar */}
      <div className="flex justify-between items-center bg-white border-b border-neutral-200 px-6 py-2.5 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary-600 animate-pulse" />
          <h1 className="text-[14px] font-bold text-neutral-800 tracking-tight">Live Telemetry Tracking</h1>
        </div>
      </div>

      <div className="flex flex-1 gap-6 px-4 pb-4 overflow-hidden">
          {/* Left List Pane */}
          <div className="w-80 border border-neutral-200 rounded-lg bg-white flex flex-col justify-between shadow-sm overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-neutral-800 text-[14px]">Active Tracking Fleet</h2>
                  {/* Connection Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {connectionStatus === "connected" && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        <Wifi size={10} className="animate-pulse" /> Live
                      </span>
                    )}
                    {connectionStatus === "connecting" && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                        <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping"></span> Syncing
                      </span>
                    )}
                    {connectionStatus === "disconnected" && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                        <WifiOff size={10} /> Offline
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-2.5 text-neutral-400" size={14} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search active drivers..."
                    className="w-full pl-9 pr-4 py-1.5 border border-neutral-200 rounded-md text-[12px] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                  />
                </div>
              </div>
              
              <div 
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto divide-y divide-neutral-200"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 gap-2 text-neutral-400 text-[13px]">
                    <svg className="animate-spin h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading active fleet...</span>
                  </div>
                ) : activeTracking.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 gap-2">
                    <AlertTriangle size={24} className="text-neutral-300" />
                    <span className="text-[13px] font-medium">No active drivers online</span>
                    <p className="text-[11px] text-neutral-400 max-w-[200px]">
                      Once drivers start their shifts in the app, their real-time telemetry will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {activeTracking.map((driver) => (
                      <div 
                        key={driver.id} 
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`p-4 hover:bg-neutral-50 cursor-pointer transition-all flex flex-col gap-2 ${
                          selectedDriverId === driver.id ? "bg-primary-50/50 hover:bg-primary-50/70 border-l-4 border-primary-600" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-neutral-800 text-[13px]">{driver.name}</span>
                          <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                            {driver.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Battery size={12} className="text-neutral-400" /> {driver.battery}%
                          </span>
                          <span>Speed: <strong>{driver.speed}</strong></span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Active Order: <span className="font-semibold text-neutral-600">{driver.activeOrder}</span>
                        </div>
                      </div>
                    ))}
                    {isFetchingNextPage && (
                      <div className="flex justify-center items-center p-4 gap-2 text-neutral-500 text-[12px] bg-neutral-50/50">
                        <svg className="animate-spin h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Loading more drivers...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex gap-2 items-center text-[12px] text-neutral-500">
              <Info size={14} className="text-neutral-400" />
              <span>Telemetry updates every 10s</span>
            </div>
          </div>

          {/* Right Map Canvas Panel */}
          <div className="flex-1 relative overflow-hidden bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm">
            {/* Dynamic Leaflet Map Component */}
            <TrackingMap 
              drivers={activeTracking} 
              selectedDriverId={selectedDriverId}
              onSelectDriver={(id) => setSelectedDriverId(id)}
            />

            {/* Detail Overlay Card (shows up when a driver is selected) */}
            {selectedDriver && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-neutral-200 rounded-md p-4 shadow-card w-80 z-[1000] flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-bold text-neutral-800 text-[15px]">{selectedDriver.name}</span>
                    <span className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Telemetry: Active
                    </span>
                  </div>
                  <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                    {selectedDriver.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[12px] border-t border-b border-neutral-100 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-neutral-400">Position</span>
                    <span className="font-semibold text-neutral-700 mt-0.5 font-mono">
                      {selectedDriver.lat.toFixed(5)}, {selectedDriver.lng.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neutral-400">Velocity</span>
                    <span className="font-semibold text-neutral-700 mt-0.5">{selectedDriver.speed}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-neutral-500">
                    Active Order: <strong className="text-primary-600">{selectedDriver.activeOrder}</strong>
                  </span>
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Battery size={13} className="text-neutral-500" /> {selectedDriver.battery}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
