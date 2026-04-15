"use client";

import { ContactActivity } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Mail, 
  Send, 
  MousePointer2, 
  Eye, 
  Reply, 
  AlertCircle, 
  UserPlus, 
  RefreshCw,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  activities: ContactActivity[];
}

const ACTIVITY_ICONS: Record<string, any> = {
  CAMPAIGN_ENROLLED: { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
  EMAIL_SENT: { icon: Send, color: "text-[#00A63E]", bg: "bg-[#E8F5E9]" },
  EMAIL_OPENED: { icon: Eye, color: "text-purple-500", bg: "bg-purple-50" },
  EMAIL_CLICKED: { icon: MousePointer2, color: "text-orange-500", bg: "bg-orange-50" },
  EMAIL_REPLIED: { icon: Reply, color: "text-[#00A63E]", bg: "bg-[#E8F5E9]" },
  EMAIL_FAILED: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  NOTE_ADDED: { icon: FileText, color: "text-gray-500", bg: "bg-gray-100" },
  STAGE_CHANGED: { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50" },
};

export function Timeline({ activities }: TimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
        <Mail className="h-10 w-10 mb-2" />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E8EAED] before:to-transparent">
      {activities.map((activity) => {
        const config = ACTIVITY_ICONS[activity.type] || { icon: Mail, color: "text-gray-400", bg: "bg-gray-50" };
        const Icon = config.icon;

        return (
          <div key={activity.id} className="relative flex items-start group">
            <div className={cn(
              "absolute left-0 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110",
              config.bg, config.color
            )}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 ml-14 pt-0.5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                <p className="text-sm font-bold text-[#1A1D21]">
                  {formatActivityTitle(activity)}
                </p>
                <time className="text-[10px] font-semibold text-[#9AA0A6] uppercase tracking-wider">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </time>
              </div>
              
              <div className="mt-1 text-sm text-[#5F6368] bg-[#F8F9FA] p-2 rounded-lg border border-transparent hover:border-[#E8EAED] transition-all">
                {formatActivityDetails(activity)}
              </div>
              
              <div className="mt-1 text-[10px] text-[#9AA0A6] flex items-center gap-1">
                <span className="font-medium">{format(new Date(activity.createdAt), "h:mm a · MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatActivityTitle(activity: ContactActivity) {
  switch (activity.type) {
    case "CAMPAIGN_ENROLLED": return "Enrolled in Campaign";
    case "EMAIL_SENT": return "Email Sent";
    case "EMAIL_OPENED": return "Email Opened";
    case "EMAIL_CLICKED": return "Link Clicked";
    case "EMAIL_REPLIED": return "Replied to Email";
    case "EMAIL_FAILED": return "Email Failed";
    case "NOTE_ADDED": return "Note Added";
    case "STAGE_CHANGED": return "Stage Updated";
    default: return (activity.type as string).replace(/_/g, " ");
  }
}

function formatActivityDetails(activity: ContactActivity) {
  const meta = activity.metadata || {};
  
  switch (activity.type) {
    case "CAMPAIGN_ENROLLED":
      return (
        <p>Enrolled in campaign <span className="text-[#1A1D21] font-medium">"{meta.subject}"</span></p>
      );
    case "EMAIL_SENT":
      return (
        <p>Sent: <span className="text-[#1A1D21] font-medium italic">"{meta.subject}"</span></p>
      );
    case "EMAIL_OPENED":
      return (
        <p>Recipient opened the email</p>
      );
    case "EMAIL_CLICKED":
      return (
        <div className="space-y-1">
          <p>Recipient clicked a link:</p>
          <p className="text-[#00A63E] font-medium truncate">{meta.url}</p>
        </div>
      );
    case "EMAIL_REPLIED":
      return (
        <p>Recipient replied to your message!</p>
      );
    case "EMAIL_FAILED":
      return (
        <p className="text-red-500 font-medium">Error: {meta.error}</p>
      );
    case "STAGE_CHANGED":
      return (
        <p>Moved from <span className="font-bold text-[#1A1D21]">{meta.from || "LEAD"}</span> to <span className="font-bold text-[#1A1D21]">{meta.to || meta.stage}</span></p>
      );
    default:
      return null;
  }
}
