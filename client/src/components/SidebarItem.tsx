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
        group flex items-center gap-3 px-4 py-3 rounded-2xl 
        text-sm font-bold cursor-pointer transition-all duration-300
        ${isActive
          ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
      onClick={onClick}
    >
      <span className={`
        transition-colors duration-300
        ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}
      `}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>

      {count !== undefined && (
        <span className={`
          ml-auto text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
          ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}
        `}>
          {count}
        </span>
      )}
    </div>
  );
}