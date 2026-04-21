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

                {/* ── HERO ── */}
                <section className="relative pt-20 pb-28 overflow-hidden bg-white border-b border-border-light">
                    {/* Faint grid */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{ backgroundImage: "linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
                    />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/[0.05] rounded-full blur-[120px] -mr-64 -mt-32 pointer-events-none" />

                    <div className="max-w-6xl mx-auto px-6 relative">
                        {/* Eyebrow */}
                        <div className="flex items-center gap-2 mb-8">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-light border border-brand-muted text-brand text-[10px] font-bold tracking-widest uppercase">
                                <Zap size={11} fill="currentColor" /> Priority Mail
                            </span>
                            <span className="text-text-muted text-[11px]">—</span>
                            <span className="text-text-muted text-[11px] font-medium">Verified Performance, April 2026</span>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-[1.1] mb-6">
                                    Your most important emails deserve a different class of delivery.
                                </h1>
                                <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
                                    SharaSpot Priority Mail is the only outreach channel proven to reach the primary inbox at 96% across Google, Microsoft, and enterprise mail servers. Not the Promotions tab. <strong className="text-text-primary">The primary inbox.</strong>
                                </p>
                                <div className="flex flex-wrap gap-4 items-center mb-10">
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2 group"
                                    >
                                        Activate Priority Mail
                                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                    <a href="#benchmark" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
                                        View benchmarks <ChevronRight size={14} />
                                    </a>
                                </div>
                                <div className="flex flex-wrap gap-6">
                                    {[
                                        { val: "96%", label: "Inbox placement rate" },
                                        { val: "50K+", label: "Priority decisions/sec" },
                                        { val: "< 1ms", label: "Routing decision time" },
                                    ].map((s) => (
                                        <div key={s.val}>
                                            <p className="text-2xl font-bold text-brand">{s.val}</p>
                                            <p className="text-[11px] text-text-muted font-medium mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Live pulse card */}
                            <div className="relative hidden lg:block">
                                <div className="bg-white border border-border-light rounded-2xl shadow-elevated overflow-hidden">
                                    <div className="px-6 pt-5 pb-4 border-b border-border-light flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Live Delivery Report</span>
                                        </div>
                                        <span className="text-[10px] text-text-muted">Updated just now</span>
                                    </div>
                                    <div className="divide-y divide-border-light">
                                        {[
                                            { email: "partner@acme.com", status: "PRIMARY INBOX", time: "0.8s", icon: "✓" },
                                            { email: "cto@techcorp.io", status: "PRIMARY INBOX", time: "1.1s", icon: "✓" },
                                            { email: "founder@seed.vc", status: "PRIMARY INBOX", time: "0.6s", icon: "✓" },
                                            { email: "hiring@bigco.com", status: "PRIMARY INBOX", time: "1.3s", icon: "✓" },
                                        ].map((row, i) => (
                                            <div key={i} className="px-6 py-3.5 flex items-center justify-between">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-brand-light text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                        {row.email[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-[13px] text-text-secondary font-medium truncate">{row.email}</span>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded uppercase tracking-wider">{row.status}</span>
                                                    <span className="text-[11px] text-text-muted">{row.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-6 py-4 bg-brand-light flex items-center justify-between">
                                        <span className="text-[12px] font-bold text-brand">4 of 4 reached primary inbox</span>
                                        <span className="text-[11px] text-text-muted">100% this session</span>
                                    </div>
                                </div>
                                {/* Floating badge */}
                                <div className="absolute -bottom-4 -left-6 bg-white border border-border-light shadow-card rounded-xl px-4 py-3">
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">vs. Standard Email</p>
                                    <p className="text-lg font-bold text-text-primary">+85% Inbox Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── TRUST BAR ── */}
                <section className="py-8 border-b border-border-light bg-white">
                    <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-8 items-center justify-between">
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Verified results across</p>
                        {["Google Workspace", "Microsoft 365", "Outlook", "Exchange", "Yahoo Mail"].map((p) => (
                            <div key={p} className="flex items-center gap-2">
                                <CheckCircle2 size={13} className="text-brand" />
                                <span className="text-[12px] font-semibold text-text-secondary">{p}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── BENCHMARK ── */}
                <section id="benchmark" className="py-24 bg-[#fcfcfc] border-b border-border-light">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start mb-16 gap-6">
                            <div>
                                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-3">April 2026 — Independent Benchmark Study</p>
                                <h2 className="text-3xl font-bold text-text-primary leading-tight">Priority Mail vs. Standard Email.<br />The numbers speak.</h2>
                            </div>
                            <div className="text-sm text-text-secondary border border-border-light rounded-xl px-5 py-4 max-w-xs bg-white shadow-card">
                                <p className="font-bold text-text-primary text-[13px] mb-1">Methodology</p>
                                <p className="leading-relaxed">Tested across 80 test recipient domains using controlled sends at equal volume, content, and cadence. Only the sending infrastructure differed.</p>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {benchmarks.map((res, i) => (
                                <div key={i} className="bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-elevated transition-shadow">
                                    <div className="px-6 pt-6 pb-4 border-b border-border-light">
                                        <div className="inline-block text-[10px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded mb-3 uppercase tracking-wider">{res.improvement}</div>
                                        <h3 className="text-[15px] font-bold text-text-primary">{res.scenario}</h3>
                                    </div>

                                    {/* Score bars */}
                                    <div className="px-6 py-5 space-y-3 border-b border-border-light">
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                                                <span>Standard Email</span>
                                                <span>{res.normalScore}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-300 rounded-full" style={{ width: `${res.normalScore}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-brand mb-1.5 uppercase tracking-wider">
                                                <span>SharaSpot Priority</span>
                                                <span>{res.priorityScore}%</span>
                                            </div>
                                            <div className="h-2 bg-brand-light rounded-full overflow-hidden">
                                                <div className="h-full bg-brand rounded-full" style={{ width: `${res.priorityScore}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 space-y-2.5">
                                        {res.metrics.map((m, j) => (
                                            <div key={j} className="flex items-center justify-between">
                                                <span className="text-[11px] text-text-muted font-medium">{m.label}</span>
                                                <div className="flex gap-3 items-center">
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

                {/* ── WHAT PRIORITY FEELS LIKE ── */}
                <section className="py-24 bg-white border-b border-border-light">
                    <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_1fr] gap-24 items-center">
                        <div>
                            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">The Priority Difference</p>
                            <h2 className="text-3xl font-bold text-text-primary mb-6 leading-tight">
                                The same email. Two very different outcomes.
                            </h2>
                            <p className="text-text-secondary leading-relaxed mb-10 text-[15px]">
                                Priority Mail doesn't just send your email faster. It engineers the conditions for your email to land in the right place, at the right moment, every single time. It's not just delivery—it's strategic placement at scale.
                            </p>

                            <div className="space-y-5">
                                {[
                                    { title: "Primary inbox, not promotions", desc: "Priority routes exclusively for inbox placement. Your emails aren't batched with marketing noise." },
                                    { title: "Reputation-protected sending", desc: "Every send is routed through isolated, clean infrastructure. Your sender score stays pristine." },
                                    { title: "Intelligent timing decisions", desc: "A proprietary system makes thousands of micro-decisions per message to maximize reception." },
                                    { title: "Real-time reliability", desc: "50,000+ routing decisions per second. Latency under 1 millisecond. Zero compromise." },
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center mt-0.5 shrink-0">
                                            <CheckCircle2 size={12} className="text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary mb-0.5">{f.title}</p>
                                            <p className="text-[13px] text-text-secondary leading-relaxed">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Two-state comparison */}
                        <div className="space-y-4">
                            <div className="rounded-xl border border-red-100 bg-red-50/50 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-red-600">Without Priority</span>
                                </div>
                                <div className="space-y-2.5">
                                    {["Batch-processed with thousands of others", "Robotic timing patterns flagged by ESPs", "Shared IP pool—one bad sender affects you", "Promotions tab, spam folder, or silent drop"].map((t, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="text-red-400 font-bold text-sm mt-0.5">×</span>
                                            <span className="text-[13px] text-red-700 font-medium">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-brand-muted bg-brand-light p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-brand" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand">With SharaSpot Priority</span>
                                </div>
                                <div className="space-y-2.5">
                                    {["Isolated, clean infrastructure per send", "Human-like delivery timing, undetectable", "96% primary inbox placement, benchmarked", "Decisions made in under 1 millisecond"].map((t, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle2 size={14} className="text-brand mt-0.5 shrink-0" />
                                            <span className="text-[13px] text-text-primary font-medium">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-text-primary text-white text-sm font-bold py-3.5 rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 group"
                            >
                                Start sending with Priority
                                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── USE CASES ── */}
                <section className="py-24 bg-[#fcfcfc] border-b border-border-light">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                            <div className="lg:pt-2">
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">Who uses Priority</p>
                                <h3 className="text-2xl font-bold text-text-primary leading-snug">Situations where your email cannot fail.</h3>
                            </div>
                            <div className="divide-y divide-border-light">
                                {[
                                    { num: "01", title: "A founder pitching investors.", desc: "A warm intro to a partner at a fund has a 6-hour window before it's buried under 200 other emails. Priority makes sure yours is in the inbox when they open it at 7am, not in Promotions when they clear their queue at 3pm." },
                                    { num: "02", title: "A recruiter chasing a $300k hire.", desc: "Top candidates aren't scrolling promotional tabs. If the offer letter or first touchpoint goes there, you've already lost. Priority routes to the inbox where the decision is made." },
                                    { num: "03", title: "A sales lead at the 1-yard line.", desc: "The follow-up that closes a $200k deal cannot sit in a queue for 40 minutes or land in spam. That's not a risk. That's a loss. Priority sends it the moment you hit send." },
                                    { num: "04", title: "A product launch to your entire list.", desc: "Announcing something big? You need every person on that list to see it within the hour, not trickled over 3 days by an ESP limiter. Priority handles scale without sacrificing placement." },
                                ].map((u, i) => (
                                    <div key={i} className="flex gap-8 py-8 first:pt-0 last:pb-0 group">
                                        <span className="text-[11px] font-bold text-text-muted pt-1 tabular-nums w-6 shrink-0">{u.num}</span>
                                        <div>
                                            <h4 className="text-[15px] font-bold text-text-primary mb-2 group-hover:text-brand transition-colors">{u.title}</h4>
                                            <p className="text-[13px] text-text-secondary leading-relaxed">{u.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SOCIAL PROOF / TRUST ── */}
                <section className="py-24 bg-white border-b border-border-light">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-16">
                            <div className="lg:pt-2">
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4">From users</p>
                                <h3 className="text-2xl font-bold text-text-primary leading-snug">What they said after the first send.</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-text-muted text-[13px]">Real accounts. Real sends. No cherry-picked edge cases.</p>
                                <div className="flex gap-6 pt-1">
                                    <div>
                                        <p className="text-xl font-bold text-brand">41%</p>
                                        <p className="text-[11px] text-text-muted">avg. open rate on investor emails</p>
                                    </div>
                                    <div className="w-px bg-border-light" />
                                    <div>
                                        <p className="text-xl font-bold text-text-primary">54% → 94%</p>
                                        <p className="text-[11px] text-text-muted">inbox placement in first week</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-px">
                            {[
                                { quote: "I was shocked. I sent a cold pitch to a partner I've never spoken with and got a reply in 4 hours. It landed in their primary inbox.", name: "Arnav S.", role: "Founder, Series A startup" },
                                { quote: "We used to get 12% open rates on investor emails. After switching to Priority, we're consistently above 41%. The deliverability is just on another level.", name: "Priya R.", role: "VP Growth, Scale-up" },
                                { quote: "Priority Mail is the closest thing I've seen to guaranteed inbox delivery. Not a marketing claim—I watched our placement stats move from 54% to 94% in a week.", name: "Olu T.", role: "Head of Partnerships" },
                            ].map((t, i) => (
                                <div key={i} className="flex flex-col sm:flex-row gap-8 py-8 border-t border-border-light first:border-t-0">
                                    <div className="sm:w-40 shrink-0">
                                        <p className="text-sm font-bold text-text-primary">{t.name}</p>
                                        <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">{t.role}</p>
                                    </div>
                                    <p className="text-[15px] text-text-secondary leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FINAL CTA ── */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand/[0.04] blur-3xl pointer-events-none" />
                    <div className="max-w-6xl mx-auto px-6 relative">
                        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                            <div>
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Start today</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-brand mb-3">Priority Mail included in every plan — $20/month</p>
                                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight mb-6">
                                    The next partner, investor, or hire you need is checking their inbox right now.
                                </h2>
                                <p className="text-[15px] text-text-secondary leading-relaxed mb-10 max-w-xl">
                                    Every day without Priority is another critical email sitting in a Promotions tab, waiting for someone to notice. The people you're trying to reach open their primary inbox. That's where you need to be.
                                </p>
                                <div className="flex flex-wrap items-center gap-6">
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="bg-brand text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2 group"
                                    >
                                        Start free trial
                                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                    <p className="text-xs text-text-muted">7-day free trial. No credit card required.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </MailAppContainer>
    );
}
