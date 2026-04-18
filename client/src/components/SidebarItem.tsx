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
        group flex items-center gap-3 px-3 py-2.5 rounded-xl 
        text-sm font-bold cursor-pointer transition-all duration-150
        border-l-4
        ${isActive
          ? "bg-brand-light text-brand border-l-brand"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-transparent"
        }
      `}
      onClick={onClick}
    >
      <span className={`
        transition-colors duration-150
        ${isActive ? "text-brand" : "text-gray-400 group-hover:text-gray-600"}
      `}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>

      {count !== undefined && (
        <span className={`
          ml-auto text-xs font-bold
          ${isActive ? "text-brand" : "text-gray-400"}
        `}>
          {count}
        </span>
      )}
    </div>
  );
}