"use client";

import { Sparkles } from "lucide-react";

/**
 * PageLoader — Full-page branded loader shown during auth checks
 * and initial data fetching.
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Logo with pulse */}
      <div className="relative mb-8">
        <div className="h-20 w-20 rounded-3xl bg-brand flex items-center justify-center shadow-2xl shadow-brand/40 animate-pulse">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Brand name */}
      <p className="text-xl font-black text-gray-900 tracking-tighter mb-2 uppercase">Shara<span className="text-brand">Spot</span></p>

      {/* Loading message */}
      {message && (
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">{message}</p>
      )}

      {/* Three-dot bounce */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-brand/40 animate-bounce" />
        <div className="h-2 w-2 rounded-full bg-brand/40 animate-bounce [animation-delay:0.2s]" />
        <div className="h-2 w-2 rounded-full bg-brand/40 animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  );
}

/**
 * InlineLoader — Smaller loader for sections within a page
 */
export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24">
      <div className="h-14 w-14 rounded-2xl bg-brand-light flex items-center justify-center mb-6">
        <Sparkles className="h-6 w-6 text-brand animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      {message && (
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{message}</p>
      )}
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-brand/30 animate-bounce" />
        <div className="h-1.5 w-1.5 rounded-full bg-brand/30 animate-bounce [animation-delay:0.2s]" />
        <div className="h-1.5 w-1.5 rounded-full bg-brand/30 animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  );
}
