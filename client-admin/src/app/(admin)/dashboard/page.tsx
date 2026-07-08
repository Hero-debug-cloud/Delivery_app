"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  ShoppingBag, 
  UserCheck, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Truck
} from "lucide-react";

// Dynamically load the Leaflet tracking map with SSR disabled to prevent window object errors
const TrackingMap = dynamic(
  () => import("../tracking/TrackingMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-neutral-100 flex flex-col items-center justify-center gap-2">
        <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-neutral-500 font-semibold text-[14px]">Loading interactive fleet map...</span>
      </div>
    )
  }
);

interface DashboardStats {
  activeOrders: number;
  onlineDrivers: {
    active: number;
    busy: number;
    idle: number;
  };
  deliveredToday: number;
  failedToday: number;
}

interface ActiveOrder {
  id: string;
  customerName: string;
  storeName: string;
  driverName: string | null;
  status: string;
  grandTotal: number;
}

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    onlineDrivers: { active: 0, busy: 0, idle: 0 },
    deliveredToday: 0,
    failedToday: 0
  });
  const [activeOrdersList, setActiveOrdersList] = useState<ActiveOrder[]>([]);
  const [fleetLocations, setFleetLocations] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch KPI metrics stats
      const statsRes = await fetch(`${API_URL}/orders/dashboard/stats`, { credentials: "include" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }

      // 2. Fetch active orders in queue (page=1, limit=5, statuses that are not delivered/failed)
      // Since Hono's orders endpoint handles general list querying, we will fetch the first page and filter in-flight ones
      const ordersRes = await fetch(`${API_URL}/orders?page=1&limit=20`, { credentials: "include" });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success && ordersData.data) {
          const inFlight = ordersData.data.filter(
            (o: any) => o.status !== "delivered" && o.status !== "failed"
          ).slice(0, 5);
          setActiveOrdersList(inFlight);
        }
      }

      // 3. Fetch active online driver coordinates for the map
      const fleetRes = await fetch(`${API_URL}/locations/live?page=1&limit=100`, { credentials: "include" });
      if (fleetRes.ok) {
        const fleetData = await fleetRes.json();
        if (fleetData.success && fleetData.data) {
          setFleetLocations(fleetData.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const statsCards = [
    { 
      label: "Active Orders", 
      value: stats.activeOrders.toString(), 
      change: "Currently in progress", 
      icon: <ShoppingBag className="text-primary-600" />, 
      bg: "bg-primary-50" 
    },
    { 
      label: "Online Drivers", 
      value: `${stats.onlineDrivers.idle} / ${stats.onlineDrivers.active}`, 
      change: `${stats.onlineDrivers.busy} busy on jobs`, 
      icon: <UserCheck className="text-emerald-600" />, 
      bg: "bg-emerald-50" 
    },
    { 
      label: "Delivered Today", 
      value: stats.deliveredToday.toString(), 
      change: "Completed since midnight", 
      icon: <CheckCircle2 className="text-cyan-600" />, 
      bg: "bg-cyan-50" 
    },
    { 
      label: "Failed Deliveries", 
      value: stats.failedToday.toString(), 
      change: "Requires attention", 
      icon: <XCircle className="text-red-600" />, 
      bg: "bg-red-50" 
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Real-time status overview of stores, orders, and active delivery partners.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="text-[12px] bg-white border border-neutral-200 hover:bg-neutral-50 px-3.5 py-2 font-semibold text-neutral-700 rounded-md shadow-sm transition-all"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, idx) => (
          <div key={idx} className="p-6 bg-white rounded-md border border-neutral-200 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-neutral-500 uppercase tracking-wide">{stat.label}</span>
              <div className={`p-2.5 rounded-full ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <span className="text-heading-32-bold text-neutral-900">{stat.value}</span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-neutral-400">
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Layout: Map & Active List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Map Preview (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden flex flex-col h-[480px]">
          <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
            <div className="flex flex-col">
              <span className="font-bold text-neutral-800 text-[15px]">Active Fleet Tracking</span>
              <span className="text-[11px] font-medium text-neutral-400 mt-0.5">Live positioning of active delivery agents</span>
            </div>
            <Link 
              href="/tracking"
              className="text-[13px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-all"
            >
              <span>Open Tracking Center</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          {/* Map Container */}
          <div className="flex-1 relative bg-neutral-100">
            <TrackingMap 
              drivers={fleetLocations} 
              onSelectDriver={() => {}} 
            />
          </div>
        </div>

        {/* Dispatch Order Queue (1/3 width) */}
        <div className="bg-white border border-neutral-200 rounded-md shadow-card flex flex-col justify-between h-[480px]">
          <div className="p-5 border-b border-neutral-200 bg-neutral-50/50">
            <span className="font-bold text-neutral-800 text-[15px]">Active In-Flight Queue</span>
            <span className="text-[11px] font-medium text-neutral-400 block mt-0.5">Currently monitoring courier cycles</span>
          </div>

          <div className="divide-y divide-neutral-100 overflow-y-auto flex-1">
            {isLoading && activeOrdersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 gap-1.5 text-neutral-400 h-full">
                <svg className="animate-spin h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[12px] font-medium">Loading active jobs...</span>
              </div>
            ) : activeOrdersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 gap-1.5 h-full">
                <ShoppingBag size={24} className="text-neutral-300" />
                <span className="text-[13px] font-semibold text-neutral-600">All caught up!</span>
                <p className="text-[11px] text-neutral-400">No active dispatch orders currently in transit.</p>
              </div>
            ) : (
              activeOrdersList.map((order) => (
                <div key={order.id} className="p-4 hover:bg-neutral-50/50 transition-all flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-neutral-900 font-mono">
                      {order.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 uppercase">
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-[11px] text-neutral-500 font-medium">
                    <span>Store: <strong className="text-neutral-700 font-semibold">{order.storeName}</strong></span>
                    <span>Customer: <strong className="text-neutral-700 font-semibold">{order.customerName}</strong></span>
                    <span>Driver: <strong className="text-neutral-700 font-semibold">{order.driverName || "Waiting Assignment"}</strong></span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400 font-semibold border-t border-neutral-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-neutral-300" />
                      <span>Value: ₹{(order.grandTotal / 100).toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-neutral-200 bg-neutral-50 rounded-b-md">
            <Link 
              href="/orders"
              className="block w-full text-center py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-[12px] font-bold text-neutral-700 rounded transition-all shadow-sm"
            >
              Manage Dispatch Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
