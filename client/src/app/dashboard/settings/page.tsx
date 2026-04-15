"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CalendlyButton } from "@/components/CalendlyButton";
import { verifyCalendlyLink } from "@/lib/apis";
import { Calendar, Check, ExternalLink, Link as LinkIcon, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendlySettings {
  username: string;
  eventType: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CalendlySettings>({
    username: "",
    eventType: "",
    enabled: true,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("calendly_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleVerify = async () => {
    if (!settings.username) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyCalendlyLink(
        `https://calendly.com/${settings.username}${settings.eventType ? `/${settings.eventType}` : ""}`
      );
      setVerificationResult({
        valid: result.valid,
        message: result.valid
          ? `Valid Calendly link! Username: ${result.username}`
          : "Invalid Calendly URL format",
      });
    } catch {
      setVerificationResult({
        valid: false,
        message: "Failed to verify Calendly link",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem("calendly_settings", JSON.stringify(settings));
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }, 500);
  };

  return (
    <AuthGuard>
      <ErrorBoundary>
        <div className="min-h-screen bg-[#FAFBFC]">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1A1D21]">Settings</h1>
              <p className="text-sm text-[#5F6368] mt-1">
                Manage your Calendly integration and preferences
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E8EAED] bg-[#FAFBFC]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#006BFF]/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-[#006BFF]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#1A1D21]">Calendly Integration</h2>
                      <p className="text-xs text-[#5F6368]">
                        Enable meeting booking links in your email templates
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How it works</p>
                      <p className="text-blue-700">
                        Add your Calendly username below. When composing emails, you can insert a booking link that recipients can use to schedule meetings directly.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00A63E]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A63E]"></div>
                      <span className="ms-3 text-sm font-medium text-[#1A1D21]">Enable Calendly</span>
                    </label>
                  </div>

                  <div className="grid gap-5">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1D21] mb-1.5">
                        Calendly Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-[#5F6368] text-sm">calendly.com/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings({ ...settings, username: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="your-username"
                          className="w-full pl-[95px] pr-4 py-2.5 text-sm border border-[#DADCE0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/30 focus:border-[#00A63E] transition-all"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-[#5F6368]">
                        Your Calendly username (e.g., your-name or company-name)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1A1D21] mb-1.5">
                        Event Type <span className="text-[#9AA0A6] font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-[#5F6368] text-sm">/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.eventType}
                          onChange={(e) => setSettings({ ...settings, eventType: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="30min"
                          className="w-full pl-8 pr-4 py-2.5 text-sm border border-[#DADCE0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/30 focus:border-[#00A63E] transition-all"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-[#5F6368]">
                        Specific event type slug (e.g., 30min, 15min, discovery-call)
                      </p>
                    </div>
                  </div>

                  {verificationResult && (
                    <div
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg text-sm",
                        verificationResult.valid
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      )}
                    >
                      {verificationResult.valid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>{verificationResult.message}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleVerify}
                      disabled={!settings.username || isVerifying}
                      className="px-4 py-2 text-sm font-medium text-[#5F6368] bg-white border border-[#DADCE0] rounded-lg hover:bg-[#F1F3F4] hover:text-[#1A1D21] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isVerifying ? "Verifying..." : "Verify Link"}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!settings.username || isSaving}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#00A63E] rounded-lg hover:bg-[#009134] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {isSaving ? "Saving..." : saveSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Saved!
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {settings.username && settings.enabled && (
                <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#E8EAED] bg-[#FAFBFC]">
                    <h2 className="text-base font-semibold text-[#1A1D21]">Preview</h2>
                    <p className="text-xs text-[#5F6368]">
                      See how your Calendly booking button will appear
                    </p>
                  </div>
                  <div className="p-6">
                    <CalendlyButton
                      username={settings.username}
                      eventType={settings.eventType || undefined}
                      buttonText="Book a Meeting"
                    />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E8EAED] bg-[#FAFBFC]">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-[#5F6368]" />
                    <div>
                      <h2 className="text-base font-semibold text-[#1A1D21]">Quick Links</h2>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <a
                    href="https://calendly.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E8EAED] hover:bg-[#F8F9FA] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-[#006BFF]" />
                      <span className="text-sm font-medium text-[#1A1D21]">Create a Calendly Account</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#9AA0A6] group-hover:text-[#5F6368] transition-colors" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </AuthGuard>
  );
}
