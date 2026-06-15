"use client";

import { ArrowRight, Mail, Users, TrendingUp, Shield, Activity, Zap, CheckCircle, Clock, Send, BarChart3, Phone, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Features() {
    const router = useRouter();

    return (
        <section className="bg-transparent relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/standard-bg.jpg')] bg-cover bg-center opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-sky-100/35 via-white/15 to-blue-50/55" />
            </div>
            {/* ── INTRO ── */}
            <div className="py-24 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-brand/[0.04] blur-[140px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 text-center relative">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/[0.06] border border-brand/10 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                        <Activity size={11} /> The SharaSpot Standard
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-text-primary tracking-tighter leading-[1.05] max-w-4xl mx-auto mb-6">
                        Everything you need to reach the <span className="text-brand">right people, the right way.</span>
                    </h2>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto font-medium">
                        Not another email tool. A complete outreach operating system that handles the parts you should not have to think about.
                    </p>
                </div>
            </div>

            {/* ── FEATURE 1: Inbox Intelligence (premium dark delivery dashboard) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-gradient-to-b from-transparent to-brand/[0.08]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-brand/[0.08] border border-brand/20 flex items-center justify-center text-brand mb-8">
                                <Mail size={26} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 01</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tighter leading-[1.05] mb-6">
                                Your email lands where <span className="text-brand">people actually look.</span>
                            </h3>
                            <p className="text-base text-text-secondary leading-relaxed mb-8 font-medium">
                                The primary inbox is where decisions happen. SharaSpot routes each send through warmed senders at natural intervals, with tracking and throttles tuned to reduce Promotions and Spam risk.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Every email exits through a healthy, warmed sender account",
                                    "Timing adapts to business hours so arrival feels natural",
                                    "Bursts are spread out so providers see a person, not a bot"
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-brand mt-1 shrink-0" />
                                        <span className="text-sm font-medium text-text-secondary">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                {[
                                    { value: "Adaptive", label: "Inbox placement", delta: "Live guardrails", accent: "text-brand" },
                                    { value: "0.4%", label: "Bounce rate", delta: "-2.1%", accent: "text-emerald-600" },
                                    { value: "6", label: "Active senders", delta: "All warmed", accent: "text-blue-600" },
                                    { value: "8:42", label: "Avg delivery", delta: "Business hours", accent: "text-cyan-600" },
                                ].map((stat) => (
                                    <div key={stat.label} className="rounded-xl bg-white border border-border-light p-3 sm:p-4 shadow-sm hover:shadow-lg hover:border-brand/20 hover:-translate-y-0.5 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-2xl font-black ${stat.accent}`}>{stat.value}</p>
                                            <span className="text-[9px] font-black text-brand bg-brand/[0.08] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">{stat.delta}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="rounded-[32px] bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/40">
                                <div className="h-16 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
                                    <div className="flex items-center gap-4">
                                        <span className="h-3 w-3 rounded-full bg-red-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
                                        <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Delivery Dashboard</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        <span className="text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                                            <span>All senders active</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 lg:p-7">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-7">
                                        {[
                                            { value: "Guarded", label: "Primary", accent: "text-brand" },
                                            { value: "Reduced", label: "Promotions", accent: "text-amber-400" },
                                            { value: "Blocked", label: "Spam risk", accent: "text-red-400" },
                                            { value: "52%", label: "Industry avg", accent: "text-slate-400" },
                                        ].map((stat) => (
                                            <div key={stat.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 sm:p-3.5 hover:border-slate-700/80 transition-all">
                                                <p className={`text-lg font-black tabular-nums ${stat.accent}`}>{stat.value}</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 mb-7">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Inbox placement breakdown</p>
                                        <div className="space-y-3.5">
                                            {[
                                                { label: "Primary optimized", pct: 92, bar: "w-[92%]", color: "bg-brand" },
                                                { label: "Promotion risk", pct: 6, bar: "w-[6%]", color: "bg-amber-500" },
                                                { label: "Spam risk", pct: 2, bar: "w-[2%]", color: "bg-red-500" },
                                            ].map((item) => (
                                                <div key={item.label}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-bold text-white">{item.label}</span>
                                                        <span className="text-xs font-black text-slate-400 tabular-nums">{item.pct}%</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                                        <div className={`h-full rounded-full ${item.color} ${item.bar} transition-all duration-700`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            {
                                                icon: Shield,
                                                label: "Best sender",
                                                value: "maya@sharaspot.com",
                                                sub: "98.4% placement rate",
                                                accent: "text-brand",
                                                iconBg: "bg-brand/10 border-brand/20",
                                                border: "border-slate-800/80 hover:border-slate-700/80",
                                            },
                                            {
                                                icon: Clock,
                                                label: "Peak window",
                                                value: "8:30 - 10:00 AM",
                                                sub: "Recipient timezone",
                                                accent: "text-blue-400",
                                                iconBg: "bg-blue-500/10 border-blue-500/20",
                                                border: "border-slate-800/80 hover:border-blue-500/20",
                                            },
                                            {
                                                icon: TrendingUp,
                                                label: "Top performing",
                                                value: "Q3 Proposal campaign",
                                                sub: "98.7% placement rate",
                                                accent: "text-cyan-400",
                                                iconBg: "bg-cyan-500/10 border-cyan-500/20",
                                                border: "border-slate-800/80 hover:border-cyan-500/20",
                                            },
                                        ].map((card) => (
                                            <div key={card.label} className={`rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border ${card.border} p-4 transition-all`}>
                                                <div className={`h-8 w-8 rounded-xl ${card.iconBg} border flex items-center justify-center mb-3`}>
                                                    <card.icon size={15} className={card.accent} />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
                                                <p className="text-sm font-bold text-white truncate">{card.value}</p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{card.sub}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 2: Sender Rotation (live dashboard) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-slate-950">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[140px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="rounded-[32px] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl shadow-black/40">
                                <div className="h-12 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between px-5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sender Network</span>
                                    <span className="flex items-center gap-2 text-[10px] font-black text-brand"><span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> All lanes active</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    {[
                                        { name: "maya@sharaspot.com", pct: 78, sent: "1,842", status: "Sending" },
                                        { name: "alex@sharaspot.com", pct: 64, sent: "1,521", status: "Sending" },
                                        { name: "nina@sharaspot.com", pct: 52, sent: "1,203", status: "Sending" },
                                        { name: "jordan@sharaspot.com", pct: 31, sent: "742", status: "Warming" },
                                    ].map((sender, i) => (
                                        <div key={i} className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 hover:border-brand/30 transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-xl bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">{i + 1}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{sender.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{sender.status}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-400">{sender.sent} sent</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                                                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${sender.pct}%` }} />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-slate-500 font-medium">Capacity used</span>
                                                <span className="text-[10px] text-brand font-bold">{sender.pct}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-brand mb-8">
                                <Send size={26} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 02</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                                One campaign, <span className="text-brand">many senders.</span>
                            </h3>
                            <p className="text-base text-slate-400 leading-relaxed mb-8 font-medium">
                                Connect multiple email accounts and SharaSpot distributes your volume across them automatically. No single sender gets flagged. Your domain stays clean. And your campaign keeps moving at full speed.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Senders per campaign", value: "Unlimited" },
                                    { label: "Auto-rotation", value: "Smart" },
                                    { label: "Per-sender limits", value: "Protected" },
                                    { label: "Failover", value: "Instant" },
                                ].map((stat) => (
                                    <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                        <p className="text-white font-black text-lg">{stat.value}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 3: Warmup & Protection (premium dark warmup dashboard) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -bottom-20 right-1/3 w-[600px] h-[400px] rounded-full bg-gradient-to-l from-brand/[0.08] to-transparent blur-[100px]" />
                    <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-brand/[0.05] to-transparent blur-[100px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/[0.1] to-brand/[0.05] border border-brand/20 flex items-center justify-center text-brand mb-8">
                                <Shield size={26} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 03</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tighter leading-[1.05] mb-6">
                                Build reputation before <span className="text-brand">you send a single campaign.</span>
                            </h3>
                            <p className="text-base text-text-secondary leading-relaxed mb-8 font-medium">
                                New senders start with a gentle daily rhythm and scale up naturally over 14 days. No sudden bursts. No spam complaints. Just a steady, safe climb to full sending capacity.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {["14-day warmup", "Adaptive pacing", "Bounce protection", "Reply detection"].map((tag) => (
                                    <span key={tag} className="text-xs font-bold bg-brand/[0.08] text-brand border border-brand/20 px-4 py-2 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="rounded-[32px] bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/40">
                                <div className="h-16 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
                                    <div className="flex items-center gap-4">
                                        <span className="h-3 w-3 rounded-full bg-red-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
                                        <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Warmup Dashboard</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        <span className="text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                                            <span>maya@sharaspot.com</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 lg:p-7">
                                    <div className="flex items-center justify-between mb-7">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Warmup Progress</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-brand">Day 11</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">of 14</p>
                                        </div>
                                    </div>

                                    <div className="relative mb-7">
                                        <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500/60 via-brand to-cyan-400/80" style={{ width: "78%" }} />
                                        </div>
                                        <div className="flex justify-between mt-3 text-[10px] font-bold">
                                            <span className="text-slate-600">Day 1 &mdash; 20/day</span>
                                            <span className="text-brand">Day 11 &mdash; 380/day</span>
                                            <span className="text-slate-600">Day 14 &mdash; 500/day</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-7">
                                        {[
                                            { value: "92/100", label: "Reputation", accent: "text-brand" },
                                            { value: "0.3%", label: "Bounce rate", accent: "text-red-400" },
                                            { value: "380", label: "Daily volume", accent: "text-blue-400" },
                                            { value: "14", label: "Days elapsed", accent: "text-cyan-400" },
                                        ].map((stat) => (
                                            <div key={stat.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 sm:p-3.5 hover:border-slate-700/80 transition-all">
                                                <p className={`text-lg font-black tabular-nums ${stat.accent}`}>{stat.value}</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 mb-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Daily volume ramp</p>
                                        <svg className="w-full h-16 text-brand" viewBox="0 0 400 50" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="warmGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <rect x="30" y="32" width="28" height="16" rx="4" fill="url(#warmGrad)" />
                                            <rect x="72" y="28" width="28" height="20" rx="4" fill="url(#warmGrad)" />
                                            <rect x="114" y="23" width="28" height="25" rx="4" fill="url(#warmGrad)" />
                                            <rect x="156" y="18" width="28" height="30" rx="4" fill="url(#warmGrad)" />
                                            <rect x="198" y="12" width="28" height="36" rx="4" fill="url(#warmGrad)" />
                                            <rect x="240" y="6" width="28" height="42" rx="4" fill="url(#warmGrad)" />
                                            <rect x="282" y="2" width="28" height="46" rx="4" fill="currentColor" fillOpacity="0.35" />
                                            <rect x="324" y="4" width="28" height="44" rx="4" fill="currentColor" fillOpacity="0.15" />
                                        </svg>
                                    </div>

                                    <div className="rounded-2xl bg-gradient-to-r from-brand/5 via-blue-500/5 to-brand/[0.03] border border-slate-800/80 p-4 flex items-center gap-4">
                                        <Shield size={18} className="text-brand shrink-0" />
                                        <p className="text-xs font-bold text-slate-300">Your primary domain is fully isolated. No campaign activity touches your main sending identity.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 4: PRM Pipeline (kanban/crm, dark) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-slate-950">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 left-1/2 w-[700px] h-[500px] rounded-full bg-brand/5 blur-[140px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="rounded-[32px] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl shadow-black/40">
                                <div className="h-12 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between px-5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Partner Pipeline</span>
                                    <span className="text-[10px] font-bold text-brand bg-brand/[0.1] px-3 py-1 rounded-full">37 active relationships</span>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                                        {[
                                            { stage: "Cold", count: "12", color: "text-slate-500", bg: "bg-slate-800/50" },
                                            { stage: "Warm", count: "18", color: "text-blue-400", bg: "bg-blue-500/10" },
                                            { stage: "Hot", count: "7", color: "text-brand", bg: "bg-brand/[0.1]" },
                                        ].map((s) => (
                                            <div key={s.stage} className={`rounded-2xl p-4 border border-slate-700/50 ${s.bg}`}>
                                                <p className={`text-[10px] font-black uppercase tracking-wider ${s.color}`}>{s.stage}</p>
                                                <p className={`text-3xl font-black mt-2 ${s.color}`}>{s.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Acme Partners", region: "North America", stage: "Warm", next: "Send proposal" },
                                            { name: "TechFlow Resell", region: "EMEA", stage: "Hot", next: "Contract review" },
                                            { name: "DataBridge Ltd", region: "APAC", stage: "Cold", next: "Initial reach-out" },
                                        ].map((partner) => (
                                            <div key={partner.name} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 hover:border-brand/30 hover:bg-slate-800/50 transition-all">
                                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-black shrink-0">
                                                    {partner.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white">{partner.name}</p>
                                                    <p className="text-xs text-slate-500">{partner.region} &middot; Next: {partner.next}</p>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${partner.stage === "Hot" ? "bg-brand/[0.15] text-brand" : partner.stage === "Warm" ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-400"}`}>
                                                    {partner.stage}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-8">
                                <Users size={26} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 04</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                                Your partner network, <span className="text-brand">organized and alive.</span>
                            </h3>
                            <p className="text-base text-slate-400 leading-relaxed mb-8 font-medium">
                                Track every relationship through stages. Know who is warm, who is ready, and what to do next. No spreadsheets. No forgotten follow-ups.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Tag and segment partners by region, tier, or opportunity size",
                                    "Stage tracking from cold contact to signed agreement",
                                    "Automated reminders so no relationship ever goes cold"
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-brand mt-1 shrink-0" />
                                        <span className="text-sm font-medium text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 5: Signal Analytics (premium dark dashboard card) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-gradient-to-b from-transparent via-brand/[0.10] to-transparent">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 left-1/3 w-[600px] h-[500px] rounded-full bg-brand/[0.06] blur-[120px]" />
                    <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-50 blur-[100px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20 items-center">
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-brand/[0.08] border border-brand/20 flex items-center justify-center text-brand mb-8">
                                <BarChart3 size={26} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 05</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tighter leading-[1.05] mb-6">
                                See exactly what is working <span className="text-brand">while the campaign runs.</span>
                            </h3>
                            <p className="text-base text-text-secondary leading-relaxed mb-8 font-medium">
                                Open rates, click-throughs, replies — all surfaced in real time. No waiting for a report. No guessing which subject line won. Just data you can act on immediately.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: "68%", label: "Open rate", delta: "+12%", accent: "text-brand", bar: "w-3/4" },
                                    { value: "19%", label: "Click rate", delta: "+5%", accent: "text-blue-600", bar: "w-1/3" },
                                    { value: "11%", label: "Reply rate", delta: "+8%", accent: "text-cyan-600", bar: "w-1/4" },
                                    { value: "32%", label: "Meeting booked", delta: "+18%", accent: "text-teal-600", bar: "w-1/2" },
                                ].map((stat) => (
                                    <div key={stat.label} className="rounded-xl bg-white border border-border-light p-4 shadow-sm hover:shadow-lg hover:border-brand/20 hover:-translate-y-0.5 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-2xl font-black ${stat.accent}`}>{stat.value}</p>
                                            <span className="text-[9px] font-black text-brand bg-brand/[0.08] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">{stat.delta}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{stat.label}</p>
                                        <div className="h-1 rounded-full bg-border-light overflow-hidden">
                                            <div className={`h-full rounded-full bg-gradient-to-r from-brand/40 to-brand ${stat.bar}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="rounded-[32px] bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/40">
                                <div className="h-16 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
                                    <div className="flex items-center gap-4">
                                        <span className="h-3 w-3 rounded-full bg-red-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
                                        <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Campaign Analytics</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        <span className="text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                                            <span>Investor Outreach</span>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-slate-600"><path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                        </span>
                                        <span className="text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">Last 14 days</span>
                                    </div>
                                </div>
                                <div className="p-6 lg:p-7">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                                        {[
                                            { value: "2,847", label: "Sent", trend: "+12%", up: true },
                                            { value: "68.2%", label: "Opens", trend: "+5.4%", up: true },
                                            { value: "19.1%", label: "Clicks", trend: "+2.1%", up: true },
                                            { value: "11.4%", label: "Replies", trend: "-0.8%", up: false },
                                        ].map((stat) => (
                                            <div key={stat.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 sm:p-3.5 hover:border-slate-700/80 transition-all">
                                                <p className="text-xs font-black text-white tabular-nums">{stat.value}</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                                    <span className={`text-[9px] font-black ml-2 ${stat.up ? "text-emerald-400" : "text-red-400"}`}>
                                                        {stat.up ? "▲" : "▼"} {stat.trend}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        {["Opens", "Clicks", "Replies"].map((tab, i) => (
                                            <span key={tab} className={`text-xs font-bold uppercase tracking-wider transition-colors ${i === 0 ? "text-brand" : "text-slate-600 hover:text-slate-400"}`}>
                                                {tab}{i === 0 && <span className="block h-0.5 w-full bg-brand rounded-full mt-1" />}
                                            </span>
                                        ))}
                                        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-brand bg-brand/[0.1] px-3 py-1.5 rounded-full border border-brand/20">
                                            <TrendingUp size={12} />
                                            +31% this week
                                        </span>
                                    </div>

                                    <div className="relative h-48 mb-6">
                                        <svg className="w-full h-full text-brand" viewBox="0 0 400 140" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M0 120 C60 110, 100 80, 160 70 C220 60, 260 40, 320 20 C360 10, 380 8, 400 5"
                                                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                            />
                                            <path d="M0 120 C60 110, 100 80, 160 70 C220 60, 260 40, 320 20 C360 10, 380 8, 400 5 L400 140 L0 140 Z"
                                                  fill="url(#lineGrad)"
                                            />
                                        </svg>
                                        <div className="absolute top-[18%] left-[30%] h-3 w-3 rounded-full bg-brand shadow-lg shadow-brand/50" />
                                        <div className="absolute top-[8%] left-[60%] h-3 w-3 rounded-full bg-brand shadow-lg shadow-brand/50" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-gradient-to-br from-brand/5 to-slate-900/60 border border-slate-800/80 p-4 hover:border-slate-700/80 transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={13} className="text-brand" />
                                                <span className="text-[10px] font-black text-brand uppercase tracking-wider">Best window</span>
                                            </div>
                                            <p className="text-sm font-bold text-white">8:30 - 10:00 AM</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Recipient timezone &middot; Peak opens</p>
                                        </div>
                                        <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-slate-900/60 border border-blue-500/20 p-4 hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap size={13} className="text-blue-400" />
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Top subject</span>
                                            </div>
                                            <p className="text-sm font-bold text-white truncate">&ldquo;Quick idea for Q3&rdquo;</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">61% open rate &middot; 2x average</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 6: Reply Detection (conversation flow, dark) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-slate-950">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 left-1/3 w-[600px] h-[400px] rounded-full bg-brand/5 blur-[120px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="rounded-[32px] bg-slate-900 border border-slate-800 p-6 lg:p-8 shadow-2xl shadow-black/40">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Conversation Flow</span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-brand bg-brand/[0.1] px-3 py-1.5 rounded-full ml-auto">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> Real-time
                                    </span>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-black shrink-0">SS</div>
                                        <div className="flex-1">
                                            <div className="rounded-2xl bg-slate-800 p-4 max-w-[85%] border border-slate-700/50">
                                                <p className="text-xs font-medium text-slate-300">&ldquo;Hey, thanks for the note! Would love to chat next week. Does Tuesday work?&rdquo;</p>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium mt-1.5">Received 11:32 AM</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="h-8 w-8 rounded-full bg-brand/[0.1] border border-brand/20 flex items-center justify-center">
                                            <ArrowRight size={14} className="text-brand rotate-90" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 flex-row-reverse">
                                        <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand text-xs font-black shrink-0">SS</div>
                                        <div className="flex-1 flex justify-end">
                                            <div className="rounded-2xl bg-brand/[0.06] border border-brand/20 p-4 max-w-[85%]">
                                                <p className="text-xs font-medium text-slate-300">&ldquo;Tuesday works perfectly. How does 2 PM your time sound? I will send a calendar invite.&rdquo;</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-gradient-to-r from-brand/[0.1] to-blue-500/10 border border-brand/20 p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-brand/[0.15] flex items-center justify-center text-brand">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-brand uppercase tracking-wider">Sequence stopped automatically</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">No more follow-ups will be sent to this contact.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-8">
                                <Zap size={26} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 06</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                                The moment they reply, <span className="text-brand">everything stops.</span>
                            </h3>
                            <p className="text-base text-slate-400 leading-relaxed mb-8 font-medium">
                                Nothing kills a relationship faster than a robotic follow-up arriving after someone already said yes. SharaSpot detects replies in real time and halts sequences instantly.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Inbox scanning runs every few minutes — no delays",
                                    "Sequence pauses for that contact immediately",
                                    "You take over the conversation like nothing happened"
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-brand mt-1 shrink-0" />
                                        <span className="text-sm font-medium text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 7: Calls (premium dark call analytics dashboard) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-gradient-to-b from-transparent via-brand/[0.10] to-transparent">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-[500px] h-[400px] rounded-full bg-brand/[0.06] blur-[120px]" />
                    <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] rounded-full bg-blue-50 blur-[100px]" />
                </div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
                    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 sm:gap-12 lg:gap-20 items-center">
                        <div>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand/[0.08] border border-brand/20 flex items-center justify-center text-brand mb-6 sm:mb-8">
                                <Phone size={22} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 07</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tighter leading-[1.05] mb-6">
                                Every call tracked. <span className="text-brand">Every outcome captured.</span>
                            </h3>
                            <p className="text-base text-text-secondary leading-relaxed mb-8 font-medium">
                                Log calls, tag outcomes, write notes, and set follow-ups — all linked to the people you are reaching out to. No more scattered sticky notes or lost voicemail details.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: "6", label: "Outcome types", delta: "Connected, Voicemail, etc.", accent: "text-brand" },
                                    { value: "Auto", label: "Duration tracking", delta: "Per-call logging", accent: "text-blue-600" },
                                    { value: "Smart", label: "Follow-up reminders", delta: "Based on outcome", accent: "text-cyan-600" },
                                    { value: "Instant", label: "Linked contacts", delta: "CRM sync", accent: "text-teal-600" },
                                ].map((stat) => (
                                    <div key={stat.label} className="rounded-xl bg-white border border-border-light p-3 sm:p-4 shadow-sm hover:shadow-lg hover:border-brand/20 hover:-translate-y-0.5 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-xl sm:text-2xl font-black ${stat.accent}`}>{stat.value}</p>
                                            <span className="text-[9px] font-black text-brand bg-brand/[0.08] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">{stat.delta}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative min-w-0">
                            <div className="rounded-[24px] sm:rounded-[32px] bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/40">
                                <div className="h-14 sm:h-16 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
                                    <div className="flex items-center gap-4">
                                        <span className="h-3 w-3 rounded-full bg-red-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                                        <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
                                        <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Call Analytics</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        <span className="flex items-center gap-1.5 text-brand bg-brand/[0.1] px-3 py-1.5 rounded-full border border-brand/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> Live
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 lg:p-7">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-7">
                                        {[
                                            { value: "24", label: "This week", trend: "8 vs last", up: true, accent: "text-brand" },
                                            { value: "54%", label: "Connected", trend: "6%", up: true, accent: "text-emerald-400" },
                                            { value: "6:50", label: "Avg duration", trend: "1:12", up: true, accent: "text-blue-400" },
                                            { value: "13", label: "Follow-ups set", trend: "5", up: true, accent: "text-cyan-400" },
                                        ].map((stat) => (
                                            <div key={stat.label} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-2.5 sm:p-3.5 hover:border-slate-700/80 transition-all">
                                                <p className={`text-base sm:text-lg font-black tabular-nums ${stat.accent}`}>{stat.value}</p>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                                    <span className={`text-[8px] sm:text-[9px] font-black ml-1 sm:ml-2 ${stat.up ? "text-emerald-400" : "text-red-400"}`}>
                                                        {stat.up ? "▲" : "▼"} {stat.trend}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-7">
                                        {[
                                            { name: "Sarah Chen", role: "VP Ops, TechFlow", duration: "12:34", outcome: "Connected", notes: "Interested in enterprise plan. Follow up with pricing." },
                                            { name: "Mike Rogers", role: "Founder, DataBridge", duration: "4:12", outcome: "Voicemail", notes: "Left message about partnership opportunity." },
                                            { name: "Priya Kapoor", role: "Partner, Acme Inc", duration: "8:05", outcome: "Connected", notes: "Wants to schedule demo for her team." },
                                            { name: "James Wright", role: "CTO, Nimbus Labs", duration: "2:30", outcome: "No answer", notes: "Will try again tomorrow morning." },
                                        ].map((call, i) => (
                                            <div key={i} className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-3 sm:p-4 hover:border-slate-700/80 hover:bg-slate-900/60 transition-all group">
                                                <div className="flex items-start justify-between mb-2 gap-2">
                                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                                                            {call.name.split(" ").map(w => w[0]).join("")}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-white truncate">{call.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium truncate">{call.role}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">{call.duration}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full ${
                                                        call.outcome === "Connected" ? "bg-brand/10 text-brand" :
                                                        call.outcome === "Voicemail" ? "bg-blue-500/10 text-blue-400" :
                                                        "bg-slate-800 text-slate-500"
                                                    }`}>
                                                        {call.outcome}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600 font-medium truncate max-w-full">{call.notes}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-2xl bg-gradient-to-r from-brand/5 to-blue-500/5 border border-slate-800/60 px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <Phone size={14} className="text-brand shrink-0" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">24 calls logged this week</span>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-brand hover:text-brand/80 transition-colors cursor-pointer">
                                            View full log <ArrowRight size={11} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 8: MCP Integration (universal tool hub, dark) ── */}
            <div className="py-24 lg:py-32 border-b border-border-light relative overflow-hidden bg-slate-950">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 right-1/4 w-[600px] h-[600px] rounded-full bg-brand/5 blur-[160px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 sm:gap-12 lg:gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="rounded-[24px] sm:rounded-[32px] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 overflow-hidden shadow-2xl shadow-black/40">
                                <div className="p-4 sm:p-6 lg:p-8">
                                    <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                                                <Cpu size={17} className="text-brand" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Integration Hub</span>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-brand bg-brand/[0.1] px-3 py-1.5 rounded-full border border-brand/20 shrink-0">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> 5 connected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
                                        {[
                                            { name: "Claude", type: "Research & draft" },
                                            { name: "GPT", type: "Refine & optimize" },
                                            { name: "Cursor", type: "Sync workflows" },
                                            { name: "Zapier", type: "Automate triggers" },
                                            { name: "Slack", type: "Get notifications" },
                                        ].map((service, i) => (
                                            <div key={service.name} className="group flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-3 hover:border-brand/30 hover:bg-slate-800/60 transition-all">
                                                <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl border flex items-center justify-center shrink-0 ${i < 3 ? "bg-brand/10 border-brand/20" : "bg-slate-700/50 border-slate-600/50"}`}>
                                                    <Cpu size={13} className={i < 3 ? "text-brand" : "text-slate-500"} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-white truncate">{service.name}</p>
                                                    <p className="text-[9px] text-slate-500 font-medium truncate">{service.type}</p>
                                                </div>
                                                {i < 3 ? (
                                                    <span className="h-2 w-2 rounded-full bg-brand shrink-0" />
                                                ) : (
                                                    <span className="h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-dashed border-slate-700/30 bg-slate-800/10 p-3 hover:border-brand/30 hover:bg-slate-800/30 transition-all cursor-pointer">
                                            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-dashed border-slate-600/40 flex items-center justify-center shrink-0">
                                                <span className="text-slate-500 text-lg font-light leading-none">+</span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium truncate">Connect any tool via MCP</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-gradient-to-r from-brand/[0.04] to-brand/[0.01] border border-slate-800 p-4 sm:p-5">
                                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4">How it works</p>
                                        <div className="space-y-3 sm:space-y-4">
                                            {[
                                                { step: "1", label: "Research & draft", desc: "Your AI tool finds prospects and writes personalized outreach" },
                                                { step: "2", label: "Route through SharaSpot", desc: "Every message passes through delivery engine for inbox placement" },
                                                { step: "3", label: "Track & refine", desc: "Replies and signals flow back to your connected tools in real time" },
                                            ].map((item) => (
                                                <div key={item.step} className="flex items-start gap-3 sm:gap-4 group">
                                                    <div className="h-7 w-7 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 group-hover:bg-brand/25 transition-all">{item.step}</div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white mb-0.5">{item.label}</p>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-6 sm:mb-8">
                                <Cpu size={22} />
                            </div>
                            <p className="text-[10px] font-black text-brand uppercase tracking-[0.25em] mb-4">Feature 08</p>
                            <h3 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[1.05] mb-6">
                                Connect any AI tool. <span className="text-brand">Automate your entire outreach.</span>
                            </h3>
                            <p className="text-base text-slate-400 leading-relaxed mb-8 font-medium">
                                SharaSpot speaks MCP — the Model Context Protocol. Whether it is Claude, GPT, Cursor, or any other AI service, you can wire it directly into your outreach infrastructure. Research prospects, draft messages, analyze replies, and orchestrate campaigns — all through the tools you already use.
                            </p>
                            <div className="space-y-3 sm:space-y-4">
                                {[
                                    "Plug in any AI tool — Claude, ChatGPT, Cursor, or your own custom agent",
                                    "Research prospects, draft outreach, and refine messaging automatically",
                                    "Every message routes through SharaSpot's delivery engine for maximum inbox placement",
                                    "Replies and performance data flow back to your connected tools in real time"
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle size={16} className="text-brand mt-1 shrink-0" />
                                        <span className="text-sm font-medium text-slate-300">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURE 9: Quick Stats / CTA ── */}
            <div className="py-24 lg:py-28 relative overflow-hidden bg-gradient-to-b from-transparent via-brand/[0.10] to-transparent">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-brand/[0.05] blur-[140px]" />
                </div>
                <div className="max-w-6xl mx-auto px-6 relative text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/[0.06] border border-brand/10 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                        <Activity size={11} /> The SharaSpot Standard
                    </div>
                    <h3 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tighter leading-[1.05] mb-6">
                        One platform. <span className="text-brand">Every angle covered.</span>
                    </h3>
                    <p className="text-text-secondary text-base max-w-2xl mx-auto mb-16 font-medium">
                        From the first send to the signed deal. SharaSpot handles the infrastructure so you can focus on the conversation.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {[
                            { value: "10x", label: "Inbox placement vs. standard sending" },
                            { value: "0", label: "Burned domains with smart rotation" },
                            { value: "14 days", label: "To full sending capacity" },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-3xl bg-white border border-border-light p-6 text-center hover:border-brand/20 hover:shadow-lg hover:shadow-brand/5 transition-all">
                                <p className="text-4xl font-black text-text-primary mb-2">{stat.value}</p>
                                <p className="text-[11px] font-bold text-text-muted leading-relaxed">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                        {[
                            { icon: Phone, label: "Call tracking", color: "text-brand" },
                            { icon: Cpu, label: "MCP AI integrations", color: "text-blue-500" },
                            { icon: Users, label: "PRM pipeline", color: "text-cyan-600" },
                            { icon: BarChart3, label: "Signal analytics", color: "text-teal-600" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8F9FA] border border-border-light">
                                <item.icon size={14} className={item.color} />
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-brand text-white text-sm font-bold px-10 py-4 rounded-2xl hover:bg-brand/90 transition-all hover:scale-[1.02] shadow-xl shadow-brand/20 flex items-center gap-2"
                        >
                            Start your 7-day trial
                            <ArrowRight size={16} />
                        </button>
                        <p className="text-xs text-text-muted font-medium">Instant setup &middot; Cancel anytime</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
