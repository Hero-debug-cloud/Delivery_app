"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, MapPin } from 'lucide-react';
import { useSignup } from '../hooks/useSignup';

export function SignupForm() {
  const { form, onSubmit, isLoading, error } = useSignup();
  const { register, formState: { errors } } = form;
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <div className="flex h-screen w-screen bg-neutral-50 font-sans text-neutral-950">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] to-[#1D4ED8] p-14 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07]" />
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
            <MapPin className="text-blue-400" size={22} />
          </div>
          <span className="font-bold text-[22px] tracking-tight">LogiRoute</span>
          <span className="text-[10px] bg-blue-800/60 px-2 py-0.5 rounded font-medium text-blue-200">OPS</span>
        </div>
        <div className="z-10 max-w-sm">
          <h1 className="text-[42px] font-bold leading-[1.15] tracking-tight">Join the operations team.</h1>
          <p className="text-blue-200 mt-5 text-[16px] leading-relaxed">
            Create your admin account to start managing deliveries, stores, and live tracking.
          </p>
        </div>
        <div className="z-10 text-[12px] text-blue-300/70">LogiRoute Ops Center</div>
      </div>

      {/* Right Signup Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex items-center gap-2.5 lg:hidden mb-8">
            <MapPin className="text-primary-600" size={26} />
            <span className="font-bold text-[20px] tracking-tight">LogiRoute</span>
          </div>

          <h2 className="text-[28px] font-bold text-neutral-900 tracking-tight">Create your account</h2>
          <p className="text-[15px] text-neutral-500 mt-1.5 mb-8">Join the LogiRoute admin control panel.</p>

          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[14px] text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-neutral-400" size={15} />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Jane Smith"
                  {...register('name')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-[14px] bg-neutral-50 focus:outline-none focus:bg-white transition-all ${
                    errors.name ? 'border-red-400' : 'border-neutral-200 focus:border-primary-600'
                  }`}
                />
              </div>
              {errors.name && <p className="text-[12px] text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-neutral-400" size={15} />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-[14px] bg-neutral-50 focus:outline-none focus:bg-white transition-all ${
                    errors.email ? 'border-red-400' : 'border-neutral-200 focus:border-primary-600'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[12px] text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-neutral-400" size={15} />
                <input
                  id="signup-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-3 border rounded-lg text-[14px] bg-neutral-50 focus:outline-none focus:bg-white transition-all ${
                    errors.password ? 'border-red-400' : 'border-neutral-200 focus:border-primary-600'
                  }`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-3.5 text-neutral-400">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-neutral-400" size={15} />
                <input
                  id="signup-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`w-full pl-10 pr-11 py-3 border rounded-lg text-[14px] bg-neutral-50 focus:outline-none focus:bg-white transition-all ${
                    errors.confirmPassword ? 'border-red-400' : 'border-neutral-200 focus:border-primary-600'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-3.5 text-neutral-400">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[12px] text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] py-3 rounded-lg shadow-button-primary transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-neutral-500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
