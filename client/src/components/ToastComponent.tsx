"use client";

import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast, ToastType, ToastColorScheme } from "@/types";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ToastComponentProps {
  toast: Toast;
  index: number;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onExitComplete: (id: string) => void;
}

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS: Record<ToastType, ToastColorScheme> = {
  success: {
    bg: "bg-white",
    border: "border-l-brand",
    icon: "text-brand",
    text: "text-text-primary",
    progress: "bg-brand",
  },
  error: {
    bg: "bg-white",
    border: "border-l-red-500",
    icon: "text-error-text",
    text: "text-text-primary",
    progress: "bg-red-500",
  },
  warning: {
    bg: "bg-white",
    border: "border-l-amber-500",
    icon: "text-amber-500",
    text: "text-text-primary",
    progress: "bg-amber-500",
  },
  info: {
    bg: "bg-white",
    border: "border-l-blue-500",
    icon: "text-blue-500",
    text: "text-text-primary",
    progress: "bg-blue-500",
  },
};

export default function ToastComponent({
  toast,
  index,
  onDismiss,
  onPause,
  onResume,
  onExitComplete,
}: ToastComponentProps) {
  const colors = TOAST_COLORS[toast.type];
  const IconComponent = TOAST_ICONS[toast.type];

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === "toast-exit" || e.animationName === "toastExit") {
      onExitComplete(toast.id);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg shadow-2xl border border-white/40 overflow-hidden backdrop-blur-xl",
        toast.isExiting
          ? "animate-toast-exit"
          : "animate-toast-enter",
      )}
      onMouseEnter={() => onPause(toast.id)}
      onMouseLeave={() => onResume(toast.id)}
      onAnimationEnd={handleAnimationEnd}
      tabIndex={0}
      role="listitem"
    >
      <div className="absolute inset-0 bg-white/70" />

      {/* Content area */}
      <div className="relative flex items-start gap-3.5 p-5 pr-14">
        {/* Icon with colored glow */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-card border border-white/50",
          toast.type === "success" ? "bg-brand/10 text-brand" :
            toast.type === "error" ? "bg-error-bg text-error-text" :
              toast.type === "warning" ? "bg-amber-50 text-amber-500" :
                "bg-blue-50 text-blue-500"
        )}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <p className="text-sm font-bold text-text-primary tracking-tight mb-0.5">
              {toast.title}
            </p>
          )}
          <p className={cn(
            "text-sm font-semibold leading-relaxed",
            toast.title ? "text-text-secondary" : "text-text-primary"
          )}>
            {toast.message}
          </p>
        </div>
      </div>

      {/* Close button with better hover state and z-index */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-[#F0F1F3] transition-all rounded-lg z-30"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>

      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-[3px] opacity-10",
        colors.progress
      )} />

      {/* Simplified progress bar without gradient feel */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F0F1F3]/30">
        <div
          className={cn(
            "h-full transition-transform origin-left",
            colors.progress
          )}
          style={{
            transform: `scaleX(${toast.remainingTime / toast.duration})`,
            transition: toast.isPaused ? 'none' : `transform ${toast.remainingTime}ms linear`
          }}
        />
      </div>
    </div>
  );
}
