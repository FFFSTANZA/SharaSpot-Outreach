"use client";

import { Contact } from "@/types";
import { Mail, Building, ChevronRight, Briefcase } from "lucide-react";
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
      case "REPLIED": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "CONTACTED": return "text-blue-600 bg-blue-50 border-blue-100";
      case "BOUNCED": return "text-red-600 bg-red-50 border-red-100";
      case "UNSUBSCRIBED": return "text-gray-600 bg-gray-100 border-gray-200";
      case "LEAD": return "text-indigo-600 bg-indigo-50 border-indigo-100";
      default: return "text-gray-500 bg-gray-50 border-gray-100";
    }
  };

  const name = contact.firstName || contact.lastName 
    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
    : "Unnamed Contact";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative mx-2 mb-1 p-3 rounded-xl cursor-pointer transition-all duration-200 border",
        isActive 
          ? "bg-white border-blue-200 shadow-md shadow-blue-50 ring-1 ring-blue-50" 
          : isSelected 
            ? "bg-blue-50/50 border-blue-100"
            : "bg-transparent border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox or Avatar */}
        <div className="flex flex-col items-center gap-2">
           <div 
            className="shrink-0 relative"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(e);
            }}
          >
            <div className={cn(
              "h-4 w-4 rounded border flex items-center justify-center transition-all",
              isSelected 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "border-gray-300 bg-white group-hover:border-gray-400"
            )}>
              {isSelected && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all shadow-sm border-2 border-white",
            isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
          )}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={cn(
              "text-sm font-bold truncate transition-colors",
              isActive ? "text-blue-900" : "text-gray-900"
            )}>
              {name}
            </h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border",
              getStageColor(contact.stage)
            )}>
              {contact.stage}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Mail className="h-3 w-3 opacity-40 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
            {(contact.company || contact.jobTitle) && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Building className="h-3 w-3 opacity-40 shrink-0" />
                <span className="truncate">
                  {contact.jobTitle && contact.company 
                    ? `${contact.jobTitle} at ${contact.company}`
                    : contact.jobTitle || contact.company}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "shrink-0 self-center transition-all",
          isActive ? "text-blue-600" : "text-gray-300 opacity-0 group-hover:opacity-100"
        )}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {contact.tags && contact.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {contact.tags.slice(0, 3).map(tag => (
            <div 
              key={tag.id} 
              className="h-1 w-4 rounded-full" 
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
