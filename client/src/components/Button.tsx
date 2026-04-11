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
          "bg-[#00A63E] text-white",
          "hover:bg-[#009134] hover:shadow-[0_0_16px_rgba(0,166,56,0.25)]",
          "active:bg-[#007A2B]",
        ],
        
        /* Secondary - subtle gray */
        variant === "secondary" && [
          "bg-white border border-[#E8EAED] text-[#1A1D21]",
          "hover:bg-[#F7F8F8] hover:border-[#DADCE0] hover:shadow-sm",
          "active:bg-[#ECEDEE]",
        ],
        
        /* Compose - distinctive orange CTA */
        variant === "compose" && [
          "bg-[#FF6D01] text-white",
          "hover:bg-[#E56200] hover:shadow-[0_0_20px_rgba(255,109,1,0.3)] hover:scale-[1.02]",
          "active:bg-[#CC5500] active:scale-[0.98]",
        ],
        
        /* Danger - red */
        variant === "danger" && [
          "bg-[#EA4335] text-white",
          "hover:bg-[#D33833] hover:shadow-[0_0_16px_rgba(234,67,53,0.25)]",
          "active:bg-[#C5221F]",
        ],
        
        /* Outline */
        variant === "outline" && [
          "border border-[#E8EAED] bg-white text-[#1A1D21]",
          "hover:bg-[#F7F8F8] active:bg-[#ECEDEE]",
        ],
        
        /* Ghost - subtle */
        variant === "ghost" && [
          "bg-transparent text-[#5F6368]",
          "hover:bg-[#F1F3F4] hover:text-[#1A1D21]",
          "active:bg-[#E8EAED]",
        ],
        
        className,
      )}
    >
      {children}
    </button>
  );
}