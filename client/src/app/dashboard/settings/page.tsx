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
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Settings</h1>
              <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.3em]">
                System preferences and integrations
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden transition-all">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center shadow-sm">
                      <Calendar className="h-6 w-6 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Calendly Integration</h2>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                        Automate meeting bookings in your outreach
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="flex items-start gap-4 p-5 bg-brand-light/30 rounded-2xl border border-brand/10">
                    <Info className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                    <div className="text-xs text-gray-700 leading-relaxed font-medium">
                      <p className="font-black text-gray-900 uppercase tracking-widest mb-1.5">Integration logic</p>
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
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand shadow-inner"></div>
                      <span className="ms-4 text-xs font-black text-gray-900 uppercase tracking-widest group-hover:text-brand transition-colors">Enable Calendly Integration</span>
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                        Calendly Username <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                          <span className="text-gray-300 text-sm font-black">calendly.com/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => setSettings({ ...settings, username: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="your-handle"
                          className="w-full pl-[115px] pr-5 py-4 text-sm bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                        Event Type Slug <span className="text-gray-300">(Optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                          <span className="text-gray-300 text-sm font-black">/</span>
                        </div>
                        <input
                          type="text"
                          value={settings.eventType}
                          onChange={(e) => setSettings({ ...settings, eventType: e.target.value.replace(/[^a-zA-Z0-9-]/g, "") })}
                          placeholder="30min-discovery"
                          className="w-full pl-8 pr-5 py-4 text-sm bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {verificationResult && (
                    <div
                      className={cn(
                        "flex items-center gap-3 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all animate-in zoom-in-95",
                        verificationResult.valid
                          ? "bg-brand-light/50 text-brand border border-brand/20"
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

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={handleVerify}
                      disabled={!settings.username || isVerifying}
                      className="px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isVerifying ? "Processing..." : "Verify Integration"}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!settings.username || isSaving}
                      className="px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-brand rounded-2xl hover:bg-brand-hover disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-brand/20"
                    >
                      {isSaving ? "Saving..." : saveSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Success
                        </>
                      ) : (
                        "Persist Settings"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {settings.username && settings.enabled && (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden transition-all animate-in slide-in-from-bottom-4 duration-500">
                  <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Interactive Preview</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                      Visualized booking button for outgoing communications
                    </p>
                  </div>
                  <div className="p-10 flex justify-center">
                    <div className="max-w-sm w-full p-8 border border-gray-100 rounded-[2rem] bg-gray-50/30 shadow-inner flex flex-col items-center">
                      <CalendlyButton
                        username={settings.username}
                        eventType={settings.eventType || undefined}
                        buttonText="Book a Discovery Call"
                      />
                      <p className="mt-4 text-[9px] font-black text-gray-300 uppercase tracking-widest">Live rendering engine</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8">
                  <a
                    href="https://calendly.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 rounded-3xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-brand/20 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-[1.25rem] bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Calendar className="h-7 w-7 text-brand" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest block">Need an account?</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 block">Setup Calendly in 60 seconds</span>
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-300 group-hover:text-brand transition-all group-hover:translate-x-1" />
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
