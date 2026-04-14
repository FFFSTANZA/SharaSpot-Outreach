"use client";

import { useEffect, useState } from "react";
import { getSequenceTimeline } from "@/lib/apis";
import { format } from "date-fns";
import { Clock, CheckCircle2, AlertCircle, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface SequenceTimelineProps {
  campaignId: string;
}

export default function SequenceTimeline({ campaignId }: SequenceTimelineProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSequenceTimeline(campaignId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [campaignId]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading timeline...</div>;
  if (!data) return null;

  const { recipients, steps, overrides } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-bold text-gray-700">Recipient Journey Timeline</h3>
        <div className="flex gap-4 text-[10px] text-gray-400 font-medium">
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500" /> Sent</div>
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Scheduled</div>
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-gray-300" /> Pending</div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-flex min-w-full flex-col gap-4 px-4">
          {recipients.map((recipient: any, rIdx: number) => (
            <div key={rIdx} className="flex items-center gap-4 group">
              <div className="w-48 shrink-0">
                <p className="text-[11px] font-semibold text-gray-700 truncate">{recipient.recipientEmail}</p>
                <p className="text-[9px] text-gray-400">Current: Step {recipient.currentStep + 1}</p>
              </div>

              <div className="flex items-center gap-1 flex-1">
                {steps.map((step: any, sIdx: number) => {
                  const status = recipient.stepStatuses[sIdx];
                  const override = overrides.find((o: any) => 
                    o.recipientEmail === recipient.recipientEmail && o.stepNumber === sIdx
                  );

                  let colorClass = "bg-gray-100";
                  let Icon = Clock;
                  
                  if (status?.status === "SENT") {
                    colorClass = "bg-green-500 text-white";
                    Icon = CheckCircle2;
                  } else if (status?.status === "SCHEDULED" || status?.status === "PENDING") {
                    if (sIdx === recipient.currentStep + (status?.status === "SENT" ? 1 : 0)) {
                      colorClass = "bg-blue-500 text-white";
                      Icon = Play;
                    }
                  } else if (status?.status?.startsWith("SKIPPED")) {
                    colorClass = "bg-gray-200 text-gray-400";
                    Icon = SkipForward;
                  } else if (status?.status === "FAILED") {
                    colorClass = "bg-red-500 text-white";
                    Icon = AlertCircle;
                  }

                  return (
                    <div key={sIdx} className="flex items-center gap-1">
                      <div 
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center relative group/step",
                          colorClass
                        )}
                        title={`Step ${sIdx + 1}: ${status?.status || "PENDING"}`}
                      >
                        <Icon className="h-4 w-4" />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] rounded opacity-0 group-hover/step:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                          Step {sIdx + 1}: {status?.status || "WAITING"}
                          {status?.sentAt && ` · Sent ${format(new Date(status.sentAt), "MMM d, HH:mm")}`}
                          {override?.scheduledAt && ` · Scheduled for ${format(new Date(override.scheduledAt), "MMM d, HH:mm")}`}
                        </div>
                      </div>
                      {sIdx < steps.length - 1 && (
                        <div className={cn("h-0.5 w-6", sIdx < recipient.currentStep ? "bg-green-200" : "bg-gray-100")} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
