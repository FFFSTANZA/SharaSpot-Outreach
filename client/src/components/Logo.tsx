import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "icon";
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
}

function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/sharaspot-icon.png"
      alt="SharaSpot"
      width={128}
      height={128}
      className={className}
    />
  );
}

export function Logo({ size = "md", variant = "dark", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8 rounded-xl", text: "text-xl", svg: "h-6.5 w-6.5" },
    md: { box: "h-10 w-10 rounded-xl", text: "text-[22px]", svg: "h-8 w-8" },
    lg: { box: "h-12 w-12 rounded-2xl", text: "text-3xl", svg: "h-9.5 w-9.5" },
    icon: { box: "h-9 w-9 rounded-xl", text: "text-xl", svg: "h-7 w-7" },
  };

  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-[#1A1D21]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        s.box,
        "bg-[#0A0F1A] border border-white/10 shadow-md",
        "flex items-center justify-center",
      )}>
        <LogoMark className={cn(s.svg, "object-contain")} />
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
    sm: "h-8 w-8 rounded-xl",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  };

  return (
    <div className={cn(
      sizeClasses[size],
      "bg-[#0A0F1A] border border-white/10 shadow-md",
      "flex items-center justify-center",
      className,
    )}>
      <LogoMark className={size === "sm" ? "h-6.5 w-6.5 object-contain" : size === "md" ? "h-8 w-8 object-contain" : "h-9.5 w-9.5 object-contain"} />
    </div>
  );
}
