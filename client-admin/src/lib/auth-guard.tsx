"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';
import { apiGetMe } from '@/features/auth/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    // Verify session is still valid on mount
    apiGetMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        clearAuth();
        router.push('/login');
      });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-[13px] text-neutral-500">Verifying session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
