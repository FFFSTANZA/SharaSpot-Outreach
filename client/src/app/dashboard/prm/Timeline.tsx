"use client";

import { useMemo } from "react";
import { 
  Mail, Eye, MousePointer2, MessageSquare, 
  AlertCircle, Tag as TagIcon, PlusCircle, 
  UserPlus, CheckCircle2, Calendar
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
    return format(date, `EEEE, MMMM d${yearFormat}`);
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
    <div className="flex flex-col">
      {groupedActivities.map(([date, items]) => (
        <div key={date} className="relative">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-y border-gray-100 px-6 py-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              {getDateLabel(date)}
            </h4>
          </div>

          {/* Activity Items */}
          <div className="divide-y divide-gray-50">
            {items.map((activity, idx) => {
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
                  className="group flex items-start gap-4 px-6 py-4 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="text-[11px] font-bold text-gray-400 w-12 pt-1 shrink-0">
                    {format(parseISO(activity.createdAt), "HH:mm")}
                  </div>
                  
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                    config.bg,
                    config.color
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {config.label}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                      {Object.entries(activity.metadata || {}).map(([key, value]) => (
                        <span 
                          key={key} 
                          className="text-[10px] text-gray-500 bg-white border border-gray-100 px-1.5 py-0.5 rounded font-medium"
                        >
                          <span className="opacity-50 font-normal">{key}:</span> {String(value)}
                        </span>
                      ))}
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
