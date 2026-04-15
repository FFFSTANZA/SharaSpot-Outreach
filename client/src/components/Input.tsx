"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Input - memorable, consistent styling.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref ?? undefined}
        className={cn(
          "w-full rounded-md border border-[#E8EAED] bg-white px-3 py-2 text-sm text-[#1A1D21]",
          "transition-all duration-150",
          "placeholder:text-[#9AA0A6]",
          "focus:outline-none focus:border-[#00A63E] focus:ring-2 focus:ring-[#00A63E]/20",
          "hover:border-[#DADCE0]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
export default Input;