"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";

export default function PriorityFeature() {
    const router = useRouter();

    return (
        <section id="priority" className="py-16 sm:py-20 lg:py-24 bg-[#F8F9FA]/80 relative overflow-hidden border-y border-border-light">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand/5 blur-[100px] rounded-full" />
            </div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 sm:gap-14 lg:gap-32 items-center">

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/[0.05] border border-brand/10 text-brand text-[10px] font-bold tracking-widest uppercase mb-8">
                            <Zap size={10} fill="currentColor" /> The Priority Protocol
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-text-primary tracking-tighter leading-[1.08] mb-6 sm:mb-8">
                            When an email <span className="text-brand italic">really</span> matters.
                        </h2>

                        <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 sm:mb-10 font-medium">
                            Some outreach is too important to send with generic batch behavior. Priority Protocol applies stricter timing, reputation, and content controls to your most critical messages.
                        </p>

                        <div className="space-y-6 mb-12">
                            {[
                                { title: "Inbox-Risk Reduction", desc: "Reduce secondary-tab and spam risk by avoiding marketing-style sending footprints." },
                                { title: "Strategic Timing Controls", desc: "Schedule important outreach around working windows instead of blasting fixed-volume bursts." },
                                { title: "Sender Health Protection", desc: "Use tighter controls on the messages that matter most so one campaign does not overheat a sender." }
                            ].map((f, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center shrink-0 mt-1">
                                        <CheckCircle2 size={14} className="text-brand" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary mb-1 uppercase tracking-tight">{f.title}</h4>
                                        <p className="text-[13px] text-text-secondary leading-relaxed font-medium">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => router.push("/priority")}
                            className="bg-brand text-white text-sm font-bold px-8 py-3 rounded-lg hover:bg-brand/90 transition-all flex items-center justify-center gap-2 group w-full sm:w-auto uppercase tracking-widest shadow-lg shadow-brand/20"
                        >
                            Explore Priority Outcomes
                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    <div className="relative">
                        {/* Comparison Visual */}
                        <div className="bg-[#fcfcfc] border border-border-light rounded-3xl p-5 sm:p-8 lg:p-12 relative shadow-sm">
                            <div className="space-y-10 sm:space-y-12">
                                {/* Standard Send */}
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Standard Sending</span>
                                        <span className="text-[11px] font-bold text-red-500">Higher Risk</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-red-400 w-[48%] rounded-full opacity-50" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        <span className="text-[9px] sm:text-[10px] text-text-muted font-bold bg-white border border-border-light px-2 sm:px-2 py-1 sm:py-0.5 rounded uppercase">More Tab Risk</span>
                                        <span className="text-[9px] sm:text-[10px] text-text-muted font-bold bg-white border border-border-light px-2 sm:px-2 py-1 sm:py-0.5 rounded uppercase">Fixed Pattern</span>
                                        <span className="text-[9px] sm:text-[10px] text-text-muted font-bold bg-white border border-border-light px-2 sm:px-2 py-1 sm:py-0.5 rounded uppercase">Weak Timing</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-border-light w-full relative">
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
                                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-lg transform rotate-90">
                                            <TrendingUp size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Priority Send */}
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[11px] font-bold text-brand uppercase tracking-widest">SharaSpot Priority</span>
                                        <span className="text-[11px] font-bold text-brand">Tighter Controls</span>
                                    </div>
                                    <div className="h-4 bg-brand-light rounded-full overflow-hidden mb-2 border border-brand/10">
                                        <div className="h-full bg-brand w-[88%] rounded-full shadow-lg shadow-brand/20 animate-pulse" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        <span className="text-[9px] sm:text-[10px] text-brand font-bold bg-brand-light px-2 sm:px-2 py-1 sm:py-1 rounded border border-brand/20 uppercase tracking-tight">Risk-Aware Timing</span>
                                        <span className="text-[9px] sm:text-[10px] text-brand font-bold bg-brand-light px-2 sm:px-2 py-1 sm:py-1 rounded border border-brand/20 uppercase tracking-tight">Controlled Volume</span>
                                        <span className="text-[9px] sm:text-[10px] text-brand font-bold bg-brand-light px-2 sm:px-2 py-1 sm:py-1 rounded border border-brand/20 uppercase tracking-tight">Cleaner Footprint</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
