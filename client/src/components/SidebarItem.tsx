interface SidebarItemProps {
  label: string;
  count?: number;
  isActive?: boolean;
  icon?: React.ReactNode;
  onClick: React.MouseEventHandler;
}

/**
 * SidebarItem - Gmail-style navigation item with brand accents.
 * 
 * Distinctive features:
 * - Brand green on active state
 * - Border-left indicator
 * - Consistent count styling
 */
export function SidebarItem({
  label,
  count,
  isActive,
  icon,
  onClick,
}: SidebarItemProps) {
  return (
    <div
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-md 
        text-sm font-medium cursor-pointer transition-all duration-150
        border-l-4
        ${isActive
          ? "bg-blue-50 text-blue-700 border-l-blue-600"
          : "text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#1A1D21] border-l-transparent"
        }
      `}
      onClick={onClick}
    >
      <span className={`
        transition-colors duration-150
        ${isActive ? "text-blue-600" : "text-[#9AA0A6] group-hover:text-[#5F6368]"}
      `}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>

      {count !== undefined && (
        <span className={`
          ml-auto text-xs font-medium
          ${isActive ? "text-blue-600" : "text-[#9AA0A6]"}
        `}>
          {count}
        </span>
      )}
    </div>
  );
}