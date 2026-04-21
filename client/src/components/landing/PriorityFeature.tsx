"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function PriorityFeature() {
    const router = useRouter();

    return (
        <section id="priority" className="py-24 lg:py-36 bg-[#0A0C0E] relative overflow-hidden">
            {/* Architectural Visual Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute inset-0 opacity-[0.05]"
                    style={{ 
                        backgroundImage: `linear-gradient(var(--color-brand) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand) 1px, transparent 1px)`, 
                        backgroundSize: '48px 48px' 
                    }}
                />
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-30" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-brand/30 bg-brand/5 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-10">
                            <Zap size={12} fill="currentColor" />
                            Transmission Layer: Priority
                        </div>
                        
                        <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tighter leading-[1.05] mb-8">
                            Unbreakable <br />
                            <span className="text-brand">delivery protocol.</span>
                        </h2>

                        <p className="text-lg text-white/60 leading-relaxed mb-12 max-w-xl">
                            Eliminate the uncertainty of shared infrastructure. Priority routing utilizes dedicated verification nodes to guarantee placement in the primary inbox.
                        </p>

                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="flex gap-4">
                                <div className="mt-1 w-10 h-10 border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={20} className="text-brand" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-[14px] uppercase tracking-wide mb-1">Reputation</h4>
                                    <p className="text-white/40 text-[12px] leading-relaxed">Verified clean-only routing paths.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 w-10 h-10 border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                    <Cpu size={20} className="text-brand" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-[14px] uppercase tracking-wide mb-1">Latency</h4>
                                    <p className="text-white/40 text-[12px] leading-relaxed">Decision cycle under 0.4ms.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push("/priority")}
                            className="bg-brand text-white text-[11px] font-bold uppercase tracking-widest px-8 py-4 flex items-center gap-3 hover:bg-brand/90 transition-all shadow-[0_0_20px_rgba(0,166,62,0.2)]"
                        >
                            View Technical Benchmarks
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="relative bg-[#111315] border border-white/10 p-10 shadow-2xl overflow-hidden">
                            {/* Grid Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-brand" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Routing Engine Active</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-brand" />
                                        <span className="text-[10px] font-mono text-white/30">0.02ms</span>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {[
                                        { label: "Primary Placement", val: "96.4%", p: 96 },
                                        { label: "Spam Mitigation", val: "99.8%", p: 99 },
                                        { label: "Pattern Variance", val: "Dynamic", p: 100 },
                                    ].map((stat, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-3">
                                                <span className="text-white/40">{stat.label}</span>
                                                <span className={i === 0 ? "text-brand" : "text-white"}>{stat.val}</span>
                                            </div>
                                            <div className="h-px w-full bg-white/5 relative">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${stat.p}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className="absolute inset-y-0 left-0 bg-brand shadow-[0_0_10px_rgba(0,166,62,0.4)]" 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-6 border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Output</span>
                                    </div>
                                    <p className="text-white/70 text-[13px] leading-relaxed font-mono">
                                        &gt; Connection established...<br />
                                        &gt; Pattern variance injected...<br />
                                        &gt; Priority lane secured...<br />
                                        &gt; Target: Primary Inbox [Verified]
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Activity({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
