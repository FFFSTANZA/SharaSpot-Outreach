"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
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
    sm: "h-9 px-4 text-xs font-semibold",
    md: "h-11 px-6 text-sm font-semibold",
    lg: "h-14 px-8 text-base font-semibold",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-all duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        
        /* Primary - brand green */
        variant === "primary" && [
          "bg-brand text-white shadow-sm",
          "hover:bg-brand-hover",
        ],
        
        /* Secondary - refined gray */
        variant === "secondary" && [
          "bg-white border border-gray-100 text-gray-900 shadow-sm",
          "hover:bg-gray-50 hover:border-gray-200",
        ],
        
        /* Danger - high contrast red */
        variant === "danger" && [
          "bg-red-600 text-white shadow-sm",
          "hover:bg-red-700",
        ],
        
        /* Outline */
        variant === "outline" && [
          "border border-gray-200 bg-white text-gray-700",
          "hover:bg-gray-50 hover:border-gray-300",
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
