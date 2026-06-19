"use client";

import React, { useState } from "react";
import { 
  Store, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  ToggleLeft, 
  ToggleRight 
} from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState([
    { id: "STR-1001", name: "Central Hub", address: "100 MG Road, Bangalore", phone: "+91 80 2345 6789", lat: 12.9716, lng: 77.5946, active: true },
    { id: "STR-1002", name: "North Outlet", address: "404 Outer Ring Road, Hebbal", phone: "+91 80 9876 5432", lat: 13.0358, lng: 77.5978, active: true },
    { id: "STR-1003", name: "West Gate Mall", address: "Shop 12, Rajajinagar", phone: "+91 80 5555 1234", lat: 12.9880, lng: 77.5540, active: false },
  ]);

  const toggleStore = (id: string) => {
    setStores(stores.map(store => 
      store.id === id ? { ...store, active: !store.active } : store
    ));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title + Action */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Store Management</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Configure and manage logistics dispatch points.</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all">
          <Plus size={16} />
          <span>Add New Store</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter stores by name or address..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600 transition-all"
            />
          </div>
          <span className="text-[12px] font-medium text-neutral-500">{stores.length} stores configured</span>
        </div>

        {/* Table Grid */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-600 text-[12px] font-semibold bg-neutral-50/50">
              <th className="p-4">Store Info</th>
              <th className="p-4">Address</th>
              <th className="p-4">Coordinates (Lat/Lng)</th>
              <th className="p-4">Contact</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-[14px]">
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-neutral-50/50 transition-all">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Store size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutral-800">{store.name}</span>
                      <span className="text-[11px] text-neutral-400">{store.id}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-neutral-600 max-w-xs truncate">{store.address}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-neutral-500 font-mono text-[13px]">
                    <MapPin size={14} className="text-neutral-400" />
                    <span>{store.lat.toFixed(4)}, {store.lng.toFixed(4)}</span>
                  </div>
                </td>
                <td className="p-4 text-neutral-600">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <Phone size={13} className="text-neutral-400" />
                    <span>{store.phone}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    store.active 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-neutral-100 text-neutral-600 border-neutral-200"
                  }`}>
                    {store.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => toggleStore(store.id)} 
                      className="text-neutral-600 hover:text-neutral-900 transition-all"
                    >
                      {store.active ? <ToggleRight size={28} className="text-primary-600" /> : <ToggleLeft size={28} />}
                    </button>
                    <button className="text-[13px] font-semibold text-primary-600 hover:text-primary-700 transition-all px-2.5 py-1 hover:bg-primary-50 rounded">
                      Edit
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
