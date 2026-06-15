"use client";

import React from "react";
import { MessageCircle, Mail, ExternalLink, ArrowRight, ShieldCheck, Clock3 } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";

export default function Support() {
    return (
        <section id="support" className="py-16 sm:py-20 lg:py-32 bg-[#f9fbfd] relative overflow-hidden border-t border-border-light">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,166,62,0.08),transparent_38%),radial-gradient(circle_at_85%_35%,rgba(37,99,235,0.07),transparent_42%)]" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
                <div className="rounded-[32px] sm:rounded-[36px] border border-border-light bg-white/80 backdrop-blur-sm p-5 sm:p-7 lg:p-12 shadow-[0_25px_90px_-45px_rgba(15,23,42,0.35)] overflow-hidden relative">
                    <div className="absolute -top-20 -right-10 opacity-[0.06] rotate-12 hidden sm:block">
                        <MessageCircle size={280} className="text-brand" />
                    </div>

                    <div className="relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/[0.06] border border-brand/15 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-7">
                                We're here to help
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-text-primary tracking-tighter leading-[1.08] mb-5 sm:mb-6">
                                Support that feels <br /><span className="text-brand">calm, fast, and personal.</span>
                            </h2>
                            <p className="text-text-secondary text-base lg:text-lg font-medium leading-relaxed mb-10 max-w-lg">
                                Whether you need setup help, deliverability guidance, or campaign strategy advice, our team responds with practical answers you can act on immediately.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                                <a
                                    href={BRAND_CONFIG.supportUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-brand text-white text-sm font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 group"
                                >
                                    Contact Support
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <a
                                    href="/guide"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-text-secondary bg-white border border-border-light text-sm font-bold px-6 py-4 rounded-2xl hover:border-brand/25 hover:text-brand transition-all"
                                >
                                    Explore Guide
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border-light">
                                    <Clock3 size={13} className="text-brand" /> Avg response under 4h
                                </span>
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border-light">
                                    <ShieldCheck size={13} className="text-brand" /> Human-first support
                                </span>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-border-light bg-white/85 backdrop-blur-sm p-6 lg:p-7 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-5">Support experience</p>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-border-light bg-[#F8F9FA]/80 p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-sm">
                                            <Mail className="text-brand" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-text-primary">Direct support channel</p>
                                            <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Ticket + email updates</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary leading-relaxed">Get structured responses with exact next steps for setup, technical fixes, and campaign execution.</p>
                                </div>

                                <div className="rounded-2xl border border-border-light bg-[#F8F9FA]/80 p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center shadow-sm">
                                            <ExternalLink className="text-blue-600" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-text-primary">Knowledge base</p>
                                            <p className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Playbooks + troubleshooting</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary leading-relaxed">Use concise docs with examples so your team can resolve common questions quickly without waiting.</p>
                                </div>

                                <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] p-4">
                                    <p className="text-[11px] font-black text-brand uppercase tracking-wider mb-1">Trust signal</p>
                                    <p className="text-sm text-text-primary font-semibold leading-relaxed">Teams rely on SharaSpot support during active outreach cycles because answers are fast, specific, and outcome-focused.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
