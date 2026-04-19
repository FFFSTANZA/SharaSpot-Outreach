"use client";

import { cn } from "@/lib/utils";

interface SidebarItemProps {
  label: string;
  count?: number;
  isActive?: boolean;
  icon?: React.ReactNode;
  onClick: React.MouseEventHandler;
}

/**
 * SidebarItem - High-contrast navigation item.
 */
export function SidebarItem({
  label,
  count,
  isActive,
  icon,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
        isActive
          ? "bg-brand/10 text-brand"
          : "text-text-secondary hover:bg-interactive-hover hover:text-text-primary"
      )}
    >
      <span className={cn(
        "transition-colors",
        isActive ? "text-brand" : "text-text-muted group-hover:text-text-secondary"
      )}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>

      {count !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors",
          isActive ? "bg-brand text-white" : "bg-border-light text-text-muted"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}