"use client";

import { useState, useEffect, useCallback } from "react";
import { analyzeSpamScore, type SpamAnalysisResult } from "@/lib/apis";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, XCircle, Shield, RefreshCw, Info } from "lucide-react";

interface SpamPreviewProps {
  subject: string;
  body: string;
  html?: string;
  className?: string;
}

export function SpamPreview({
  subject,
  body,
  html,
  className,
}: SpamPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SpamAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkSpam = useCallback(async () => {
    if (!subject && !body) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await analyzeSpamScore(subject, body, html);
      setResult(res);
    } catch (err: any) {
      console.error("Spam check error:", err);
      setError(err.message || "Failed to check spam score");
    } finally {
      setIsLoading(false);
    }
  }, [subject, body, html]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSpam();
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [checkSpam]);

  const getLevelColor = (level: SpamAnalysisResult["level"]) => {
    switch (level) {
      case "safe":
        return "text-[#34A853] bg-[#E8F8ED] border-[#34A853]";
      case "warning":
        return "text-[#F9AB00] bg-[#FEF7E0] border-[#F9AB00]";
      case "high_risk":
        return "text-[#EA4335] bg-[#FCE8E7] border-[#EA4335]";
      case "very_high_risk":
        return "text-[#EA4335] bg-[#FCE8E7] border-[#EA4335]";
      default:
        return "text-gray-500 bg-gray-100 border-gray-300";
    }
  };

  const getLevelIcon = (level: SpamAnalysisResult["level"]) => {
    switch (level) {
      case "safe":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 20) return "#34A853"; // Green
    if (score < 40) return "#F9AB00"; // Yellow
    return "#EA4335"; // Red
  };

  if (error) {
    return (
      <div className={cn("p-3 rounded-lg bg-red-50 border border-red-200", className)}>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b",
          result ? getLevelColor(result.level) : "bg-gray-50 border-gray-200"
        )}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">Spam Score</span>
        </div>

        {/* Score display */}
        {result && (
          <div
            className="flex items-center gap-2"
            style={{ color: getScoreColor(result.score) }}
          >
            <div className="relative h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full rounded-full transition-all duration-300"
                style={{
                  width: `${result.score}%`,
                  backgroundColor: getScoreColor(result.score),
                }}
              />
            </div>
            <span className="text-sm font-bold">{result.score}</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-xs text-gray-500">Analyzing...</span>
        </div>
      ) : result ? (
        <div className="bg-white">
          {/* Level badge */}
          <div className={cn("flex items-center gap-1.5 px-3 py-2 text-xs", getLevelColor(result.level))}>
            {getLevelIcon(result.level)}
            <span className="font-medium capitalize">
              {result.level.replace("_", " ")}
            </span>
          </div>

          {/* Check results */}
          <div className="px-3 py-2 space-y-1.5">
            {result.checks
              .filter((c) => c.penalty > 0)
              .slice(0, 4)
              .map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs"
                >
                  {check.passed ? (
                    <CheckCircle className="h-3 w-3 text-[#34A853] mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-[#EA4335] mt-0.5 shrink-0" />
                  )}
                  <span
                    className={check.passed ? "text-gray-600" : "text-[#EA4335]"}
                  >
                    {check.details}
                  </span>
                </div>
              ))}
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="flex items-center gap-1 mb-1.5">
                <Info className="h-3 w-3 text-[#4285F4]" />
                <span className="text-xs font-medium text-[#4285F4]">
                  Suggestions
                </span>
              </div>
              <ul className="space-y-1">
                {result.suggestions.slice(0, 3).map((s, idx) => (
                  <li key={idx} className="text-xs text-gray-600 list-disc list-inside">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}