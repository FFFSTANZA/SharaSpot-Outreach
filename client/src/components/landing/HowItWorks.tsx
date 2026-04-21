"use client";

import { Cloud, Zap, Server, ShieldCheck, Mail, Database, Terminal, ShieldAlert, UserCheck, Focus, Trophy } from "lucide-react";

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-white border-b border-border-light relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="max-w-2xl mb-20 text-center mx-auto">
                    <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-4 font-mono">The Path to a Signed Deal</p>
                    <h2 className="text-3xl lg:text-5xl font-bold text-text-primary tracking-tighter">Your outreach path, <br /><span className="text-brand">fully secured.</span></h2>
                </div>

                <div className="relative">
                    {/* Progress Connecting Line */}
                    <div className="absolute top-[60px] left-0 w-full h-[2px] bg-slate-100 hidden lg:block z-0" />

                    <div className="grid lg:grid-cols-3 gap-12 lg:gap-20 relative z-10">
                        {[
                            {
                                step: "01",
                                icon: UserCheck,
                                title: "Establish Primary Brand",
                                desc: "No one replies to a 'marketer.' We build a protective shell around your identity so you're seen as a peer from the very first message.",
                                value: ["Priority Identity Check", "Protected Presence", "Verified Professionalism"]
                            },
                            {
                                step: "02",
                                icon: Focus,
                                title: "Secure High-Value Targets",
                                desc: "Stop wasting time on dead ends. We scan your audience to ensure every send is directed toward a live, high-potential opportunity.",
                                value: ["Outcome Probability", "Target Verification", "Live Signal Mapping"]
                            },
                            {
                                step: "03",
                                icon: Trophy,
                                title: "Capture Primary Attention",
                                desc: "We bridge the gap between sending and replying. By landing at the perfect moment, we maximize the chances of a positive response.",
                                value: ["Primary Placement", "Reply-Stop Logic", "Growth Continuity"]
                            }
                        ].map((s, i) => (
                            <div key={i} className="group">
                                <div className="mb-10 relative inline-block">
                                    <div className="w-20 h-20 rounded-3xl bg-white border border-border-light shadow-sm flex items-center justify-center group-hover:border-brand/40 group-hover:shadow-xl transition-all duration-500 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-brand/[0.02] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        <s.icon size={32} className="text-brand transition-transform group-hover:scale-110" />
                                    </div>
                                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center border-4 border-white">
                                        {s.step}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-text-primary mb-4">{s.title}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed mb-8">{s.desc}</p>

                                <div className="space-y-3">
                                    {s.value.map((t, j) => (
                                        <div key={j} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Pipeline Status */}
                <div className="mt-24 p-8 border border-border-light rounded-3xl bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-1">Growth Status</p>
                            <p className="text-lg font-bold text-text-primary tracking-tight">Active for over 3,000 deal-makers. 96% Primary Inbox placement.</p>
                        </div>
                    </div>
                    <button className="bg-brand text-white text-xs font-bold px-10 py-4 rounded-xl hover:bg-brand/90 transition-all uppercase tracking-widest shadow-xl shadow-brand/20">
                        Secure your pipeline
                    </button>
                </div>
            </div>
        </section>
    );
}
