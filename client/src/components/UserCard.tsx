import Image from "next/image";

interface SidebarProfileProps {
  name: string;
  email: string;
  avatarUrl: string;
}

export function UserCard({ name, email, avatarUrl }: SidebarProfileProps) {
  return (
    <div className="flex items-center gap-3 px-1 py-1">
      <div className="shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
            width={36}
            height={36}
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <span className="text-sm font-medium text-gray-500">{name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">{email}</p>
      </div>
    </div>
  );
}