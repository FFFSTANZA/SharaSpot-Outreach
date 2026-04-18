"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CalendlyButton } from "@/components/CalendlyButton";
import { verifyCalendlyLink } from "@/lib/apis";
import { Calendar, Check, ExternalLink, Info, AlertCircle } from "lucide-react";
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
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
              <p className="text-sm text-text-secondary mt-2">
                System preferences and integrations
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
                      <Calendar className="h-6 w-6 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Calendly Integration</h2>
                      <p className="text-xs text-text-secondary">
                        Automate meeting bookings in your outreach
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="flex items-start gap-4 p-5 bg-brand-light/30 rounded-xl border border-brand/10">
                    <Info className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                    <div className="text-sm text-gray-700 leading-relaxed font-medium">
                      <p className="font-bold text-gray-900 mb-1">How it works</p>
                      <p>
                        Linking your Calendly account allows you to insert dynamic booking buttons into your campaign templates. This significantly improves conversion rates by reducing friction for interested recruiters.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      <span className="ms-4 text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">Enable Calendly Integration</span>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
                        Calendly Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium">calendly.com/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings({ ...settings, username: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="your-handle"
                          className="w-full pl-[110px] pr-4 h-11 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all font-medium text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
                        Event Type Slug <span className="text-gray-400">(Optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium">/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.eventType}
                          onChange={(e) => setSettings({ ...settings, eventType: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="30min-discovery"
                          className="w-full pl-8 pr-4 h-11 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand transition-all font-medium text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {verificationResult && (
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl text-xs font-semibold transition-all animate-fadeIn",
                        verificationResult.valid
                          ? "bg-brand-light text-brand border border-brand/10"
                          : "bg-red-50 text-red-700 border border-red-100"
                      )}
                    >
                      {verificationResult.valid ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <span>{verificationResult.message}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleVerify}
                      disabled={!settings.username || isVerifying}
                      className="px-6 h-10 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isVerifying ? "Verifying..." : "Verify Link"}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!settings.username || isSaving}
                      className="px-6 h-10 text-xs font-bold text-white bg-brand rounded-xl hover:bg-brand-hover disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                      {isSaving ? "Saving..." : saveSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Settings Saved
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {settings.username && settings.enabled && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all animate-fadeIn">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">Interactive Preview</h2>
                    <p className="text-xs text-text-secondary">
                      How your booking button will appear in emails
                    </p>
                  </div>
                  <div className="p-12 flex flex-col items-center">
                    <CalendlyButton
                      username={settings.username}
                      eventType={settings.eventType || undefined}
                      buttonText="Book a Discovery Call"
                    />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8">
                  <a
                    href="https://calendly.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-brand/30 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <Calendar className="h-6 w-6 text-brand" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">Need an account?</span>
                        <span className="text-xs text-text-secondary mt-1 block">Setup Calendly in 60 seconds</span>
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-300 group-hover:text-brand transition-all" />
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
