interface SidebarItemProps {
  label: string;
  count?: number;
  isActive?: boolean;
  icon?: React.ReactNode;
  onClick: React.MouseEventHandler;
}

/**
 * SidebarItem - Professional navigation item.
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
        group flex items-center gap-3 px-4 py-2.5 rounded-xl 
        text-sm font-medium cursor-pointer transition-all duration-200
        ${isActive
          ? "bg-brand-light text-brand"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }
      `}
      onClick={onClick}
    >
      <span className={`
        transition-colors duration-200
        ${isActive ? "text-brand" : "text-gray-400 group-hover:text-gray-600"}
      `}>
        {icon}
      </span>
      <span>{label}</span>

      {count !== undefined && (
        <span className={`
          ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full
          ${isActive ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-500"}
        `}>
          {count}
        </span>
      )}
    </div>
  );
}
