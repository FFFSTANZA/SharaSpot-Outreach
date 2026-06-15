"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * SharaSpot Input - professional, modern, accessible.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref ?? undefined}
        className={cn(
          "w-full rounded-lg border border-border-light bg-[#F8F9FA]/50 px-4 py-3 text-sm text-text-primary font-bold",
          "transition-all duration-300",
          "placeholder:text-text-muted placeholder:font-medium",
          "focus:outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10",
          "hover:border-border-light hover:bg-white",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
export default Input;
