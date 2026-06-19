"use client";

import React, { useState } from "react";
import { 
  MapPin, 
  Search, 
  Navigation, 
  Battery, 
  Info,
  Layers,
  ZoomIn,
  ZoomOut
} from "lucide-react";

export default function TrackingPage() {
  const [activeTracking, setActiveTracking] = useState([
    { id: "DVR-301", name: "Sarah Connor", lat: 12.9716, lng: 77.5946, status: "online", battery: 92, speed: "22 km/h", activeOrder: "ORD-9283" },
    { id: "DVR-302", name: "Mike Ross", lat: 12.9845, lng: 77.6012, status: "busy", battery: 74, speed: "18 km/h", activeOrder: "ORD-9281" },
    { id: "DVR-303", name: "Harvey Specter", lat: 13.0112, lng: 77.5890, status: "online", battery: 85, speed: "26 km/h", activeOrder: "ORD-9282" },
  ]);

  const [selectedDriver, setSelectedDriver] = useState(activeTracking[0]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 -m-4">
      {/* Left List Pane */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-semibold text-neutral-800 text-[16px]">Active Tracking Fleet</h2>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2 text-neutral-400" size={14} />
              <input 
                type="text" 
                placeholder="Search active drivers..."
                className="w-full pl-9 pr-4 py-1.5 border border-neutral-200 rounded-md text-[12px] focus:outline-none focus:border-primary-600"
              />
            </div>
          </div>
          <div className="divide-y divide-neutral-200 overflow-y-auto max-h-[500px]">
            {activeTracking.map((driver) => (
              <div 
                key={driver.id} 
                onClick={() => setSelectedDriver(driver)}
                className={`p-4 hover:bg-neutral-50 cursor-pointer transition-all flex flex-col gap-2 ${
                  selectedDriver.id === driver.id ? "bg-primary-50 hover:bg-primary-50/80 border-l-4 border-primary-600" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-800 text-[13px]">{driver.name}</span>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{driver.status.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1"><Battery size={12} className="text-neutral-400" /> {driver.battery}%</span>
                  <span>Speed: {driver.speed}</span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Active Order: <span className="font-semibold text-neutral-600">{driver.activeOrder}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex gap-2 items-center text-[12px] text-neutral-500">
          <Info size={14} className="text-neutral-400" />
          <span>Telemetry updates every 10s</span>
        </div>
      </div>

      {/* Right Map Canvas Mock */}
      <div className="flex-1 bg-neutral-100 relative flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden">
        {/* Map Grid Background mock */}
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-200/40 via-transparent to-neutral-200/20 pointer-events-none"></div>

        {/* Selected Driver Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-500">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-primary-600/30 animate-ping"></div>
            <div className="bg-primary-600 text-white p-3 rounded-full shadow-lg border-2 border-white relative z-10">
              <Navigation className="rotate-45" size={20} />
            </div>
          </div>
          <span className="text-[12px] font-bold bg-neutral-900 text-white px-2 py-1 rounded shadow mt-2 border border-neutral-800">
            {selectedDriver.name}
          </span>
        </div>

        {/* Map Control Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 z-20">
          <button className="p-2 bg-white hover:bg-neutral-50 rounded border border-neutral-200 shadow-sm text-neutral-600 transition-all"><ZoomIn size={16} /></button>
          <button className="p-2 bg-white hover:bg-neutral-50 rounded border border-neutral-200 shadow-sm text-neutral-600 transition-all"><ZoomOut size={16} /></button>
          <button className="p-2 bg-white hover:bg-neutral-50 rounded border border-neutral-200 shadow-sm text-neutral-600 transition-all mt-2"><Layers size={16} /></button>
        </div>

        {/* Detail Overlay Card */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-neutral-200 rounded-md p-4 shadow-card w-80 z-20 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-bold text-neutral-800 text-[15px]">{selectedDriver.name}</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Device Telemetry: Connected</span>
            </div>
            <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">{selectedDriver.id}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[12px] border-t border-b border-neutral-100 py-2.5">
            <div className="flex flex-col">
              <span className="text-neutral-400">Position</span>
              <span className="font-semibold text-neutral-700 mt-0.5 font-mono">{selectedDriver.lat.toFixed(5)}, {selectedDriver.lng.toFixed(5)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-neutral-400">Velocity</span>
              <span className="font-semibold text-neutral-700 mt-0.5">{selectedDriver.speed}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[12px]">
            <span className="text-neutral-500">Active Order: <strong className="text-primary-600">{selectedDriver.activeOrder}</strong></span>
            <button className="text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-all">
              Inspect Route
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
