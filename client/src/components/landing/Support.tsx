"use client";

import React from "react";
import { MessageCircle, Mail, ExternalLink, ArrowRight } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";

export default function Support() {
    return (
        <section id="support" className="py-24 lg:py-32 bg-[#fcfcfc] relative overflow-hidden border-t border-slate-100">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/[0.03] blur-[100px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="bg-white border border-border-light rounded-[40px] p-8 lg:p-16 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                        <MessageCircle size={320} className="text-brand" />
                    </div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/[0.05] border border-brand/10 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                                We're here to help
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-text-primary tracking-tighter leading-tight mb-6">
                                Support powered by <br /><span className="text-brand text-gradient">real humans.</span>
                            </h2>
                            <p className="text-text-secondary text-lg font-medium leading-relaxed mb-10 max-w-lg">
                                Have a question about your account, technical setup, or best practices for outreach? Our team is standing by to ensure you succeed.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <a
                                    href={BRAND_CONFIG.supportUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-brand text-white text-sm font-black uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 group"
                                >
                                    Open Support Ticket
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-[#f8f9fa] p-8 rounded-[32px] border border-slate-100/50">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                    <Mail className="text-brand" size={24} />
                                </div>
                                <h3 className="font-black text-text-primary uppercase tracking-tight mb-2">Direct Contact</h3>
                                <p className="text-sm text-text-muted leading-relaxed">Average response time under 4 hours for premium members.</p>
                            </div>

                            <div className="bg-[#f8f9fa] p-8 rounded-[32px] border border-slate-100/50">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                                    <ExternalLink className="text-brand" size={24} />
                                </div>
                                <h3 className="font-black text-text-primary uppercase tracking-tight mb-2">Knowledge Base</h3>
                                <p className="text-sm text-text-muted leading-relaxed">Check our detailed guide for instant answers to common questions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
