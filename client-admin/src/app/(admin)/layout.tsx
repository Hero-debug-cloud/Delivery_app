"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  Truck, 
  ClipboardList, 
  MapPin, 
  LogOut,
  Bell,
  Search,
  User
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

function SidebarLink({ href, label, icon, active }: SidebarLinkProps) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-md text-body-16-medium transition-all ${
        active 
          ? "bg-primary-600 text-white shadow-button-primary" 
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/stores", label: "Stores", icon: <Store size={20} /> },
    { href: "/delivery-partners", label: "Drivers", icon: <Truck size={20} /> },
    { href: "/orders", label: "Orders", icon: <ClipboardList size={20} /> },
    { href: "/tracking", label: "Live Tracking", icon: <MapPin size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-950 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-neutral-200 bg-gradient-brand-dark text-white gap-2">
            <MapPin className="text-primary-500 animate-pulse" size={24} />
            <span className="font-bold text-heading-20-semibold tracking-tight">LogiRoute</span>
            <span className="text-[10px] bg-primary-700 px-1.5 py-0.5 rounded font-medium">Ops</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            {navigation.map((item) => (
              <SidebarLink 
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
              />
            ))}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-neutral-200 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-semibold">
              OP
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-neutral-800 leading-none">Dispatcher One</span>
              <span className="text-[12px] text-neutral-500 mt-1">Store Dispatcher</span>
            </div>
          </div>
          
          <Link 
            href="/login"
            className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all mt-1"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input 
                type="text" 
                placeholder="Search orders, stores or drivers..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[14px] bg-neutral-50 focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 relative transition-all">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>
            
            <div className="h-6 w-px bg-neutral-200"></div>

            {/* Current System Status */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[13px] font-medium text-neutral-600">OSRM Engine: Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
