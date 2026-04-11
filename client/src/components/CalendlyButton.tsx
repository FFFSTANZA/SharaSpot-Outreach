"use client";

import { useState, useEffect } from "react";
import { generateCalendlyLink, type CalendlyGenerateResult } from "@/lib/apis";
import { cn } from "@/lib/utils";
import { Calendar, Link, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";

interface CalendlyButtonProps {
  username: string;
  eventType?: string;
  config?: {
    name?: string;
    email?: string;
    company?: string;
  };
  variant?: "button" | "link";
  buttonText?: string;
  className?: string;
}

export function CalendlyButton({
  username,
  eventType,
  config,
  variant = "button",
  buttonText = "Book a Time",
  className,
}: CalendlyButtonProps) {
  const [linkData, setLinkData] = useState<CalendlyGenerateResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLink = async () => {
      if (!username) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await generateCalendlyLink({
          username,
          eventType,
          prefill: config,
        });
        setLinkData(res);
      } catch (err: any) {
        console.error("Calendly link error:", err);
        setError(err.message || "Failed to generate link");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLink();
  }, [username, eventType, config?.name, config?.email, config?.company]);

  const handleCopy = async () => {
    if (!linkData?.url) return;

    try {
      await navigator.clipboard.writeText(linkData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  if (!username) {
    return (
      <div className={cn("p-3 rounded-lg bg-gray-50 border border-gray-200 text-center", className)}>
        <p className="text-xs text-gray-500">
          Set your Calendly username in settings to enable booking
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("p-3 rounded-lg bg-gray-50 text-center", className)}>
        <Calendar className="h-4 w-4 animate-pulse mx-auto text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-3 rounded-lg bg-red-50 border border-red-200", className)}>
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {variant === "button" && linkData?.button?.html ? (
        <div dangerouslySetInnerHTML={{ __html: linkData.button.html }} />
      ) : (
        <a
          href={linkData?.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium",
            "bg-[#00A63E] text-white hover:bg-[#009134] transition-colors"
          )}
        >
          <Calendar className="h-4 w-4" />
          {buttonText}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      )}

      {/* URL Display & Copy */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 text-xs text-gray-600 overflow-hidden">
          <Link className="h-3 w-3 shrink-0 text-gray-400" />
          <span className="truncate">{linkData?.url}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Copy link"
        >
          {copied ? (
            <Check className="h-3 w-3 text-[#34A853]" />
          ) : (
            <Copy className="h-3 w-3 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline version for showing in template previews
 */
export function CalendlyInlineBadge({ username }: { username: string }) {
  if (!username) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#006BFF]/10 text-[#006BFF] text-xs font-medium">
      <Calendar className="h-3 w-3" />
      Calendly
    </span>
  );
}