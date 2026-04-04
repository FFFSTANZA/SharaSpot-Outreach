import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

/**
 * SharaSpot logo — paper plane mark (matches favicon).
 * Represents sending messages that land, precision outreach, and forward motion.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(16,16)">
        <path d="M-9,-8 L10,0 L-9,8 L-5.5,0 Z" fill="white" fillOpacity="0.95"/>
        <path d="M-5.5,0 L10,0" stroke="rgba(5,150,105,0.35)" strokeWidth="0.8"/>
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
  };

  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-gray-900";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        s.box,
        "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600",
        "flex items-center justify-center",
        "shadow-[0_2px_12px_rgba(5,150,105,0.35)]",
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
          Shara<span className="text-emerald-600">Spot</span>
        </span>
      )}
    </div>
  );
}
