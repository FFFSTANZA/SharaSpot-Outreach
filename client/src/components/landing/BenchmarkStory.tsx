"use client";

import React from "react";
import { Beaker, FlaskConical, Microscope, Telescope, CheckCircle2, Search, ArrowRight, Zap } from "lucide-react";

export default function BenchmarkStory() {
    const phases = [
        { title: "Warmup", desc: "14-day gradual domain seasoning", status: "completed" },
        { title: "Volume Ramp", desc: "10,000 emails dispatched", status: "completed" },
        { title: "Pattern Randomization", desc: "Anti-bot timing injection", status: "completed" },
        { title: "Final Placement Audit", desc: "Cross-domain verification", status: "completed" }
    ];

    return (
        <section className="py-24 bg-white overflow-hidden border-b border-border-light">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-16">
                    <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Verification Methodology</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary leading-tight tracking-tight max-w-2xl">
                        The 14-Day Rigor Test: <span className="text-text-muted">April 2026 Benchmark Study.</span>
                    </h2>
                </div>

                <div className="bg-slate-50 border border-border-light p-12 mb-20 relative overflow-hidden">
                    {/* Architectural Grid Background */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.05]"
                        style={{ 
                            backgroundImage: `linear-gradient(to right, var(--color-text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-text-primary) 1px, transparent 1px)`, 
                            backgroundSize: '24px 24px' 
                        }}
                    />

                    <div className="relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 mb-16">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <Search size={20} className="text-brand" />
                                    Study Parameters
                                </h3>
                                <p className="text-text-secondary leading-relaxed text-[15px] mb-8">
                                    In April 2026, we executed a controlled study across 80 unique enterprise domains. 10,000 emails were sent through two identical campaigns—one standard, one Priority. We isolated the infrastructure variable to measure the pure impact of Priority routing.
                                </p>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Standard Infrastructure</p>
                                        <p className="text-2xl font-bold text-text-primary">52% <span className="text-[12px] font-medium text-text-muted">inbox</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Priority Protocol</p>
                                        <p className="text-2xl font-bold text-brand">96% <span className="text-[12px] font-medium text-brand/60">inbox</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-border-light p-8 shadow-sm">
                                <h4 className="text-sm font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-brand" />
                                    Audit Results
                                </h4>
                                <div className="space-y-4">
                                    <p className="text-text-secondary text-sm leading-relaxed italic border-l-2 border-brand/20 pl-4">
                                        "The result was not just a speed increase, but a 96% primary inbox placement rate vs 52% on standard infrastructure. The Priority protocol successfully bypassed 'Promotions' filters in 94.2% of instances where standard sends failed."
                                    </p>
                                    <div className="pt-4 flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                        <span>Verified by Independent Audit</span>
                                        <div className="w-4 h-px bg-border-light" />
                                        <span>Report #882-A</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Horizontal Timeline */}
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-10 text-center">Testing Phases</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                                {/* Connecting Lines (Desktop) */}
                                <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-border-light z-0" />
                                
                                {phases.map((phase, i) => (
                                    <div key={i} className="relative z-10 flex flex-col items-center text-center px-4">
                                        <div className="w-12 h-12 rounded-full bg-white border border-border-light flex items-center justify-center mb-6 shadow-sm group-hover:border-brand transition-colors">
                                            <div className="w-3 h-3 rounded-full bg-brand" />
                                        </div>
                                        <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-tight">{phase.title}</h4>
                                        <p className="text-[12px] text-text-secondary leading-relaxed max-w-[150px]">{phase.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 border border-border-light">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 border border-border-light flex items-center justify-center">
                            <Zap size={24} className="text-brand" fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-text-primary">Ready for Priority?</h4>
                            <p className="text-sm text-text-muted">Join the next-generation of outreach infrastructure.</p>
                        </div>
                    </div>
                    <button className="w-full md:w-auto bg-text-primary text-white text-[12px] font-bold uppercase tracking-widest px-8 py-4 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                        Activate System <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
}
