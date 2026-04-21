"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "outline"
  | "ghost"
  | "minimal";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

/**
 * SharaSpot Button - tactile and purposeful.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-brand text-white hover:bg-brand/90 hover:shadow-brand-glow active:bg-brand/95 shadow-premium-sm",
    secondary: "bg-brand-light text-success-text hover:bg-brand-muted active:bg-brand",
    danger: "bg-error-bg text-error-text border border-error-border hover:bg-error-text hover:text-white",
    outline: "border border-border-medium bg-surface text-text-primary hover:bg-background hover:border-border-strong",
    ghost: "bg-transparent text-text-secondary hover:bg-interactive-hover hover:text-text-primary",
    minimal: "bg-transparent text-text-muted hover:bg-transparent hover:text-brand p-0",
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold tracking-tight",
        "transition-all duration-200 ease-out select-none",
        "focus:outline-none focus:ring-2 focus:ring-brand/30",
        "active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Please wait...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}