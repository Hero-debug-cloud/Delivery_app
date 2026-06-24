"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  Search, 
  Calendar, 
  Play, 
  Pause, 
  RotateCcw,
  Battery, 
  Gauge, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  History
} from "lucide-react";
import type { ReplayMapRef } from "./ReplayMap";

// Load ReplayMap dynamically with SSR disabled to prevent Leaflet window reference errors
const ReplayMap = dynamic(
  () => import("./ReplayMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-neutral-100 flex flex-col items-center justify-center gap-2">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-neutral-500 font-semibold text-[14px]">Loading replay map canvas...</span>
      </div>
    )
  }
);

interface DriverSessionSummary {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
}

export default function ReplayPage() {
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drivers, setDrivers] = useState<DriverSessionSummary[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  
  // Navigation pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingPings, setIsLoadingPings] = useState(false);

  // Playback control states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(25); // default 25x speed
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Refs for optimized direct DOM updates (bypassing React re-renders for smooth 60fps)
  const mapRef = useRef<ReplayMapRef | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const speedTextRef = useRef<HTMLSpanElement | null>(null);
  const batteryTextRef = useRef<HTMLSpanElement | null>(null);
  const timeTextRef = useRef<HTMLSpanElement | null>(null);
  const playheadTextRef = useRef<HTMLSpanElement | null>(null);

  // Mutable refs for animation loop
  const pingsRef = useRef<number[][]>([]); // Array of [lat, lng, timestamp, speed, battery]
  const playheadRef = useRef<number>(0);   // Current playhead offset (seconds)
  const isPlayingRef = useRef<boolean>(false);
  const playbackSpeedRef = useRef<number>(25);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Setup default date to today's date in local YYYY-MM-DD
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Sync state variables to refs for loop callback scope resolution
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Adjust replay date by specified number of days (timezone-safe)
  const adjustDate = (days: number) => {
    if (!date) return;
    const parts = date.split("-");
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const current = new Date(year, month, day);
    current.setDate(current.getDate() + days);
    
    const newYear = current.getFullYear();
    const newMonth = String(current.getMonth() + 1).padStart(2, "0");
    const newDay = String(current.getDate()).padStart(2, "0");
    setDate(`${newYear}-${newMonth}-${newDay}`);
  };

  // 1. Fetch drivers for selected date
  const fetchDrivers = async (isInitial = false, searchVal = searchQuery, targetDate = date) => {
    if (!targetDate) return;
    try {
      if (isInitial) {
        setIsLoadingDrivers(true);
      }
      const pageNum = isInitial ? 1 : page + 1;
      const res = await fetch(
        `${API_URL}/locations/replay/drivers?date=${targetDate}&page=${pageNum}&limit=10&search=${encodeURIComponent(searchVal)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch drivers list");
      const result = await res.json();
      if (result.success && result.data) {
        if (isInitial) {
          setDrivers(result.data);
          setPage(1);
        } else {
          setDrivers(prev => {
            const existingIds = new Set(prev.map(d => d.id));
            const unique = result.data.filter((d: any) => !existingIds.has(d.id));
            return [...prev, ...unique];
          });
          setPage(pageNum);
        }
        setHasMore(result.pagination.page < result.pagination.pages);
      }
    } catch (err) {
      console.error("Failed to load replay active drivers:", err);
    } finally {
      setIsLoadingDrivers(false);
      setIsFetchingNextPage(false);
    }
  };

  // Scroll handler to load next page (Infinite Scroll)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
      if (hasMore && !isFetchingNextPage) {
        setIsFetchingNextPage(true);
        fetchDrivers(false);
      }
    }
  };

  // Reload driver list whenever date or search query changes
  useEffect(() => {
    if (!date) return;
    const delayDebounceFn = setTimeout(() => {
      fetchDrivers(true);
      // Reset selected driver when filtering
      setSelectedDriverId(null);
      pingsRef.current = [];
      setDurationSeconds(0);
      playheadRef.current = 0;
      setIsPlaying(false);
      if (mapRef.current) {
        mapRef.current.clearRoute();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [date, searchQuery]);

  // 2. Fetch coordinate pings path for selected driver
  const fetchRoutePings = async (driverId: string) => {
    try {
      setIsLoadingPings(true);
      setIsPlaying(false);
      playheadRef.current = 0;

      const res = await fetch(
        `${API_URL}/locations/replay/pings?driverId=${driverId}&date=${date}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load historical coordinates");
      const result = await res.json();

      if (result.success && result.pings) {
        const route = result.pings as number[][];
        pingsRef.current = route;
        
        if (route.length > 0) {
          const startTimestamp = route[0][2];
          const endTimestamp = route[route.length - 1][2];
          const duration = endTimestamp - startTimestamp;
          
          setDurationSeconds(duration);
          
          // Draw full polyline and pins on map
          if (mapRef.current) {
            mapRef.current.drawRoute(route);
          }
          
          // Render initial starting coordinate state
          updatePlayheadMetrics(0);
        } else {
          setDurationSeconds(0);
          if (mapRef.current) {
            mapRef.current.clearRoute();
          }
        }
      }
    } catch (err) {
      console.error("Failed to load route pings:", err);
    } finally {
      setIsLoadingPings(false);
    }
  };

  // Binary search to find bracketing coordinates
  const findBracketingIndices = (targetTime: number): [number, number] => {
    const route = pingsRef.current;
    let low = 0;
    let high = route.length - 1;

    if (targetTime <= route[0][2]) return [0, 0];
    if (targetTime >= route[high][2]) return [high, high];

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = route[mid][2];

      if (midTime === targetTime) {
        return [mid, mid];
      } else if (midTime < targetTime) {
        if (mid + 1 < route.length && route[mid + 1][2] > targetTime) {
          return [mid, mid + 1];
        }
        low = mid + 1;
      } else {
        if (mid - 1 >= 0 && route[mid - 1][2] <= targetTime) {
          return [mid - 1, mid];
        }
        high = mid - 1;
      }
    }
    return [0, 0];
  };

  // Linear interpolation logic to update marker & DOM elements smoothly
  const updatePlayheadMetrics = (offsetSeconds: number) => {
    const route = pingsRef.current;
    if (route.length === 0) return;

    const startTimestamp = route[0][2];
    const targetTime = startTimestamp + offsetSeconds;

    const [idxA, idxB] = findBracketingIndices(targetTime);
    let lat: number, lng: number, speed: number, battery: number;

    if (idxA === idxB) {
      const pt = route[idxA];
      lat = pt[0];
      lng = pt[1];
      speed = pt[3];
      battery = pt[4];
    } else {
      const ptA = route[idxA];
      const ptB = route[idxB];
      const tA = ptA[2];
      const tB = ptB[2];

      const fraction = (targetTime - tA) / (tB - tA);
      lat = ptA[0] + (ptB[0] - ptA[0]) * fraction;
      lng = ptA[1] + (ptB[1] - ptA[1]) * fraction;
      speed = ptA[3] + (ptB[3] - ptA[3]) * fraction;
      battery = ptA[4] + (ptB[4] - ptA[4]) * fraction;
    }

    // 1. Move Leaflet Marker
    if (mapRef.current) {
      mapRef.current.updateMarker(lat, lng);
    }

    // 2. Direct DOM operations (bypasses React virtual DOM for performance)
    if (sliderRef.current) {
      sliderRef.current.value = offsetSeconds.toString();
    }
    if (speedTextRef.current) {
      speedTextRef.current.innerText = `${speed.toFixed(1)} km/h`;
    }
    if (batteryTextRef.current) {
      batteryTextRef.current.innerText = `${Math.round(battery)}%`;
    }
    if (timeTextRef.current) {
      const absDate = new Date(targetTime * 1000);
      timeTextRef.current.innerText = absDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
    if (playheadTextRef.current) {
      playheadTextRef.current.innerText = formatDuration(offsetSeconds);
    }
  };

  // Timeline slider range scrubber handler
  const handleSliderScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    playheadRef.current = val;
    updatePlayheadMetrics(val);
  };

  // requestAnimationFrame Animation Loop
  const animate = (timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    const deltaTimeMs = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    if (isPlayingRef.current && pingsRef.current.length > 0) {
      // Advance playhead: offset in seconds + (delta_time_seconds * speed_factor)
      const nextPlayhead = playheadRef.current + (deltaTimeMs / 1000) * playbackSpeedRef.current;

      if (nextPlayhead >= durationSeconds) {
        playheadRef.current = durationSeconds;
        setIsPlaying(false);
        updatePlayheadMetrics(durationSeconds);
      } else {
        playheadRef.current = nextPlayhead;
        updatePlayheadMetrics(nextPlayhead);
        animationRef.current = requestAnimationFrame(animate);
      }
    } else {
      lastFrameTimeRef.current = 0;
    }
  };

  // Handle Play/Pause toggler changes
  useEffect(() => {
    if (isPlaying) {
      lastFrameTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Reset playback to start
  const handleResetPlayback = () => {
    setIsPlaying(false);
    playheadRef.current = 0;
    updatePlayheadMetrics(0);
  };

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    fetchRoutePings(driverId);
  };

  // Formatting helpers
  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 -m-4 bg-neutral-50">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white border-b border-neutral-200 px-6 py-2.5 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <History size={18} className="text-primary-600" />
          <h1 className="text-[14px] font-bold text-neutral-800 tracking-tight">Historical Route Replay</h1>
        </div>
      </div>

      <div className="flex flex-1 gap-6 px-4 pb-4 overflow-hidden">
        {/* Left Search / Dates Panel */}
        <div className="w-80 border border-neutral-200 rounded-lg bg-white flex flex-col justify-between shadow-sm overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Replay Date</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustDate(-1)}
                    className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors shadow-sm cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-2.5 text-neutral-400" size={14} />
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 border border-neutral-200 rounded-md text-[12px] focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustDate(1)}
                    className="p-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 transition-colors shadow-sm cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="relative">
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
              {isLoadingDrivers ? (
                <div className="flex flex-col items-center justify-center p-8 gap-2 text-neutral-400 text-[13px]">
                  <svg className="animate-spin h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Searching shifts...</span>
                </div>
              ) : drivers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 gap-2">
                  <AlertTriangle size={24} className="text-neutral-300" />
                  <span className="text-[13px] font-semibold">No driver shifts logged</span>
                  <p className="text-[11px] text-neutral-400 max-w-[200px]">
                    No drivers logged online shifts on this date. Try another day.
                  </p>
                </div>
              ) : (
                <>
                  {drivers.map((driver) => (
                    <div 
                      key={driver.id} 
                      onClick={() => handleDriverSelect(driver.id)}
                      className={`p-4 hover:bg-neutral-50 cursor-pointer transition-all flex justify-between items-center ${
                        selectedDriverId === driver.id ? "bg-primary-50/50 hover:bg-primary-50/70 border-l-4 border-primary-600" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="font-bold text-neutral-800 text-[13px] truncate">{driver.name}</span>
                        <span className="text-[10.5px] text-neutral-400 font-mono">
                          {driver.vehicleNumber || "No plate ID"} • {driver.vehicleType}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-neutral-400 shrink-0" />
                    </div>
                  ))}
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center p-4 gap-2 text-neutral-500 text-[12px] bg-neutral-50/50">
                      <svg className="animate-spin h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Loading shifts page...</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex gap-2 items-center text-[12px] text-neutral-500">
            <Info size={14} className="text-neutral-400 shrink-0" />
            <span>Select a driver to load route</span>
          </div>
        </div>

        {/* Right Map Canvas & Replay Controls */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Map Area */}
          <div className="flex-1 relative overflow-hidden bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm">
            <ReplayMap ref={mapRef} autoCenter={true} />
            
            {isLoadingPings && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-[2000] flex flex-col items-center justify-center gap-2">
                <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-neutral-600 font-semibold text-[13px]">Drawing route pings coordinate path...</span>
              </div>
            )}

            {!selectedDriverId && (
              <div className="absolute inset-0 bg-neutral-100/50 backdrop-blur-[1px] z-[1000] flex flex-col items-center justify-center gap-3 text-neutral-400">
                <History size={40} className="text-neutral-300 animate-pulse" />
                <span className="text-[13px] font-semibold">Select a driver from the list to map historical shifts</span>
              </div>
            )}
          </div>

          {/* Replay Controls Panel */}
          <div className={`bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col gap-3 shrink-0 ${
            !selectedDriverId || durationSeconds === 0 ? "opacity-50 pointer-events-none" : ""
          }`}>
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Playback Button Group */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 shadow transition-colors cursor-pointer"
                  title={isPlaying ? "Pause Playback" : "Start Playback"}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleResetPlayback}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm transition-colors cursor-pointer"
                  title="Reset to Start"
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {/* Progress Slider (direct DOM link) */}
              <div className="flex-1 w-full flex items-center gap-3">
                <input
                  type="range"
                  ref={sliderRef}
                  min={0}
                  max={durationSeconds}
                  defaultValue={0}
                  onChange={handleSliderScrub}
                  className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600 focus:outline-none"
                />
                
                {/* Timer text labels */}
                <div className="text-[12px] font-semibold text-neutral-600 font-mono whitespace-nowrap">
                  <span ref={playheadTextRef}>0m 0s</span> / {formatDuration(durationSeconds)}
                </div>
              </div>

              {/* Playback Speed Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Speed:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseInt(e.target.value, 10))}
                  className="border border-neutral-200 rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-700 bg-white focus:outline-none focus:border-primary-600 cursor-pointer"
                >
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                  <option value={10}>10x</option>
                  <option value={25}>25x</option>
                  <option value={50}>50x</option>
                  <option value={100}>100x</option>
                  <option value={200}>200x</option>
                  <option value={300}>300x</option>
                </select>
              </div>
            </div>

            {/* Performance metrics dashboard row (direct DOM link) */}
            <div className="flex flex-wrap items-center justify-between border-t border-neutral-100 pt-3 text-[12px] font-medium text-neutral-500">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-neutral-400" />
                  Time: <strong className="text-neutral-700 font-mono" ref={timeTextRef}>--:--:--</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Gauge size={14} className="text-neutral-400" />
                  Speed: <strong className="text-neutral-700" ref={speedTextRef}>0.0 km/h</strong>
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Battery size={14} className="text-neutral-400" />
                Battery: <strong className="text-neutral-700" ref={batteryTextRef}>100%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
