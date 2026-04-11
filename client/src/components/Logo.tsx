import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "icon";
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

/**
 * SharaSpot logo — paper plane mark (matches favicon).
 * Represents sending messages that land, precision outreach, and forward motion.
 * 
 * Distinctive features:
 * - Green gradient background (matches favicon)
 * - White paper plane with subtle fold detail
 * - Soft shadow for depth
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00A63E"/>
          <stop offset="60%" stopColor="#00B847"/>
          <stop offset="100%" stopColor="#10B981"/>
        </linearGradient>
      </defs>
      <g transform="translate(16,16)">
        <path d="M-9,-8 L10,0 L-9,8 L-5.5,0 Z" fill="white" fillOpacity="0.95"/>
        <path d="M-5.5,0 L10,0" stroke="rgba(0,166,62,0.35)" strokeWidth="0.8"/>
        <path d="M-9,8 L-5.5,0 L10,0 Z" fill="black" fillOpacity="0.06"/>
      </g>
    </svg>
  );
}

export function Logo({ size = "md", variant = "dark", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8 rounded-[10px]", text: "text-xl", svg: "h-4 w-4" },
    md: { box: "h-10 w-10 rounded-[12px]", text: "text-[22px]", svg: "h-5 w-5" },
    lg: { box: "h-12 w-12 rounded-[14px]", text: "text-3xl", svg: "h-6 w-6" },
    icon: { box: "h-9 w-9 rounded-[10px]", text: "text-xl", svg: "h-4.5 w-4.5" },
  };

  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-[#1A1D21]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        s.box,
        "bg-gradient-to-br from-[#00A63E] via-[#00B847] to-[#10B981]",
        "flex items-center justify-center",
        "shadow-[0_2px_12px_rgba(0,166,56,0.3)]",
        "relative overflow-hidden",
      )}>
        <LogoMark className={s.svg} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
      </div>
      {showText && (
        <span className={cn(
          s.text,
          "font-extrabold tracking-tight leading-none",
          textColor,
        )}>
          Shara<span className="text-[#00A63E]">Spot</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8 rounded-[10px]",
    md: "h-10 w-10 rounded-[12px]",
    lg: "h-12 w-12 rounded-[14px]",
  };
  
  return (
    <div className={cn(
      sizeClasses[size],
      "bg-gradient-to-br from-[#00A63E] via-[#00B847] to-[#10B981]",
      "flex items-center justify-center",
      "shadow-[0_2px_12px_rgba(0,166,56,0.3)]",
      "relative overflow-hidden",
      className,
    )}>
      <LogoMark className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
    </div>
  );
}
