"use client";

import React from "react";
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

export default function DashboardPage() {
  const stats = [
    { label: "Active Orders", value: "18", change: "+12% vs last hr", icon: <ShoppingBag className="text-primary-600" />, bg: "bg-primary-50" },
    { label: "Online Drivers", value: "8 / 12", change: "4 busy, 4 idle", icon: <UserCheck className="text-emerald-600" />, bg: "bg-emerald-50" },
    { label: "Delivered Today", value: "142", change: "98.5% SLA rate", icon: <CheckCircle2 className="text-cyan-600" />, bg: "bg-cyan-50" },
    { label: "Failed Deliveries", value: "2", change: "1 returned, 1 cod hold", icon: <XCircle className="text-red-600" />, bg: "bg-red-50" },
  ];

  const activeDeliveries = [
    { id: "ORD-9281", store: "Central Hub", driver: "Mike Ross", status: "In Transit", eta: "5 mins", customer: "Rachel Zane" },
    { id: "ORD-9282", store: "North Outlet", driver: "Harvey Specter", status: "Picked Up", eta: "12 mins", customer: "Louis Litt" },
    { id: "ORD-9283", store: "Central Hub", driver: "Donna Paulsen", status: "Accepted", eta: "18 mins", customer: "Jessica Pearson" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title */}
      <div>
        <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Operations Dashboard</h1>
        <p className="text-caption-14-regular text-neutral-500 mt-1">Real-time status overview of stores, orders, and delivery partners.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 bg-white rounded-md border border-neutral-200 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-neutral-500">{stat.label}</span>
              <div className={`p-2.5 rounded-full ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <span className="text-heading-32-bold text-neutral-900">{stat.value}</span>
              <div className="flex items-center gap-1.5 mt-1 text-[12px] text-neutral-500">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Layout: Map & Active List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Map Preview Mock */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-200 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-800 text-[16px]">Active Fleet Tracking</span>
              <span className="text-[12px] text-neutral-500 mt-0.5">Live positioning of active delivery agents</span>
            </div>
            <button className="text-[13px] font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-all">
              <span>View Fullscreen</span>
              <ArrowRight size={14} />
            </button>
          </div>
          {/* Map Mock */}
          <div className="flex-1 min-h-[350px] bg-neutral-100 relative flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-200/50 to-transparent pointer-events-none"></div>
            
            {/* Store Hub Marker */}
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-primary-900 text-white p-2 rounded-full shadow-lg border border-white">
                <MapPin size={18} />
              </div>
              <span className="text-[11px] font-bold bg-white text-neutral-800 px-1.5 py-0.5 rounded shadow mt-1 border border-neutral-200">Central Hub</span>
            </div>

            {/* In-Transit Driver Marker */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
              <div className="bg-amber-500 text-white p-2 rounded-full shadow-lg border border-white">
                <Truck size={16} />
              </div>
              <span className="text-[11px] font-bold bg-white text-neutral-800 px-1.5 py-0.5 rounded shadow mt-1 border border-neutral-200">Mike Ross (ETA 5m)</span>
            </div>

            {/* Delivered Marker */}
            <div className="absolute top-2/3 left-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg border border-white">
                <CheckCircle2 size={16} />
              </div>
              <span className="text-[11px] font-bold bg-white text-neutral-800 px-1.5 py-0.5 rounded shadow mt-1 border border-neutral-200">Dropoff Point</span>
            </div>

            <span className="text-caption-14-medium text-neutral-400 z-10 bg-white/95 px-4 py-2 rounded-full shadow-sm border border-neutral-200">Mapbox / Leaflet Live View Integrator</span>
          </div>
        </div>

        {/* Dispatch Order Queue Stub */}
        <div className="bg-white border border-neutral-200 rounded-md shadow-card flex flex-col justify-between">
          <div className="p-5 border-b border-neutral-200">
            <span className="font-semibold text-neutral-800 text-[16px]">Active Dispatch Orders</span>
            <span className="text-[12px] text-neutral-500 block mt-0.5">Currently monitoring delivery cycles</span>
          </div>
          <div className="divide-y divide-neutral-200 overflow-y-auto max-h-[300px]">
            {activeDeliveries.map((order, idx) => (
              <div key={idx} className="p-4 hover:bg-neutral-50 transition-all flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-neutral-900">{order.id}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">{order.status}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-neutral-500">Store: <strong className="text-neutral-700 font-medium">{order.store}</strong></span>
                  <span className="text-[12px] text-neutral-500">Customer: <strong className="text-neutral-700 font-medium">{order.customer}</strong></span>
                  <span className="text-[12px] text-neutral-500">Driver: <strong className="text-neutral-700 font-medium">{order.driver}</strong></span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-400">
                  <Clock size={12} />
                  <span>ETA to customer: {order.eta}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 rounded-b-md">
            <button className="w-full text-center py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-[13px] font-semibold text-neutral-700 rounded transition-all">
              Manage Dispatch Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
