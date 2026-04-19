"use client";

import { Loader2 } from "lucide-react";

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#00A63E] animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
        <p className="text-sm font-medium text-gray-900 tracking-tight">SharaSpot</p>
        {message && (
          <p className="text-xs text-gray-500">{message}</p>
        )}
      </div>
    </div>
  );
}

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" style={{ animationDuration: '1.5s' }} />
        {message && (
          <p className="text-xs text-gray-500">{message}</p>
        )}
      </div>
    </div>
  );
}