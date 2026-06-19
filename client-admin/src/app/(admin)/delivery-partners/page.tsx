"use client";

import React, { useState } from "react";
import { 
  User, 
  Truck, 
  MapPin, 
  Plus, 
  Search, 
  UserCheck 
} from "lucide-react";

export default function DeliveryPartnersPage() {
  const [drivers, setDrivers] = useState([
    { id: "DVR-301", name: "Sarah Connor", phone: "+91 99999 11111", vehicle: "Scooter (KA03-EX-1234)", store: "Central Hub", status: "online" },
    { id: "DVR-302", name: "Mike Ross", phone: "+91 99999 22222", vehicle: "Motorbike (KA04-YY-9876)", store: "Central Hub", status: "busy" },
    { id: "DVR-303", name: "Harvey Specter", phone: "+91 99999 33333", vehicle: "Electric Bicycle", store: "North Outlet", status: "online" },
    { id: "DVR-304", name: "Louis Litt", phone: "+91 99999 44444", vehicle: "Bicycle", store: "West Gate Mall", status: "offline" },
  ]);

  const changeStatus = (id: string, newStatus: "online" | "offline" | "busy") => {
    setDrivers(drivers.map(driver => 
      driver.id === id ? { ...driver, status: newStatus } : driver
    ));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title + Action */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Delivery Partners</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Manage delivery agent profiles, dispatch stores, and telemetry statuses.</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all">
          <Plus size={16} />
          <span>Add New Driver</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search driver name, phone, id..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all"
            />
          </div>
          <div className="flex gap-2 text-[12px] text-neutral-500">
            <span>Online: {drivers.filter(d => d.status === "online").length}</span>
            <span>•</span>
            <span>Busy: {drivers.filter(d => d.status === "busy").length}</span>
            <span>•</span>
            <span>Offline: {drivers.filter(d => d.status === "offline").length}</span>
          </div>
        </div>

        {/* Table Grid */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-600 text-[12px] font-semibold bg-neutral-50/50">
              <th className="p-4">Driver Profile</th>
              <th className="p-4">Assigned Store</th>
              <th className="p-4">Vehicle Details</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-[14px]">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-neutral-50/50 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                      <User size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutral-800">{driver.name}</span>
                      <span className="text-[12px] text-neutral-400">{driver.id} • {driver.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-neutral-600">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <MapPin size={14} className="text-neutral-400" />
                    <span>{driver.store}</span>
                  </div>
                </td>
                <td className="p-4 text-neutral-600 font-medium">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <Truck size={14} className="text-neutral-400" />
                    <span>{driver.vehicle}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    driver.status === "online" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : driver.status === "busy"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-neutral-100 text-neutral-500 border-neutral-200"
                  }`}>
                    {driver.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <select 
                      value={driver.status}
                      onChange={(e) => changeStatus(driver.id, e.target.value as any)}
                      className="border border-neutral-200 rounded px-2.5 py-1 text-[12px] bg-white hover:bg-neutral-50 transition-all focus:outline-none"
                    >
                      <option value="online">Online</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </select>
                    <button className="text-[13px] font-semibold text-primary-600 hover:text-primary-700 transition-all px-2.5 py-1 hover:bg-primary-50 rounded">
                      Profile
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
