"use client";

import { useRouter } from "next/navigation";
import { Zap, Clock, ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, Target, Crown } from "lucide-react";

export default function PriorityFeature() {
    const router = useRouter();

    return (
        <section id="priority" className="py-24 bg-slate-50/80 relative overflow-hidden border-y border-slate-200">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand/5 blur-[100px] rounded-full" />
            </div>
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-32 items-center">

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/[0.05] border border-brand/10 text-brand text-[10px] font-bold tracking-widest uppercase mb-8">
                            <Zap size={10} fill="currentColor" /> The Priority Protocol
                        </div>

                        <h2 className="text-3xl lg:text-5xl font-bold text-text-primary tracking-tighter leading-[1.05] mb-8">
                            When an email <span className="text-brand italic">absolutely</span> has to land.
                        </h2>

                        <p className="text-lg text-text-secondary leading-relaxed mb-10 font-medium">
                            Some outreach is too important to leave to chance. Priority Protocol ensures your most critical messages bypass the noise and land exactly where they will be seen by the people who make the final decisions.
                        </p>

                        <div className="space-y-6 mb-12">
                            {[
                                { title: "Guaranteed Primary Attention", desc: "Bypass the secondary tabs where marketing noise goes to be ignored." },
                                { title: "Strategic Decision Windows", desc: "We ensure your inquiry arrives during the exact window when your target is most likely to act." },
                                { title: "Peer-to-Peer Authority", desc: "Your identity is protected so you always appear as a professional peer, never a solicitor." }
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
                        <div className="bg-[#fcfcfc] border border-border-light rounded-3xl p-8 lg:p-12 relative shadow-sm">
                            <div className="space-y-12">
                                {/* Standard Send */}
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Standard Sending</span>
                                        <span className="text-[11px] font-bold text-red-500">Often Ignored</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-red-400 w-[48%] rounded-full opacity-50" />
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] text-text-muted font-bold bg-white border border-border-light px-2 py-0.5 rounded uppercase">Buried in Tabs</span>
                                        <span className="text-[10px] text-text-muted font-bold bg-white border border-border-light px-2 py-0.5 rounded uppercase">Robotic Pattern</span>
                                        <span className="text-[10px] text-text-muted font-bold bg-white border border-border-light px-2 py-0.5 rounded uppercase">Delayed Impact</span>
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
                                        <span className="text-[11px] font-bold text-brand">96% Visibility</span>
                                    </div>
                                    <div className="h-4 bg-brand-light rounded-full overflow-hidden mb-2 border border-brand/10">
                                        <div className="h-full bg-brand w-[96%] rounded-full shadow-lg shadow-brand/20 animate-pulse" />
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] text-brand font-bold bg-brand-light px-2 py-1 rounded border border-brand/20 uppercase tracking-tight">Immediate Sight</span>
                                        <span className="text-[10px] text-brand font-bold bg-brand-light px-2 py-1 rounded border border-brand/20 uppercase tracking-tight">Strategic Timing</span>
                                        <span className="text-[10px] text-brand font-bold bg-brand-light px-2 py-1 rounded border border-brand/20 uppercase tracking-tight">Elite Authority</span>
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
