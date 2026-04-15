"use client";

import { Contact } from "@/types";
import { format } from "date-fns";
import { Mail, Building, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactRowProps {
  contact: Contact;
  isActive?: boolean;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export function ContactRow({ contact, isActive, isSelected, onSelect, onClick }: ContactRowProps) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "REPLIED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "CONTACTED": return "bg-blue-50 text-blue-700 border-blue-100";
      case "BOUNCED": return "bg-red-50 text-red-700 border-red-100";
      case "UNSUBSCRIBED": return "bg-gray-100 text-gray-600 border-gray-200";
      case "LEAD": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "CHURNED": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  const name = contact.firstName || contact.lastName 
    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
    : "Unnamed Contact";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 px-4 py-4 cursor-pointer transition-all border-l-4",
        isActive 
          ? "bg-blue-50/50 border-blue-600 shadow-inner" 
          : isSelected 
            ? "bg-blue-50/30 border-blue-400"
            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
      )}
    >
      <div 
        className="shrink-0 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(e);
        }}
      >
        <div className={cn(
          "h-5 w-5 rounded border flex items-center justify-center transition-all",
          isSelected 
            ? "bg-blue-600 border-blue-600 text-white" 
            : "border-gray-300 bg-white group-hover:border-gray-400"
        )}>
          {isSelected && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all shadow-sm",
        isActive ? "bg-blue-600 text-white" : isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
      )}>
        {name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className={cn(
            "text-sm font-bold truncate transition-colors",
            isActive ? "text-blue-900" : "text-gray-900 group-hover:text-blue-600"
          )}>
            {name}
          </h3>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap",
            getStageColor(contact.stage)
          )}>
            {contact.stage}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1 truncate max-w-[120px]">
            <Mail className="h-3 w-3 opacity-50" />
            <span className="truncate">{contact.email}</span>
          </div>
          {contact.company && (
            <div className="flex items-center gap-1 truncate border-l border-gray-100 pl-3">
              <span className="truncate opacity-80">{contact.company}</span>
            </div>
          )}
        </div>
      </div>

      {!isActive && (
        <div className={cn(
          "shrink-0 transition-all",
          "text-gray-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        )}>
          <ChevronRight className="h-4 w-4" />
        </div>
      )}

      {contact.tags && contact.tags.length > 0 && (
        <div className="absolute top-0 right-0 p-1 flex gap-1">
          {contact.tags.slice(0, 3).map(tag => (
            <div 
              key={tag.id} 
              className="h-1.5 w-1.5 rounded-full shadow-sm" 
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
