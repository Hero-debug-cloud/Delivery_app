"use client";

import React from "react";
import { History, Play, ShieldAlert } from "lucide-react";

export default function ReplayPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] p-8 text-center bg-white rounded-xl border border-neutral-200 shadow-sm gap-5">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 shadow-inner">
        <History size={32} className="animate-pulse" />
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
          Historical Route Replay
        </h1>
        <p className="text-sm text-neutral-500">
          This sub-module will enable dispatchers to replay driver location logs, audit delivery paths, and analyze route efficiency over historical timeframes.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-medium mt-2">
        <ShieldAlert size={14} className="shrink-0" />
        <span>Placeholder module — under development</span>
      </div>
    </div>
  );
}
