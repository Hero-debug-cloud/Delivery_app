"use client";

import React from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../hooks/useLogin';
import { useAuthStore } from '../store';

export function LoginForm() {
  const { form, onSubmit, isLoading, error } = useLogin();
  const { register, formState: { errors }, watch } = form;
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex h-screen w-screen bg-neutral-50 font-sans text-neutral-950">
      {/* Left Marketing Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] to-[#1D4ED8] p-14 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07]" />
        {/* Decorative route line */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 560 720" fill="none">
          <path d="M80 600 Q200 400 280 300 Q360 200 480 120" stroke="white" strokeWidth="2" strokeDasharray="8 6" />
          <circle cx="80" cy="600" r="6" fill="#60A5FA" />
          <circle cx="280" cy="300" r="6" fill="#60A5FA" />
          <circle cx="480" cy="120" r="6" fill="#60A5FA" />
        </svg>

        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
            <MapPin className="text-blue-400" size={22} />
          </div>
          <span className="font-bold text-[22px] tracking-tight">LogiRoute</span>
          <span className="text-[10px] bg-blue-800/60 px-2 py-0.5 rounded font-medium text-blue-200">OPS</span>
        </div>

        <div className="z-10 max-w-sm">
          <h1 className="text-[42px] font-bold leading-[1.15] tracking-tight">
            Run last-mile delivery from one control room.
          </h1>
          <p className="text-blue-200 mt-5 leading-relaxed text-[16px]">
            Manage stores, dispatch orders, and track delivery partners live with an operations-first logistics platform.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {['Live driver tracking', 'Manual order dispatch', 'Store-level operations'].map((f) => (
              <li key={f} className="flex items-center gap-3 text-[15px] text-white">
                <span className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300 text-[11px]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="z-10 flex justify-between text-[12px] text-blue-300/70">
          <span>LogiRoute Ops Center</span>
          <span>Version 1.0.0 (v1 MVP)</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-2.5 lg:hidden mb-8">
            <MapPin className="text-primary-600" size={26} />
            <span className="font-bold text-[20px] tracking-tight">LogiRoute</span>
          </div>

          <h2 className="text-[28px] font-bold text-neutral-900 tracking-tight">Welcome back</h2>
          <p className="text-[15px] text-neutral-500 mt-1.5 mb-8">Sign in to the LogiRoute admin control panel.</p>

          {/* Global Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[14px] text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Email / Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-700">Email or phone</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-neutral-400" size={15} />
                <input
                  id="auth-identifier"
                  type="text"
                  placeholder="admin@company.com or +1 555 000 0000"
                  {...register('identifier')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-[14px] bg-neutral-50 focus:outline-none focus:bg-white transition-all ${
                    errors.identifier ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-primary-600'
                  }`}
                />
              </div>
              {errors.identifier && <p className="text-[12px] text-red-600">{errors.identifier.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-semibold text-neutral-700">Password</label>
                <span className="text-[12px] text-neutral-400 cursor-not-allowed">Forgot?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-neutral-400" size={15} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-3 border rounded-lg text-[14px] bg-neutral-50 focus:outline-none focus:bg-white transition-all ${
                    errors.password ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-primary-600'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-600">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-red-600">{errors.password.message}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="auth-remember"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 accent-primary-600 rounded"
              />
              <label htmlFor="auth-remember" className="text-[13px] text-neutral-600">Remember me</label>
            </div>

            {/* Submit */}
            <button
              id="auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[15px] py-3 rounded-lg shadow-button-primary transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-neutral-500">
            New admin?{' '}
            <Link href="/auth/signup" className="text-primary-600 font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
