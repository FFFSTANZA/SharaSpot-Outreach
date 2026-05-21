"use client";

import React, { useState, useEffect } from "react";
import MailAppContainer from "@/components/landing/MailAppContainer";
import {
    Zap, Shield, CheckCircle2, ArrowRight,
    TrendingUp, Activity, Star, Lock,
    BarChart3, Users, Award, Clock,
    ChevronRight
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
        fetch("/data/benchmark-results.json")
            .then((r) => r.json())
            .then((d) => setBenchmarks(d))
            .catch(() => {
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
            });
    }, []);

    return (
        <MailAppContainer>
            <main>

                {/* ── 01: HERO ── */}
                <section className="relative pt-24 pb-32 overflow-hidden bg-white border-b border-slate-200">
                    <div className="absolute top-8 left-8 hidden lg:block">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] font-sans">01 / System Entry</span>
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand/10 blur-[150px] rounded-full opacity-60" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
                    </div>

                    <div className="max-w-6xl mx-auto px-6 relative">
                        {/* Eyebrow */}
                        <div className="flex items-center gap-2 mb-10">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-light border border-brand-muted text-brand text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                <Zap size={12} fill="currentColor" /> Priority Mail Infrastructure
                            </span>
                            <span className="text-text-muted text-[11px]">—</span>
                            <span className="text-text-muted text-[11px] font-bold uppercase tracking-tight">Verified Protocol v4.2</span>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                            <div className="animate-in fade-in slide-in-from-left duration-700">
                                <h1 className="text-5xl lg:text-6xl font-bold text-text-primary tracking-tighter leading-[1.05] mb-8">
                                    When an email <br />
                                    <span className="text-brand">must</span> land.
                                </h1>
                                <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-lg font-medium font-sans">
                                    Standard outreach is batched, delayed, and often ignored. SharaSpot Priority is the only pipeline proven to reach the <strong className="text-text-primary">primary inbox</strong> at 96% scale. Not the Promotions tab. The primary inbox.
                                </p>
                                <div className="flex flex-wrap gap-6 items-center mb-12">
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="bg-brand text-white text-sm font-bold px-8 py-4 rounded-xl hover:bg-brand/90 transition-all hover:shadow-2xl flex items-center gap-3 group uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95"
                                    >
                                        Deploy Protocol
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <a href="#benchmark" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 uppercase tracking-tight">
                                        View benchmarks <ChevronRight size={16} className="text-brand" />
                                    </a>
                                </div>
                                <div className="flex flex-wrap gap-10">
                                    {[
                                        { val: "96%", label: "Placement rate" },
                                        { val: "50K+", label: "Decisions/sec" },
                                        { val: "< 1ms", label: "Latency" },
                                    ].map((s) => (
                                        <div key={s.val}>
                                            <p className="text-3xl font-bold text-text-primary tracking-tighter">{s.val}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live pulse card */}
                            <div className="relative hidden lg:block animate-in fade-in slide-in-from-right duration-700">
                                <div className="absolute -inset-10 bg-brand/5 blur-[100px] rounded-full" />
                                <div className="bg-white/40 backdrop-blur-xl border border-slate-300/50 rounded-[32px] p-2.5 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] ring-1 ring-white/20 relative">
                                    <div className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm overflow-hidden">
                                        <div className="px-6 pt-5 pb-4 border-b border-border-light flex items-center justify-between bg-slate-50/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">Live Infrastructure Relay</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-text-muted/40 uppercase tabular-nums">Syncing...</span>
                                        </div>
                                        <div className="divide-y divide-border-light">
                                            {[
                                                { email: "partner@acme.com", status: "PRIMARY INBOX", time: "0.8s", icon: "✓", color: "text-brand" },
                                                { email: "cto@techcorp.io", status: "PRIMARY INBOX", time: "1.1s", icon: "✓", color: "text-brand" },
                                                { email: "founder@seed.vc", status: "PRIMARY INBOX", time: "0.6s", icon: "✓", color: "text-brand" },
                                                { email: "hiring@bigco.com", status: "PRIMARY INBOX", time: "1.3s", icon: "✓", color: "text-brand" },
                                            ].map((row, i) => (
                                                <div key={i} className="px-6 py-4 flex items-center justify-between group">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0 border border-border-light group-hover:scale-110 transition-transform">
                                                            {row.email[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-[13px] text-text-primary font-bold truncate">{row.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                                        <span className={`text-[9px] font-bold ${row.color} bg-brand/5 border border-brand/10 px-2.5 py-1 rounded-full uppercase tracking-widest`}>{row.status}</span>
                                                        <span className="text-[10px] font-bold text-text-muted tabular-nums">{row.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-6 py-4 bg-brand text-white flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-widest">Protocol Active: 96% Placement</span>
                                            <TrendingUp size={14} className="animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                                {/* Floating badge */}
                                <div className="absolute -bottom-6 -left-8 bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl px-6 py-4 ring-1 ring-white/50">
                                    <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Efficiency Gain</p>
                                    <p className="text-2xl font-bold text-text-primary tracking-tighter">+85%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── TRUST BAR (BRIDGE) ── */}
                <section className="py-12 border-b border-slate-200 bg-slate-50 relative z-10">
                    <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-8 items-center justify-between">
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em]">Verified across global infrastructure</p>
                        {["Google Workspace", "Microsoft 365", "Outlook", "Exchange", "Yahoo Mail"].map((p) => (
                            <div key={p} className="flex items-center gap-3">
                                <div className="p-1 rounded bg-brand/5 border border-brand/10">
                                    <CheckCircle2 size={13} className="text-brand" />
                                </div>
                                <span className="text-[13px] font-bold text-text-primary tracking-tight">{p}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 02: BENCHMARK ── */}
                <section id="benchmark" className="py-24 bg-white border-b border-slate-200 relative overflow-hidden">
                    <div className="absolute top-8 left-8 hidden lg:block">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] font-sans">02 / Performance Data</span>
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
                    <div className="max-w-6xl mx-auto px-6 relative">
                        <div className="flex flex-col lg:flex-row justify-between items-start mb-16 gap-8">
                            <div className="max-w-xl">
                                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Independent performance study</p>
                                <h2 className="text-4xl lg:text-5xl font-bold text-text-primary tracking-tighter leading-[1.05]">The numbers speak.</h2>
                                <p className="text-text-secondary font-bold mt-4 font-sans">Verified results comparing standard sending infrastructure against the SharaSpot Priority Protocol.</p>
                            </div>
                            <div className="text-sm border border-slate-300/60 rounded-[20px] px-6 py-6 max-w-sm bg-white shadow-2xl shadow-slate-300/40">
                                <p className="font-bold text-text-primary text-[11px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Activity size={14} className="text-brand" />
                                    Experimental Methodology
                                </p>
                                <p className="text-[13px] leading-relaxed text-text-secondary font-bold italic font-sans">Tested across 80 unique recipient domains using controlled sends at equal volume, content, and cadence. Only routing protocol differed.</p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {benchmarks.map((res, i) => (
                                <div key={i} className="bg-white border-2 border-slate-200/80 rounded-[28px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-1 group">
                                    <div className="px-8 pt-8 pb-6 border-b border-slate-200 bg-slate-50/50">
                                        <div className="inline-block text-[10px] font-bold text-brand bg-brand-light border border-brand/20 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">{res.improvement}</div>
                                        <h3 className="text-[16px] font-bold text-text-primary tracking-tight">{res.scenario}</h3>
                                    </div>

                                    {/* Score bars */}
                                    <div className="px-8 py-8 space-y-6 border-b border-slate-200">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">
                                                <span>Standard Sending</span>
                                                <span>{res.normalScore}%</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${res.normalScore}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-brand mb-2 uppercase tracking-widest">
                                                <span>Priority Protocol</span>
                                                <span>{res.priorityScore}%</span>
                                            </div>
                                            <div className="h-2.5 bg-brand-light rounded-full overflow-hidden border border-brand/20 shadow-inner">
                                                <div className="h-full bg-brand rounded-full shadow-[0_0_10px_rgba(0,166,62,0.4)]" style={{ width: `${res.priorityScore}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 py-6 bg-white space-y-3">
                                        {res.metrics.map((m, j) => (
                                            <div key={j} className="flex items-center justify-between">
                                                <span className="text-[11px] text-text-muted font-bold uppercase tracking-tight">{m.label}</span>
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-[11px] text-text-muted line-through font-bold opacity-50 tabular-nums font-sans">{m.normal}</span>
                                                    <span className="text-[11px] font-bold text-brand tabular-nums font-sans">{m.priority}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 03: COMPARISON ── */}
                <section className="py-32 bg-slate-50 border-b border-slate-200">
                    <div className="absolute top-8 left-8 hidden lg:block">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] font-sans">03 / Difference Engine</span>
                    </div>
                    <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-24 lg:gap-32 items-center">
                        <div>
                            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-6">The High-Stakes Difference</p>
                            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-8 tracking-tighter leading-[1.05]">
                                Identical email content. <br />
                                <span className="text-brand">Drastically different outcomes.</span>
                            </h2>
                            <p className="text-text-secondary leading-relaxed mb-12 text-lg font-medium font-sans">
                                SharaSpot Priority doesn't just send faster. It engineers the exact environment required to bypass promotions tabs and land in the primary inbox, exactly when it needs to be seen.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
                                {[
                                    { title: "Primary inbox bypass", desc: "Priority routes bypass standard marketing batch windows completely." },
                                    { title: "Reputation wall", desc: "Routed through infrastructure specifically tuned for one-to-one business sends." },
                                    { title: "Strategic jitter", desc: "Variable timing mimicry ensures no robotic footprint is ever detected." },
                                    { title: "Latency-free routing", desc: "Routing decisions happen in under 1ms to hit precise recipient windows." },
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 border border-brand/20">
                                            <CheckCircle2 size={12} className="text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-text-primary mb-1 uppercase tracking-tight">{f.title}</p>
                                            <p className="text-[12px] text-text-secondary leading-relaxed font-medium font-sans">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Two-state comparison */}
                        <div className="space-y-6">
                            <div className="rounded-[28px] border-2 border-red-200/60 bg-red-50/40 p-8 shadow-xl shadow-red-900/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Standard Batch Infrastructure</span>
                                </div>
                                <div className="space-y-4">
                                    {["Mass-processed alongside marketing noise", "Fixed robotic patterns flagged by detection engines", "Shared IP reputation prone to silent drops", "Promotions tab is the 'best-case' scenario"].map((t, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="text-red-400 font-bold text-lg leading-none -mt-0.5">×</span>
                                            <span className="text-[13px] text-red-900/70 font-bold tracking-tight leading-tight font-sans">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[28px] border-2 border-brand/20 bg-[#f4fbf6] p-8 shadow-2xl shadow-brand/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                    <Zap size={100} className="text-brand" />
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(0,166,62,0.5)] animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">SharaSpot Priority Protocol</span>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    {["Isolated high-authority relay infrastructure", "Undetectable human-mimicry timing patterns", "96% Primary Inbox placement verified", "MX-level intelligence bypasses ESP restrictions"].map((t, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 size={16} className="text-brand mt-0.5 shrink-0" />
                                            <span className="text-[13px] text-text-primary font-bold tracking-tight leading-tight font-sans">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-brand text-white text-[11px] font-bold uppercase tracking-[0.3em] py-5 rounded-[20px] hover:bg-brand/90 transition-all hover:shadow-2xl shadow-xl shadow-brand/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                Secure My Pipeline
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── 04: USE CASES ── */}
                <section className="py-32 bg-white border-b border-slate-200">
                    <div className="absolute top-8 left-8 hidden lg:block">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] font-sans">04 / Operational Scenarios</span>
                    </div>
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-24">
                            <div className="lg:pt-2">
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.25em] mb-4">Tactical Scenarios</p>
                                <h3 className="text-3xl font-bold text-text-primary leading-[1.1] tracking-tighter">Where failed delivery is not an option.</h3>
                            </div>
                            <div className="divide-y divide-slate-200 border-t border-slate-200">
                                {[
                                    { num: "01", title: "The Seven-Figure Pitch.", desc: "Investor intros have a 6-hour window before burying under noise. Priority makes sure yours is at the top of the inbox at 8am, not cleared at 4pm from Promotions." },
                                    { num: "02", title: "Elite Executive Chasing.", desc: "Top-tier hires never scroll promotional tabs. If your first touchpoint isn't in the Primary Inbox, it's invisible. Priority makes you visible." },
                                    { num: "03", title: "High-Value Deal Closing.", desc: "The final contract follow-up cannot sit in a queue for 30 minutes. That's how deals stall. Priority sends it the millisecond you hit execute." },
                                    { num: "04", title: "Critical Product Scaling.", desc: "Launching something big? Priority ensures your entire VIP list sees it instantly, without the throttling standard providers impose." },
                                ].map((u, i) => (
                                    <div key={i} className="flex gap-12 py-10 group">
                                        <span className="text-[10px] font-bold text-brand pt-1.5 tabular-nums w-6 shrink-0 transition-all group-hover:scale-125">{u.num}</span>
                                        <div>
                                            <h4 className="text-[16px] font-bold text-text-primary mb-3 tracking-tight group-hover:text-brand transition-colors uppercase">{u.title}</h4>
                                            <p className="text-[14px] text-text-secondary leading-relaxed font-medium font-sans">{u.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 05: TESTIMONIALS ── */}
                <section className="py-32 bg-slate-50 border-b border-slate-200">
                    <div className="absolute top-8 left-8 hidden lg:block">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] font-sans">05 / Network Feedback</span>
                    </div>
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-24 mb-20">
                            <div className="lg:pt-2">
                                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-4">Relay Intel</p>
                                <h3 className="text-3xl font-bold text-text-primary leading-[1.1] tracking-tighter">Verified feedback from high-stakes founders.</h3>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-12">
                                <div>
                                    <p className="text-4xl font-bold text-brand tracking-tighter">41%</p>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Avg. Response gain</p>
                                </div>
                                <div className="hidden sm:block w-px bg-slate-200" />
                                <div>
                                    <p className="text-4xl font-bold text-text-primary tracking-tighter">96%</p>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Active placement delta</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-8">
                            {[
                                { quote: "Sent a cold pitch to a partner I've never spoken with and got a reply in 4 hours. It landed exactly where it should.", name: "Arnav S.", role: "Founder, Series A startup" },
                                { quote: "We used to get 12% open rates. After switching to Priority infrastructure, we're consistently above 41%. It's another level.", name: "Priya R.", role: "VP Growth, Scale-up" },
                                { quote: "Closest thing to guaranteed delivery. Our placement moved from 54% to 96% in a week. No other tool comes close.", name: "Olu T.", role: "Head of Partnerships" },
                            ].map((t, i) => (
                                <div key={i} className="bg-slate-50/50 border border-slate-200 rounded-[32px] p-10 hover:bg-white hover:shadow-2xl transition-all group">
                                    <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-6">Case {i + 1}</p>
                                    <p className="text-[16px] text-text-primary font-bold leading-relaxed mb-10">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="pt-6 border-t border-slate-200">
                                        <p className="text-[13px] font-bold text-text-primary uppercase tracking-tight">{t.name}</p>
                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{t.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── 06: FINAL CTA ── */}
                <section className="py-32 lg:py-48 bg-slate-950 border-t border-slate-900 relative overflow-hidden text-center">
                    {/* Ambient Glows */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/[0.07] blur-[140px] rounded-full" />
                        <div className="absolute bottom-[-10%] left-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[120px] rounded-full" />
                    </div>

                    <div className="absolute top-8 left-8 hidden lg:block">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] font-sans">06 / Initialization</span>
                    </div>

                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                        {/* Section Header */}
                        <div className="flex flex-col items-center mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px w-8 bg-brand/30" />
                                <span className="text-[11px] font-bold text-brand uppercase tracking-[0.3em]">Execution Window</span>
                                <div className="h-px w-8 bg-brand/30" />
                            </div>
                            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-sm">
                                <Shield size={12} className="text-brand" /> Priority Protocol included in every plan
                            </p>
                        </div>

                        {/* Main Headline */}
                        <h2 className="text-5xl lg:text-7xl font-bold text-white tracking-tighter leading-[1.05] mb-10">
                            Your next billion-dollar <br />
                            deal is checking their <br />
                            <span className="text-brand italic">inbox right now.</span>
                        </h2>

                        {/* Description */}
                        <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-16 font-medium font-sans">
                            Every day without SharaSpot Priority is another high-stakes email buried in a Promotions tab. The people you need to reach check their primary inbox. <span className="text-white">Be there.</span>
                        </p>

                        {/* CTA Group */}
                        <div className="flex flex-col items-center gap-10">
                            <button
                                onClick={() => router.push("/login")}
                                className="group relative bg-brand text-white text-[12px] font-bold uppercase tracking-[0.3em] px-12 py-6 rounded-2xl hover:bg-brand/90 transition-all hover:shadow-[0_0_50px_rgba(0,166,62,0.3)] shadow-2xl shadow-brand/20 active:scale-[0.98] flex items-center gap-4 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10">Start Free Protocol</span>
                                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="flex items-center gap-8">
                                <div className="text-left py-1 pr-8 border-r border-slate-800">
                                    <p className="text-[11px] font-bold text-white uppercase tracking-tight">Enterprise Scale</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 font-sans">99.9% Sla Guarantee</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose font-sans">
                                        Cancel anytime <span className="mx-2 text-slate-700">•</span> No hidden fees
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer decoration */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-right from-transparent via-slate-800 to-transparent" />
                </section>

            </main>
        </MailAppContainer>
    );
}
