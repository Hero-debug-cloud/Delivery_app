"use client";

import React, { useState } from "react";
import { 
  ClipboardList, 
  MapPin, 
  User, 
  Clock, 
  Search, 
  Plus, 
  AlertCircle 
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([
    { id: "ORD-9281", customer: "Rachel Zane", address: "505 Park Avenue, NY", store: "Central Hub", status: "in_transit", payment: "prepaid", driver: "Mike Ross" },
    { id: "ORD-9282", customer: "Louis Litt", address: "12 Wall Street, NY", store: "North Outlet", status: "picked_up", payment: "cod", driver: "Harvey Specter" },
    { id: "ORD-9283", customer: "Jessica Pearson", address: "Empire State Bldg, NY", store: "Central Hub", status: "accepted", payment: "prepaid", driver: "Donna Paulsen" },
    { id: "ORD-9284", customer: "Daniel Hardman", address: "72 Broadway, NY", store: "Central Hub", status: "created", payment: "cod", driver: null },
    { id: "ORD-9285", customer: "Robert Zane", address: "140 Liberty St, NY", store: "West Gate Mall", status: "failed", payment: "prepaid", driver: "Louis Litt" },
  ]);

  const [availableDrivers] = useState([
    { id: "DVR-301", name: "Sarah Connor" },
    { id: "DVR-302", name: "Mike Ross" },
    { id: "DVR-303", name: "Harvey Specter" },
    { id: "DVR-304", name: "Louis Litt" },
  ]);

  const assignDriver = (orderId: string, driverName: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, driver: driverName || null, status: driverName ? "assigned" : "created" } 
        : order
    ));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "created": return "bg-slate-100 text-slate-700 border-slate-200";
      case "assigned": return "bg-blue-50 text-blue-700 border-blue-200";
      case "accepted": return "bg-purple-50 text-purple-700 border-purple-200";
      case "picked_up": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "in_transit": return "bg-amber-50 text-amber-700 border-amber-200";
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "failed": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title + Action */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Order Queue</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Ingest, dispatch, and track orders within the system.</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all">
          <Plus size={16} />
          <span>Create Manual Order</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Search order ID, customer name..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all"
            />
          </div>
          <span className="text-[12px] font-medium text-neutral-500">{orders.length} orders total in queue</span>
        </div>

        {/* Table Grid */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-600 text-[12px] font-semibold bg-neutral-50/50">
              <th className="p-4">Order ID & Store</th>
              <th className="p-4">Customer Info</th>
              <th className="p-4">Delivery Address</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Assigned Driver</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-[14px]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50/50 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-600">
                      <ClipboardList size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutral-800">{order.id}</span>
                      <span className="text-[12px] text-neutral-400">{order.store}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-neutral-800">{order.customer}</span>
                  </div>
                </td>
                <td className="p-4 text-neutral-600">
                  <div className="flex items-center gap-1 mt-0.5 text-neutral-500 font-mono text-[12px]">
                    <MapPin size={13} className="text-neutral-400" />
                    <span>{order.address}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                    order.payment === "prepaid" ? "bg-cyan-50 text-cyan-700" : "bg-orange-50 text-orange-700"
                  }`}>
                    {order.payment.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(order.status)}`}>
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <select 
                      value={order.driver || ""}
                      onChange={(e) => assignDriver(order.id, e.target.value)}
                      className="border border-neutral-200 rounded px-2 py-1 text-[12px] bg-white hover:bg-neutral-50 transition-all focus:outline-none w-36"
                    >
                      <option value="">Unassigned</option>
                      {availableDrivers.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button className="text-[13px] font-semibold text-primary-600 hover:text-primary-700 transition-all px-2.5 py-1 hover:bg-primary-50 rounded">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
