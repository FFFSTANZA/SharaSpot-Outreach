"use client";

import React, { useState, useEffect } from "react";
import MailAppContainer from "@/components/landing/MailAppContainer";
import BenchmarkStory from "@/components/landing/BenchmarkStory";
import {
    Zap, Shield, CheckCircle2, ArrowRight,
    Activity, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

interface BenchmarkResult {
    scenario: string;
    normalScore: number;
    priorityScore: number;
    improvement: string;
    metrics: { label: string; normal: string; priority: string }[];
}

export default function PriorityPage() {
    const router = useRouter();
    const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);

    useEffect(() => {
        setBenchmarks([
            {
                scenario: "Primary Inbox Placement",
                normalScore: 52,
                priorityScore: 96,
                improvement: "+85% inbox rate",
                metrics: [
                    { label: "Inbox Placement", normal: "52%", priority: "96%" },
                    { label: "Spam / Promo Tab", normal: "48%", priority: "4%" },
                    { label: "Delivery Confidence", normal: "Low", priority: "High" },
                ],
            },
            {
                scenario: "Congestion Resilience",
                normalScore: 15,
                priorityScore: 94,
                improvement: "+526% resilience",
                metrics: [
                    { label: "Server Adaptation", normal: "None", priority: "Real-time" },
                    { label: "Block Risk", normal: "Critical", priority: "Near-zero" },
                    { label: "Retry Intelligence", normal: "Fixed", priority: "Dynamic" },
                ],
            },
            {
                scenario: "Human-Like Behavior",
                normalScore: 10,
                priorityScore: 98,
                improvement: "+880% authenticity",
                metrics: [
                    { label: "Bot Detection Risk", normal: "High", priority: "Invisible" },
                    { label: "Pattern Variance", normal: "Fixed", priority: "Natural" },
                    { label: "ESP Trust Score", normal: "Low", priority: "Tier 1" },
                ],
            },
        ]);
    }, []);

    return (
        <MailAppContainer>
            <main>

                {/* ── HERO ── */}
                <section className="relative pt-20 pb-28 overflow-hidden bg-white border-b border-border-light">
                    {/* Architectural grid */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{ backgroundImage: "linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
                    />

                    <div className="max-w-6xl mx-auto px-6 relative">
                        <div className="flex items-center gap-2 mb-8">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border-light bg-slate-50 text-text-muted text-[10px] font-bold tracking-widest uppercase">
                                <Zap size={11} className="text-brand" fill="currentColor" /> Priority Protocol
                            </span>
                            <span className="text-text-muted text-[11px]">—</span>
                            <span className="text-text-muted text-[11px] font-medium uppercase tracking-widest">Verified April 2026</span>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h1 className="text-4xl lg:text-6xl font-bold text-text-primary tracking-tighter leading-[1] mb-8">
                                    Strategic placement for critical outreach.
                                </h1>
                                <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-lg">
                                    Priority Mail is the only infrastructure proven to reach the primary inbox at 96% across enterprise mail servers. Not the Promotions tab. <strong className="text-text-primary">The primary inbox.</strong>
                                </p>
                                <div className="flex flex-wrap gap-4 items-center mb-12">
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="bg-text-primary text-white text-[12px] font-bold uppercase tracking-widest px-8 py-4 hover:bg-slate-800 transition-all flex items-center gap-2"
                                    >
                                        Initialize Priority
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-8">
                                    {[
                                        { val: "96%", label: "Inbox rate" },
                                        { val: "50K+", label: "Decisions/sec" },
                                        { val: "< 1ms", label: "Latency" },
                                    ].map((s) => (
                                        <div key={s.label}>
                                            <p className="text-2xl font-bold text-text-primary tracking-tight">{s.val}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live pulse card */}
                            <div className="relative hidden lg:block">
                                <div className="bg-white border border-border-light shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border-light flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-brand" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Live Transmission Log</span>
                                        </div>
                                        <Activity size={14} className="text-brand" />
                                    </div>
                                    <div className="divide-y divide-border-light font-mono">
                                        {[
                                            { email: "partner@acme.com", status: "PRIMARY", time: "0.8ms" },
                                            { email: "cto@techcorp.io", status: "PRIMARY", time: "1.1ms" },
                                            { email: "founder@seed.vc", status: "PRIMARY", time: "0.6ms" },
                                            { email: "hiring@bigco.com", status: "PRIMARY", time: "1.3ms" },
                                        ].map((row, i) => (
                                            <div key={i} className="px-6 py-4 flex items-center justify-between text-[12px]">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-text-muted">{i+1}.</span>
                                                    <span className="text-text-secondary truncate">{row.email}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-brand">{row.status}</span>
                                                    <span className="text-text-muted">{row.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── BENCHMARK ── */}
                <section id="benchmark" className="py-24 bg-white border-b border-border-light">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start mb-20 gap-12">
                            <div className="max-w-2xl">
                                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Comparative Audit</p>
                                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-tight tracking-tight">Priority vs. Standard Email.</h2>
                            </div>
                            <div className="border border-border-light p-6 bg-slate-50 max-w-sm">
                                <p className="font-bold text-text-primary text-[11px] uppercase tracking-widest mb-3">Methodology</p>
                                <p className="text-sm text-text-secondary leading-relaxed">80 recipient domains. 10,000 emails. Controlled sends at equal volume, content, and cadence. Variable: Infrastructure only.</p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-px bg-border-light border border-border-light">
                            {benchmarks.map((res, i) => (
                                <div key={i} className="bg-white p-8 group">
                                    <div className="mb-10">
                                        <div className="inline-block text-[10px] font-bold text-brand border border-brand/20 bg-brand/5 px-2.5 py-1 mb-6 uppercase tracking-widest">{res.improvement}</div>
                                        <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">{res.scenario}</h3>
                                    </div>

                                    {/* Score bars */}
                                    <div className="space-y-6 mb-10">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">
                                                <span>Standard</span>
                                                <span>{res.normalScore}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 relative">
                                                <div className="absolute inset-y-0 left-0 bg-slate-300" style={{ width: `${res.normalScore}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-brand mb-2 uppercase tracking-widest">
                                                <span>Priority</span>
                                                <span>{res.priorityScore}%</span>
                                            </div>
                                            <div className="h-1 bg-brand/10 relative">
                                                <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${res.priorityScore}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-border-light">
                                        {res.metrics.map((m, j) => (
                                            <div key={j} className="flex items-center justify-between">
                                                <span className="text-[11px] text-text-muted font-bold uppercase tracking-tighter">{m.label}</span>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-[11px] text-text-muted line-through">{m.normal}</span>
                                                    <span className="text-[11px] font-bold text-brand">{m.priority}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <BenchmarkStory />

                {/* ── FINAL CTA ── */}
                <section className="py-24 lg:py-32 bg-white">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-3xl lg:text-5xl font-bold text-text-primary tracking-tighter mb-8 leading-tight">
                            Secure your placement <br />in the primary inbox.
                        </h2>
                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={() => router.push("/login")}
                                className="bg-text-primary text-white text-[12px] font-bold uppercase tracking-widest px-10 py-5 hover:bg-slate-800 transition-all flex items-center gap-3"
                            >
                                Activate Priority Account
                                <ArrowRight size={14} />
                            </button>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Included in all standard plans</p>
                        </div>
                    </div>
                </section>

            </main>
        </MailAppContainer>
    );
}
