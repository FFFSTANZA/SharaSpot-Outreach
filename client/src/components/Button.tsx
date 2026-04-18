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
 * SharaSpot Button - memorable, consistent, tactile.
 * 
 * Features:
 * - Brand colors for primary actions
 * - Distinctive orange for compose CTA
 * - Subtle hover/active animations
 * - Focus ring on brand color
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-all duration-150 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A63E]/50",
        "active:scale-[0.98] active:duration-75",
        sizeClasses[size],
        
        /* Primary - brand green */
        variant === "primary" && [
          "bg-brand text-white",
          "hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20",
          "active:bg-brand-active",
        ],
        
        /* Secondary - subtle gray */
        variant === "secondary" && [
          "bg-white border border-gray-200 text-gray-900 shadow-sm",
          "hover:bg-gray-50 hover:border-gray-300",
          "active:bg-gray-100",
        ],
        
        /* Compose - now brand green for consistency */
        variant === "compose" && [
          "bg-brand text-white",
          "hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/20 hover:scale-[1.02]",
          "active:bg-brand-active active:scale-[0.98]",
        ],
        
        /* Danger - red */
        variant === "danger" && [
          "bg-red-600 text-white",
          "hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20",
          "active:bg-red-800",
        ],
        
        /* Outline */
        variant === "outline" && [
          "border border-gray-200 bg-white text-gray-700",
          "hover:bg-gray-50 active:bg-gray-100",
        ],
        
        /* Ghost - subtle */
        variant === "ghost" && [
          "bg-transparent text-gray-500",
          "hover:bg-gray-50 hover:text-gray-900",
          "active:bg-gray-100",
        ],
        
        className,
      )}
    >
      {children}
    </button>
  );
}