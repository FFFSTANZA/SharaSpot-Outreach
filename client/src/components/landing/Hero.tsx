"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight, CheckCircle2, Star, Mail, Search, Inbox,
    Zap, ShieldCheck, Clock, Send, Bell, LayoutDashboard,
    Users, Settings, BarChart3, ChevronRight, AlertCircle, TrendingUp,
    MousePointer2, Plus
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Hero() {
    const router = useRouter();
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({
        sent: 340210,
        replies: 32,
        index: "Elite"
    });

    const startSimulation = useCallback(() => {
        if (sending) return;
        setSending(true);
        setProgress(0);

        const pInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(pInterval);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);

        setTimeout(() => {
            setSending(false);
            setStats(prev => ({
                ...prev,
                sent: prev.sent + 1,
                replies: prev.replies + (Math.random() > 0.5 ? 1 : 0)
            }));
        }, 3000);
    }, [sending]);

    // Auto-start once
    useEffect(() => {
        const timer = setTimeout(startSimulation, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-36 lg:pb-48 overflow-hidden bg-[#f4f7f9]">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand/10 blur-[150px] rounded-full opacity-60" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full opacity-60" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative text-center">

                {/* Headline Section */}
                <div className="max-w-4xl mx-auto mb-20 lg:mb-28">
                    <div className="flex justify-center mb-8">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/5 border border-brand/20 text-brand text-[10px] font-black tracking-widest uppercase shadow-sm">
                            <ShieldCheck size={12} /> High-Value Outreach Active
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold text-text-primary tracking-tighter leading-[1.05] mb-8">
                        Every email that hits <span className="text-red-500">spam</span> <br />
                        is a deal that <span className="text-red-500 italic">never</span> happened.
                    </h1>

                    <p className="text-lg lg:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10 font-medium font-sans" data-aeo-summary="SharaSpot is an inbox-delivery outreach platform for founders.">
                        Don't let your best work die in a promotions tab. SharaSpot is the only solution designed for high-stakes founders who need their outreach to land exactly where it counts: the primary inbox.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full sm:w-auto bg-brand text-white text-sm font-bold px-10 py-4.5 rounded-2xl hover:bg-brand/90 transition-all hover:shadow-2xl flex items-center justify-center gap-3 group uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-brand/20"
                        >
                            Secure Your Placement
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-text-primary uppercase tracking-tight">
                                <ShieldCheck size={16} className="text-brand" />
                                Verified Outcomes
                            </div>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">96% Primary Inbox placement</p>
                        </div>
                    </div>
                </div>

                {/* Highly Interactive Platform Dashboard */}
                <div className="relative mx-auto max-w-6xl group/dashboard">
                    <div className="absolute -inset-16 bg-gradient-to-b from-brand/20 via-brand/10 to-transparent blur-[140px] opacity-50 -z-10 rounded-[80px]" />

                    {/* The "App" Frame */}
                    <div className="bg-slate-200/50 backdrop-blur-3xl border border-slate-300/60 rounded-[48px] p-2 sm:p-4 shadow-[0_120px_240px_-40px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.08)] ring-2 ring-white/30 overflow-hidden transition-all duration-700 group-hover/dashboard:scale-[1.01] group-hover/dashboard:shadow-[0_140px_300px_-50px_rgba(0,0,0,0.35)]">
                        <div className="bg-white rounded-[36px] border border-slate-200 flex h-[480px] sm:h-[600px] md:h-[740px] overflow-x-auto overflow-y-hidden text-left relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">

                            {/* Pro Sidebar */}
                            <div className="w-60 bg-[#f8fafc] border-r border-border-light flex flex-col py-8 px-4">
                                <div className="mb-10 px-3 shrink-0">
                                    <Logo size="sm" />
                                </div>

                                <div className="mb-8 shrink-0 px-2">
                                    <button
                                        onClick={startSimulation}
                                        className="w-full bg-brand text-white text-[11px] font-bold h-10 rounded-xl flex items-center justify-start gap-3 px-4 shadow-lg shadow-brand/20 hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <Plus size={16} />
                                        <span>New Campaign</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                                    <div>
                                        <h3 className="px-3 mb-3 text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Navigation</h3>
                                        <div className="space-y-1">
                                            {[
                                                { icon: Inbox, label: "All Campaigns", active: true },
                                                { icon: Star, label: "Starred" },
                                                { icon: Clock, label: "Scheduled" },
                                                { icon: Send, label: "Sent" },
                                            ].map((item, i) => (
                                                <button
                                                    key={i}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${item.active ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-slate-200/50 hover:text-text-primary'}`}
                                                >
                                                    <item.icon size={18} />
                                                    <span className="text-[12px]">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="px-3 mb-3 text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Outreach</h3>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:bg-slate-200/50 hover:text-text-primary cursor-pointer transition-all">
                                                <Users size={18} />
                                                <span className="text-[12px]">PRM</span>
                                            </div>
                                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:bg-slate-200/50 hover:text-text-primary cursor-pointer transition-all">
                                                <BarChart3 size={18} />
                                                <span className="text-[12px]">Analytics</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto px-2 pt-4 border-t border-border-light text-center">
                                    <div className="flex items-center gap-2 mb-2 justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                        <p className="text-[9px] font-bold text-text-muted uppercase">Protocol: Active</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Context Area */}
                            <div className="flex-1 bg-white flex flex-col min-w-0">
                                {/* TopBar */}
                                <div className="h-16 border-b border-border-light flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative w-full max-w-sm">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/30" />
                                            <input type="text" placeholder="Search campaigns..." className="w-full text-[12px] bg-slate-50 border border-slate-200/60 py-2 pl-10 pr-3 rounded-lg focus:outline-none" disabled />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 w-px bg-border-light mx-2" />
                                        <div className="relative p-1">
                                            <Bell size={18} className="text-text-muted" />
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 border border-indigo-700 shadow-lg flex items-center justify-center text-white text-[10px] font-black">SA</div>
                                    </div>
                                </div>

                                {/* Dashboard Tabs */}
                                <div className="px-8 border-b border-border-light flex items-center gap-8 bg-white">
                                    {[
                                        { label: "Monitoring", active: true },
                                        { label: "Inbox", active: false },
                                        { label: "Billing", active: false },
                                        { label: "Account", active: false },
                                        { label: "Settings", active: false },
                                    ].map((tab, i) => (
                                        <div
                                            key={i}
                                            className={`py-4 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all border-b-2 -mb-px ${tab.active
                                                ? "border-brand text-brand"
                                                : "border-transparent text-text-muted/60 hover:text-text-primary"
                                                }`}
                                        >
                                            {tab.label}
                                        </div>
                                    ))}
                                </div>

                                {/* App Analytics */}
                                <div className="px-8 py-6 grid grid-cols-4 gap-4 bg-[#fcfcfc] border-b border-border-light">
                                    {[
                                        { icon: Mail, label: "Visible Batch", val: stats.sent.toLocaleString(), sub: "Last 24h", trend: "+1.2%" },
                                        { icon: CheckCircle2, label: "Success Rate", val: "96%", color: "text-brand", sub: "Priority Node", trend: "Stable" },
                                        { icon: TrendingUp, label: "Reputation", val: stats.index, sub: "Level 4 State", trend: "Peak" },
                                        { icon: BarChart3, label: "Engagement", val: `${stats.replies}%`, sub: "Replies Detected", trend: "+0.4%" },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white rounded-xl border border-border-light p-4 shadow-sm hover:border-brand/40 hover:shadow-md transition-all cursor-default group/card">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-1.5 rounded-lg bg-slate-50 group-hover/card:bg-brand/5 transition-colors">
                                                    <s.icon size={16} className={s.color || "text-text-muted"} />
                                                </div>
                                                <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest">{s.trend}</span>
                                            </div>
                                            <div className={`text-2xl font-black tracking-tighter ${s.color || "text-text-primary"}`}>{s.val}</div>
                                            <div className="text-[9px] font-bold text-text-muted mt-2 border-t border-border-light pt-2 uppercase tracking-widest flex justify-between">
                                                <span>{s.label}</span>
                                                <span className="text-text-muted/40">{s.sub}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Platform Content */}
                                <div className="flex-1 p-8 overflow-y-auto relative custom-scrollbar bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-[16px] font-bold tracking-tight text-text-primary">Recent Monitoring</h2>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-brand-light text-brand uppercase border border-brand/10">96% Delivery Focus</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(0,166,62,0.5)]" />
                                            Active Feed
                                        </div>
                                    </div>

                                    {/* Actionable Table */}
                                    <div className="space-y-3 relative">
                                        {[
                                            { to: "Sam Altman", initials: "SA", color: "bg-orange-100 text-orange-600", sub: "Strategic Inquiry: SharaSpot Delivery Engine", status: "SENT", time: "Just now", badge: "REPLIED", signal: 98 },
                                            { to: "Naval Ravikant", initials: "NR", color: "bg-blue-100 text-blue-600", sub: "Outreach: Precision Scaling Infrastructure", status: "SENT", time: "4m ago", badge: "DELIVERED", signal: 99 },
                                            { to: "Marc Andreessen", initials: "MA", color: "bg-purple-100 text-purple-600", sub: "Private Invitation: SharaSpot Protocol V2", status: sending ? "SENDING" : "SENT", time: sending ? "Syncing..." : "12m ago", badge: sending ? "ACTIVE" : "DELIVERED", signal: sending ? 45 : 97 },
                                            { to: "Jensen Huang", initials: "JH", color: "bg-green-100 text-green-600", sub: "NVIDIA Partnership: SharaSpot Integration", status: "SENT", time: "31m ago", badge: "DELIVERED", signal: 100 },
                                        ].map((row, i) => (
                                            <div key={i} className={`p-4 rounded-2xl border bg-white flex items-center justify-between transition-all group/row ${row.status === 'SENDING' ? 'border-brand shadow-[0_0_40px_rgba(0,166,62,0.12)] ring-1 ring-brand/20' : 'border-border-light hover:border-brand/40 hover:shadow-lg shadow-sm'}`}>
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl ${row.color} flex items-center justify-center text-[12px] font-black border border-white shadow-sm flex-shrink-0 group-hover/row:scale-105 transition-transform`}>
                                                        {row.initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[13px] font-black text-text-primary tracking-tight">{row.to}</span>
                                                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest ${row.badge === 'REPLIED' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-brand/5 text-brand border border-brand/10'}`}>{row.badge}</span>
                                                            <div className="flex items-center gap-1 ml-1 overflow-hidden">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <div key={s} className={`w-1 h-3 rounded-full ${s * 20 <= row.signal ? 'bg-brand' : 'bg-slate-100'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-text-secondary font-medium truncate max-w-[340px] group-hover/row:text-text-primary transition-colors">{row.sub}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-6">
                                                    <div className="hidden sm:block">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${row.status === 'SENDING' ? 'text-brand' : 'text-text-primary'}`}>{row.status}</p>
                                                        <p className="text-[9px] text-text-muted font-bold uppercase leading-none mt-1 tracking-tight">{row.time}</p>
                                                    </div>
                                                    <div className="p-2 rounded-lg bg-slate-50 border border-transparent group-hover/row:border-border-light group-hover/row:bg-white transition-all">
                                                        <ChevronRight size={16} className="text-text-muted/30 group-hover/row:text-brand" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mouse Animation for Button */}
                                    {!sending && progress === 0 && (
                                        <div className="absolute top-[180px] right-[40px] animate-pulse pointer-events-none">
                                            <MousePointer2 size={24} className="text-brand fill-white shadow-2xl" />
                                            <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-brand/20 animate-ping" />
                                        </div>
                                    )}

                                    {/* Sending Progress Component */}
                                    {sending && (
                                        <div className="absolute bottom-10 left-10 right-10 p-6 rounded-[32px] bg-slate-900 text-white flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-500 z-50">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20">
                                                    <Send size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-black uppercase tracking-[0.15em] text-brand">Node SH-904 Active</p>
                                                    <p className="text-sm font-bold opacity-80">Syncing jitter-mimicry sequence...</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span className="text-xl font-black tabular-nums">{progress}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
