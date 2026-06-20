"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  Truck, 
  ClipboardList, 
  MapPin, 
  LogOut,
  Bell,
  Search,
  Package,
} from "lucide-react";
import { AuthGuard } from "@/lib/auth-guard";
import { useAuthStore } from "@/features/auth/store";
import { apiLogout } from "@/features/auth/api";

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
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const navigation = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/stores", label: "Stores", icon: <Store size={20} /> },
    { href: "/products", label: "Products", icon: <Package size={20} /> },
    { href: "/delivery-partners", label: "Drivers", icon: <Truck size={20} /> },
    { href: "/orders", label: "Orders", icon: <ClipboardList size={20} /> },
    { href: "/tracking", label: "Live Tracking", icon: <MapPin size={20} /> },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'OP';

  const handleSignOut = async () => {
    clearAuth();
    await apiLogout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-neutral-50 text-neutral-950 font-sans">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-white flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-neutral-200 bg-gradient-to-r from-[#0F172A] to-[#1D4ED8] text-white gap-2">
              <MapPin className="text-blue-400 animate-pulse" size={22} />
              <span className="font-bold text-heading-20-semibold tracking-tight">LogiRoute</span>
              <span className="text-[10px] bg-blue-900/60 px-1.5 py-0.5 rounded font-medium ml-1">Ops</span>
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
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[13px]">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[14px] font-semibold text-neutral-800 leading-none truncate">
                  {user?.name ?? 'Admin User'}
                </span>
                <span className="text-[12px] text-neutral-500 mt-0.5 capitalize">
                  {user?.role?.replace('_', ' ') ?? 'Admin'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 rounded-md text-[14px] font-medium text-red-600 hover:bg-red-50 transition-all mt-1 w-full text-left"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
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

              {/* System Status */}
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
    </AuthGuard>
  );
}
