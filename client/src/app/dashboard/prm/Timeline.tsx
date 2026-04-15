"use client";

import { useMemo } from "react";
import { 
  Mail, Eye, MousePointer2, MessageSquare, 
  AlertCircle, Tag as TagIcon, PlusCircle, 
  UserPlus, CheckCircle2, Calendar, Clock
} from "lucide-react";
import { format, isToday, isYesterday, isSameYear, parseISO, startOfDay } from "date-fns";
import type { ContactActivity, ActivityType } from "@/types";
import { cn } from "@/lib/utils";

interface TimelineProps {
  activities: ContactActivity[];
}

const ACTIVITY_CONFIG: Record<ActivityType, { icon: any; color: string; bg: string; label: string }> = {
  CAMPAIGN_ENROLLED: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50", label: "Enrolled in Campaign" },
  EMAIL_SENT: { icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50", label: "Email Sent" },
  EMAIL_OPENED: { icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50", label: "Email Opened" },
  EMAIL_CLICKED: { icon: MousePointer2, color: "text-amber-600", bg: "bg-amber-50", label: "Link Clicked" },
  EMAIL_REPLIED: { icon: MessageSquare, color: "text-fuchsia-600", bg: "bg-fuchsia-50", label: "Replied to Email" },
  EMAIL_FAILED: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Email Failed" },
  NOTE_ADDED: { icon: PlusCircle, color: "text-slate-600", bg: "bg-slate-50", label: "Note Added" },
  STAGE_CHANGED: { icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50", label: "Stage Changed" },
};

export function Timeline({ activities }: TimelineProps) {
  const groupedActivities = useMemo(() => {
    const sorted = [...activities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const groups: { [key: string]: ContactActivity[] } = {};
    
    sorted.forEach(activity => {
      const date = format(startOfDay(parseISO(activity.createdAt)), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [activities]);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    
    const yearFormat = isSameYear(date, new Date()) ? "" : ", yyyy";
    return format(date, `MMM d${yearFormat}`);
  };

  const getDayName = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "";
    if (isYesterday(date)) return "";
    return format(date, "EEEE");
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-gray-200" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">No activity yet</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
          Engagement and status changes will appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {groupedActivities.map(([date, items]) => (
        <div key={date} className="relative">
          {/* Date Section Header */}
          <div className="flex items-center gap-4 mb-3 px-1">
            <div className="flex flex-col">
              <span className="text-lg font-black text-gray-900 leading-none">{getDateLabel(date)}</span>
              {getDayName(date) && (
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{getDayName(date)}</span>
              )}
            </div>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Agenda items */}
          <div className="space-y-1">
            {items.map((activity) => {
              const config = ACTIVITY_CONFIG[activity.type] || { 
                icon: AlertCircle, 
                color: "text-gray-400", 
                bg: "bg-gray-50", 
                label: activity.type 
              };
              const Icon = config.icon;

              return (
                <div 
                  key={activity.id} 
                  className="group flex items-center gap-4 p-2 rounded-xl hover:bg-gray-50 transition-all cursor-default"
                >
                  <div className="w-12 shrink-0 flex flex-col items-end">
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                      {format(parseISO(activity.createdAt), "HH:mm")}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-white",
                    config.bg,
                    config.color
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{config.label}</span>
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      {activity.type === "STAGE_CHANGED" ? (
                        <span className="text-xs text-gray-500">
                          To <span className="font-bold text-blue-600">{activity.metadata?.to}</span>
                        </span>
                      ) : activity.type === "CAMPAIGN_ENROLLED" ? (
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {activity.metadata?.subject}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 truncate">
                          {Object.values(activity.metadata || {}).find(v => typeof v === 'string' && v.length < 50) as string}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
