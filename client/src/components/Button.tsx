"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "compose"
  | "danger"
  | "outline"
  | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

/**
 * SharaSpot Button - modern, consistent, professional.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "h-9 px-4 text-xs font-black uppercase tracking-widest",
    md: "h-11 px-6 text-xs font-black uppercase tracking-widest",
    lg: "h-14 px-8 text-sm font-black uppercase tracking-widest",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl transition-all duration-300 ease-in-out",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/10",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
        sizeClasses[size],
        
        /* Primary - brand green */
        variant === "primary" && [
          "bg-brand text-white shadow-lg shadow-brand/20",
          "hover:bg-brand-hover hover:shadow-brand/30 hover:scale-[1.02]",
        ],
        
        /* Secondary - refined gray */
        variant === "secondary" && [
          "bg-white border border-gray-100 text-gray-900 shadow-sm",
          "hover:bg-gray-50 hover:border-gray-200 hover:scale-[1.02]",
        ],
        
        /* Compose - alias for primary but with extra prominence */
        variant === "compose" && [
          "bg-brand text-white shadow-xl shadow-brand/20",
          "hover:bg-brand-hover hover:scale-[1.05]",
        ],
        
        /* Danger - high contrast red */
        variant === "danger" && [
          "bg-red-600 text-white shadow-lg shadow-red-500/20",
          "hover:bg-red-700 hover:scale-[1.02]",
        ],
        
        /* Outline */
        variant === "outline" && [
          "border-2 border-gray-100 bg-white text-gray-700",
          "hover:bg-gray-50 hover:border-gray-200",
        ],
        
        /* Ghost - minimal */
        variant === "ghost" && [
          "bg-transparent text-gray-500",
          "hover:bg-gray-50 hover:text-gray-900",
        ],
        
        className,
      )}
    >
      {children}
    </button>
  );
}
