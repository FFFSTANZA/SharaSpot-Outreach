"use client";

import { Contact } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ContactRowProps {
  contact: Contact;
  onClick: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  LEAD: "bg-blue-50 text-blue-700 border-blue-100",
  CONTACTED: "bg-yellow-50 text-yellow-700 border-yellow-100",
  REPLIED: "bg-green-50 text-green-700 border-green-100",
  BOUNCED: "bg-red-50 text-red-700 border-red-100",
  UNSUBSCRIBED: "bg-gray-50 text-gray-700 border-gray-100",
};

export function ContactRow({ contact, onClick }: ContactRowProps) {
  const name = contact.firstName || contact.lastName 
    ? \`\${contact.firstName || ""} \${contact.lastName || ""}\`.trim()
    : contact.email.split("@")[0];

  return (
    <tr 
      className="hover:bg-[#F1F3F4] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#E8F5E9] text-[#00A63E] flex items-center justify-center font-bold text-sm shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1D21] truncate">{name}</p>
            <p className="text-xs text-[#5F6368] truncate">{contact.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="min-w-0">
          <p className="text-sm text-[#3C4043] truncate">{contact.company || "-"}</p>
          <p className="text-xs text-[#5F6368] truncate">{contact.jobTitle || ""}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
          STAGE_COLORS[contact.stage] || "bg-gray-50 text-gray-700 border-gray-100"
        )}>
          {contact.stage}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {contact.tags?.slice(0, 2).map(tag => (
            <span 
              key={tag.id}
              className="px-2 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {contact.tags && contact.tags.length > 2 && (
            <span className="text-[10px] text-[#5F6368] font-medium">
              +\{contact.tags.length - 2\}
            </span>
          )}
          {(!contact.tags || contact.tags.length === 0) && (
            <span className="text-xs text-[#DADCE0]">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <span className="text-xs text-[#5F6368]">
          {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}
        </span>
      </td>
    </tr>
  );
}
