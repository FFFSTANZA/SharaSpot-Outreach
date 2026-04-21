import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "icon";
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(16, 16)">
        <path d="M-9,-8 L10,0 L-9,8 L-5.5,0 Z" fill="white" fillOpacity="0.95" />
        <path d="M-5.5,0 L10,0" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <path d="M-9,8 L-5.5,0 L10,0 Z" fill="black" fillOpacity="0.06" />
      </g>
    </svg>
  );
}

export function Logo({ size = "md", variant = "dark", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8 rounded-lg", text: "text-xl", svg: "h-4 w-4" },
    md: { box: "h-10 w-10 rounded-lg", text: "text-[22px]", svg: "h-5 w-5" },
    lg: { box: "h-12 w-12 rounded-lg", text: "text-3xl", svg: "h-6 w-6" },
    icon: { box: "h-9 w-9 rounded-lg", text: "text-xl", svg: "h-4.5 w-4.5" },
  };

  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-[#1A1D21]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        s.box,
        "bg-brand",
        "flex items-center justify-center",
      )}>
        <LogoMark className={s.svg} />
      </div>
      {showText && (
        <span className={cn(
          s.text,
          "font-extrabold tracking-tight leading-none",
          textColor,
        )}>
          Shara<span className="text-brand">Spot</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-lg",
    lg: "h-12 w-12 rounded-lg",
  };

  return (
    <div className={cn(
      sizeClasses[size],
      "bg-brand",
      "flex items-center justify-center",
      className,
    )}>
      <LogoMark className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"} />
    </div>
  );
}