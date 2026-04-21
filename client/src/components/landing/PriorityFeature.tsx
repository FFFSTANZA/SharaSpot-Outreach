"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function PriorityFeature() {
    const router = useRouter();

    return (
        <section id="priority" className="py-24 lg:py-36 bg-[#0A0C0E] relative overflow-hidden">
            {/* Dark Mode Visual Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/[0.08] rounded-full blur-[140px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand/[0.04] rounded-full blur-[120px] -ml-32 -mb-32" />
                <div 
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ 
                        backgroundImage: `linear-gradient(var(--color-brand) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand) 1px, transparent 1px)`, 
                        backgroundSize: '40px 40px' 
                    }}
                />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-[1fr_480px] gap-20 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold tracking-[0.15em] uppercase mb-8">
                            <Zap size={12} fill="currentColor" />
                            Priority Infrastructure
                        </div>
                        
                        <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-8">
                            When your outreach <br />
                            <span className="text-brand">cannot wait for a queue.</span>
                        </h2>

                        <p className="text-lg text-white/60 leading-relaxed mb-12 max-w-xl">
                            Standard outreach tools batch your emails, leading to delays and unpredictable delivery. Priority Mail uses dedicated, high-reputation channels to ensure instant placement in the primary inbox.
                        </p>

                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="flex gap-4">
                                <div className="mt-1 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                    <ShieldCheck size={20} className="text-brand" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-[15px] mb-1">Reputation First</h4>
                                    <p className="text-white/40 text-[13px] leading-relaxed">Clean-only routing across all campaigns.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                    <Cpu size={20} className="text-brand" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-[15px] mb-1">Zero Latency</h4>
                                    <p className="text-white/40 text-[13px] leading-relaxed">Real-time routing decisions in &lt;1ms.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push("/priority")}
                            className="inline-flex items-center gap-2 text-brand font-bold text-sm hover:gap-3 transition-all group"
                        >
                            Explore Priority Infrastructure
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-brand/20 blur-3xl rounded-full opacity-20 animate-pulse" />
                        <div className="relative bg-[#14171A] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Routing Engine</span>
                                </div>
                                <span className="text-[10px] text-white/20">v2.0.4</span>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: "Inbox Placement", val: "96.4%", color: "text-brand" },
                                    { label: "Spam Detection Risk", val: "0.2%", color: "text-white/40" },
                                    { label: "Throughput", val: "50k/sec", color: "text-white" },
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                                            <span className="text-white/40">{stat.label}</span>
                                            <span className={stat.color}>{stat.val}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '100%' }}
                                                transition={{ duration: 1.5, delay: i * 0.2 }}
                                                className="h-full bg-brand rounded-full" 
                                                style={{ width: i === 1 ? '15%' : '100%' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-white/80 text-[14px] leading-relaxed italic">
                                    &quot;We switched to Priority and saw open rates jump from 12% to 41% in 48 hours. It&apos;s a completely different class of delivery.&quot;
                                </p>
                                <div className="mt-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand/20" />
                                    <div>
                                        <p className="text-white text-[12px] font-bold">Arnav S.</p>
                                        <p className="text-white/30 text-[10px]">Founder, Series A</p>
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
