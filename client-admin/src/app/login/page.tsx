"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, KeyRound, Mail, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Stub login authentication delay
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-50 font-sans text-neutral-950">
      {/* Left Marketing Panel - Brand Gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] to-[#1D4ED8] p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        
        {/* Top Branding Header */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur">
            <MapPin className="text-primary-500 animate-pulse" size={24} />
          </div>
          <span className="font-bold text-[24px] tracking-tight">LogiRoute</span>
        </div>

        {/* Mid Hero Section */}
        <div className="z-10 max-w-md">
          <h1 className="text-[36px] font-bold leading-tight">Last-mile dispatch, managed live.</h1>
          <p className="text-neutral-300 mt-4 leading-relaxed text-[16px]">
            Real-time delivery partner assignments, driver telemetries, OSRM shortest-path baselines, and instant proof-of-delivery checks.
          </p>
        </div>

        {/* Footer info */}
        <div className="z-10 flex justify-between text-[12px] text-neutral-400">
          <span>LogiRoute Ops Center</span>
          <span>Version 1.0.0 (v1 MVP)</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md flex flex-col gap-8">
          {/* Form Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 lg:hidden mb-4">
              <MapPin className="text-primary-600 animate-bounce" size={28} />
              <span className="font-bold text-[22px] tracking-tight">LogiRoute</span>
            </div>
            <h2 className="text-[26px] font-bold text-neutral-900 tracking-tight">Access Ops Center</h2>
            <p className="text-[14px] text-neutral-500">Sign in with your administrator, manager, or dispatcher credentials.</p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@store.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-md text-[14px] bg-neutral-50 focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-neutral-400" size={16} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-md text-[14px] bg-neutral-50 focus:outline-none focus:border-primary-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] py-3 rounded-md shadow-button-primary transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          {/* Demo Login Credentials helper banner */}
          <div className="p-4 bg-primary-50/50 border border-primary-100 rounded-md flex gap-3 text-[13px] text-neutral-600">
            <ShieldAlert className="text-primary-600 shrink-0" size={18} />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-primary-900">Demo Access credentials</span>
              <span>Any email and password will work for MVP setup demonstration purposes (redirects to dashboard).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
