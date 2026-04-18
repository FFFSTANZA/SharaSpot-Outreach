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
        <div className="min-h-screen bg-gray-50/50">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your Calendly integration and preferences
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Calendly Integration</h2>
                      <p className="text-xs text-gray-500 font-medium">
                        Enable meeting booking links in your email templates
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-bold mb-1">How it works</p>
                      <p className="text-blue-700 font-medium">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      <span className="ms-3 text-sm font-bold text-gray-700">Enable Calendly Integration</span>
                    </label>
                  </div>

                  <div className="grid gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        Calendly Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium">calendly.com/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings({ ...settings, username: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="your-username"
                          className="w-full pl-[105px] pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-medium"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">
                        Your Calendly username (e.g., your-name or company-name)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                        Event Type <span className="text-gray-300 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium">/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.eventType}
                          onChange={(e) => setSettings({ ...settings, eventType: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="30min"
                          className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-medium"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-1">
                        Specific event type slug (e.g., 30min, 15min, discovery-call)
                      </p>
                    </div>
                  </div>

                  {verificationResult && (
                    <div
                      className={cn(
                        "flex items-center gap-2 p-4 rounded-xl text-sm font-medium",
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
                      className="px-6 h-11 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {isVerifying ? "Verifying..." : "Verify Link"}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!settings.username || isSaving}
                      className="px-6 h-11 text-sm font-bold text-white bg-brand rounded-xl hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-brand/10"
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
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-base font-bold text-gray-900">Preview</h2>
                    <p className="text-xs text-gray-500 font-medium">
                      See how your Calendly booking button will appear in emails
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

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Quick Links</h2>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <a
                    href="https://calendly.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Create a Calendly Account</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
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
