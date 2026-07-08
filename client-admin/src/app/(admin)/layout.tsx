"use client";

import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  DollarSign,
} from "lucide-react";
import { AuthGuard } from "@/lib/auth-guard";
import { useAuthStore } from "@/features/auth/store";
import { apiLogout, apiUpdateProfile } from "@/features/auth/api";
import { UserModal } from "@/features/users/components/UserModal";

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  isCollapsed: boolean;
  badge?: string;
  hasSubItems?: boolean;
  isFlyoutOpen?: boolean;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

function SidebarLink({ 
  href, 
  label, 
  icon, 
  active, 
  isCollapsed, 
  badge,
  hasSubItems,
  isFlyoutOpen,
  onMouseEnter,
  onMouseLeave
}: SidebarLinkProps) {
  const isHighlight = active || isFlyoutOpen;
  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Link 
        href={hasSubItems ? "#" : href}
        onClick={(e) => {
          if (hasSubItems) {
            e.preventDefault();
          }
        }}
        className={`group relative flex items-center rounded-lg transition-all duration-200 ${
          isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
        } ${
          isHighlight 
            ? "bg-primary-50/70 text-primary-700 font-semibold shadow-sm" 
            : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
        }`}
      >
        {/* Active Accent Bar */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary-600 rounded-r-md transition-all duration-200 ${
          isHighlight ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
        }`} />

        {/* Icon with micro-animation on hover */}
        <div className={`transition-transform duration-200 group-hover:scale-105 ${isHighlight ? "text-primary-600" : "text-neutral-500 group-hover:text-neutral-900"}`}>
          {icon}
        </div>

        {/* Label and Badge (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="flex items-center justify-between w-full overflow-hidden">
            <span className="text-sm font-medium whitespace-nowrap truncate">{label}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {badge === "live" && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-600 border border-emerald-200">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </span>
              )}
              {hasSubItems && (
                <ChevronRight size={13} className="text-neutral-400 group-hover:text-neutral-600 transition-transform duration-200" />
              )}
            </div>
          </div>
        )}

        {/* Collapsed Tooltip */}
        {isCollapsed && (
          <div className="absolute left-16 z-30 px-2.5 py-1.5 rounded-md bg-neutral-900 text-white text-[12px] font-medium opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 pointer-events-none shadow-md whitespace-nowrap">
            {label}
            {badge === "live" && " (Live)"}
            {/* Tooltip Arrow */}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-900 rotate-45" />
          </div>
        )}
      </Link>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [adminStatus, setAdminStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Floating hover menu states
  const [hoveredLink, setHoveredLink] = useState<{
    label: string;
    top: number;
    items: { href: string; label: string }[];
  } | null>(null);
  const timeoutRef = React.useRef<any>(null);

  const handleMouseEnter = (e: React.MouseEvent, item: any) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredLink({
      label: item.label,
      top: rect.top,
      items: item.subItems,
    });
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 150);
  };

  const popoverRef = React.useRef<HTMLDivElement>(null);
  const footerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        footerRef.current &&
        !footerRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveProfile = async (data: any) => {
    try {
      setIsSavingProfile(true);
      const res = await apiUpdateProfile(data);
      useAuthStore.getState().setUser(res.user);
    } catch (err: any) {
      throw new Error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  const resolvedCollapsed = isMounted ? isCollapsed : false;

  const statusColors = {
    online: "bg-emerald-500",
    busy: "bg-amber-500",
    offline: "bg-neutral-400"
  };

  const statusLabels = {
    online: "Online",
    busy: "Busy",
    offline: "Offline"
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdminStatus(prev => {
      if (prev === 'online') return 'busy';
      if (prev === 'busy') return 'offline';
      return 'online';
    });
  };

  interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    subItems?: { href: string; label: string }[];
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { 
          href: "/tracking", 
          label: "Live Tracking", 
          icon: <MapPin size={18} />, 
          subItems: [
            { href: "/tracking", label: "Live" },
            { href: "/tracking/replay", label: "Replay" }
          ]
        },
      ]
    },
    {
      title: "Operations",
      items: [
        { href: "/orders", label: "Orders", icon: <ClipboardList size={18} /> },
        { href: "/delivery-partners", label: "Drivers", icon: <Truck size={18} /> },
      ]
    },
    {
      title: "Management",
      items: [
        { href: "/stores", label: "Stores", icon: <Store size={18} /> },
        { href: "/products", label: "Products", icon: <Package size={18} /> },
        { href: "/users", label: "Staff", icon: <Users size={18} /> },
        { href: "/customers", label: "Customers", icon: <User size={18} /> },
        { 
          href: "/payroll", 
          label: "Payroll", 
          icon: <DollarSign size={18} />,
          subItems: [
            { href: "/payroll", label: "Console" },
            { href: "/payroll/payouts", label: "Ledger" },
            { href: "/payroll/settings", label: "Settings" }
          ]
        },
      ]
    }
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
        <aside className={`relative h-screen border-r border-neutral-200 bg-white flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
          resolvedCollapsed ? "w-20" : "w-64"
        }`}>
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            aria-label={resolvedCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute top-8 -right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 shadow-sm transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} className={`transition-transform duration-300 ${resolvedCollapsed ? "rotate-180" : ""}`} />
          </button>

          <div>
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-neutral-200 bg-white gap-3 overflow-hidden shrink-0">
              <div className={`flex items-center gap-3.5 ${resolvedCollapsed ? "mx-auto" : ""}`}>
                {/* Logo Icon Container */}
                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)] shrink-0">
                  <MapPin className="shrink-0 animate-pulse" size={18} />
                </div>

                {/* Brand Text */}
                <div className={`flex flex-col transition-all duration-300 ${resolvedCollapsed ? "opacity-0 max-w-0 overflow-hidden" : "opacity-100 max-w-[150px]"}`}>
                  <span className="font-bold text-[15px] text-neutral-900 tracking-tight leading-none">LogiRoute</span>
                  <span className="text-[9px] font-semibold text-primary-600 mt-1.5 uppercase tracking-wider leading-none">Operations</span>
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            <nav className="p-4 flex flex-col gap-4 overflow-y-auto">
              {navSections.map((section, idx) => (
                <div key={section.title} className="flex flex-col gap-1.5">
                  {/* Section Title */}
                  {resolvedCollapsed ? (
                    idx > 0 && <div className="mx-auto w-8 h-[1px] bg-neutral-100 my-1 shrink-0" />
                  ) : (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider select-none">
                        {section.title}
                      </span>
                    </div>
                  )}

                  {/* Section Items */}
                  <div className="flex flex-col gap-1">
                    {section.items.map((item) => (
                      <SidebarLink 
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={pathname === item.href || pathname.startsWith(item.href + "/")}
                        isCollapsed={resolvedCollapsed}
                        badge={item.badge}
                        hasSubItems={!!item.subItems}
                        isFlyoutOpen={hoveredLink?.label === item.label}
                        onMouseEnter={(e) => {
                          if (item.subItems) {
                            handleMouseEnter(e, item);
                          } else {
                            handleMouseLeave();
                          }
                        }}
                        onMouseLeave={handleMouseLeave}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* User Footer */}
          <div className="p-4 border-t border-neutral-200 flex flex-col gap-3 shrink-0 relative">
            {/* Floating Popover Menu */}
            {isPopoverOpen && (
              <div 
                ref={popoverRef}
                className={`absolute bottom-[72px] z-40 w-52 bg-white border border-neutral-200 shadow-lg rounded-lg p-1.5 flex flex-col gap-1 transition-all duration-200 ${
                  resolvedCollapsed ? "left-4" : "left-4 right-4 w-auto"
                }`}
              >
                <div className="px-2.5 py-1.5 border-b border-neutral-100 flex flex-col gap-0.5 select-none">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Account Options</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsPopoverOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
                >
                  <User size={15} className="text-neutral-500 shrink-0" />
                  <span>Profile Settings</span>
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    cycleStatus(e);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColors[adminStatus]} shrink-0`} />
                  <span className="flex-1">Status: {statusLabels[adminStatus]}</span>
                  <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider shrink-0 font-mono">Cycle</span>
                </button>
                
                <div className="h-[1px] bg-neutral-100 my-0.5" />
                
                <button
                  type="button"
                  onClick={() => {
                    setIsPopoverOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut size={15} className="text-red-500 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* Profile Section Click Trigger */}
            <div 
              ref={footerRef}
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className={`flex items-center gap-3 w-full cursor-pointer hover:bg-neutral-50 p-2 rounded-lg transition-all ${
                resolvedCollapsed ? "justify-center" : ""
              }`}
            >
              {/* Avatar Container */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[13px] uppercase select-none">
                  {initials}
                </div>
                {/* Status Dot */}
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ring-neutral-200 ${statusColors[adminStatus]} transition-colors duration-200`} />
              </div>

              {/* Name & Role (hidden when collapsed) */}
              {!resolvedCollapsed && (
                <div className="flex flex-col overflow-hidden flex-1 select-none">
                  <span className="text-[14px] font-semibold text-neutral-800 leading-none truncate">
                    {user?.name ?? 'Admin User'}
                  </span>
                  <span className="text-[12px] text-neutral-500 mt-1 capitalize leading-none flex items-center gap-1">
                    <span className="truncate">{user?.role?.replace('_', ' ') ?? 'Admin'}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-400 text-[10px] shrink-0">{statusLabels[adminStatus]}</span>
                  </span>
                </div>
              )}
            </div>
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

          {/* Global Footer */}
          <footer className="h-10 border-t border-neutral-200 bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-semibold text-neutral-400 tracking-wide">
                © {new Date().getFullYear()} LogiRoute Ops Dashboard
              </span>
              <span className="text-neutral-200 select-none">|</span>
              <span className="text-[11px] text-neutral-400 font-mono">v1.0.0-beta</span>
            </div>

            <div className="flex items-center gap-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-neutral-400 hover:text-neutral-700 font-medium transition-colors"
              >
                Docs
              </a>
              <a
                href="/dashboard"
                className="text-[11px] text-neutral-400 hover:text-neutral-700 font-medium transition-colors"
              >
                API Health
              </a>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-600">All Systems Operational</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {user && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProfile}
          user={user}
          isSaving={isSavingProfile}
          isSelf={true}
        />
      )}

      {/* Floating Right Flyout Hover Menu */}
      {hoveredLink && (
        <div
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          style={{ top: hoveredLink.top }}
          className={`fixed z-[9999] w-40 bg-white shadow-lg rounded-lg p-1.5 flex flex-col gap-1 border border-neutral-200 ${
            resolvedCollapsed ? "left-[76px]" : "left-[248px]"
          }`}
        >
          {hoveredLink.items.map((sub) => {
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setHoveredLink(null)}
                className={`px-3 py-2 text-left text-[13px] font-semibold rounded-md transition-all duration-200 ${
                  isSubActive
                    ? "bg-primary-50/70 text-primary-700 font-semibold shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                }`}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </AuthGuard>
  );
}
