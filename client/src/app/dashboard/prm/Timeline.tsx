"use client";

import { useMemo } from "react";
import { 
  Mail, Eye, MousePointer2, MessageSquare, 
  AlertCircle, Tag as TagIcon, PlusCircle, 
  UserPlus, CheckCircle2, Calendar, Clock,
  ChevronRight
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
    <div className="flex flex-col space-y-8">
      {groupedActivities.map(([date, items]) => (
        <div key={date} className="relative">
          {/* Date Section Header - Google Calendar Style */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 shrink-0 flex flex-col items-center">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-0.5">{format(parseISO(date), "EEE")}</span>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors",
                isToday(parseISO(date)) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
              )}>
                {format(parseISO(date), "d")}
              </div>
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">{getDateLabel(date)}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              
              {/* Agenda items for this day */}
              <div className="mt-4 space-y-3">
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
                      className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all cursor-default border border-transparent hover:border-gray-100"
                    >
                      <div className="w-12 pt-0.5 shrink-0 text-right">
                        <span className="text-[10px] font-bold text-gray-400">
                          {format(parseISO(activity.createdAt), "h:mm a")}
                        </span>
                      </div>
                      
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white",
                        config.bg,
                        config.color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">{config.label}</span>
                          <div className="mt-1">
                            {activity.type === "STAGE_CHANGED" ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 line-through">{activity.metadata?.from}</span>
                                <ChevronRight className="h-3 w-3 text-gray-300" />
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-tighter">
                                  {activity.metadata?.to}
                                </span>
                              </div>
                            ) : activity.type === "CAMPAIGN_ENROLLED" ? (
                              <p className="text-[11px] text-gray-500 leading-relaxed italic">
                                "{activity.metadata?.subject}"
                              </p>
                            ) : activity.type === "NOTE_ADDED" ? (
                              <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 mt-1">
                                {activity.metadata?.content || "Note content unavailable"}
                              </p>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">
                                {Object.values(activity.metadata || {}).find(v => typeof v === 'string' && v.length < 100) as string}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
