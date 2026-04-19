"use client";

import { Zap, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function PriorityFeature() {
    const router = useRouter();

    return (
        <section id="priority" className="py-24 bg-text-primary text-white overflow-hidden relative">
            {/* Background elements for 'tactical' feel */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div className="animate-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/20 border border-brand/50 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
                        <Zap size={14} className="fill-current" />
                        Most Powerful Feature
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-8">
                        Bypass the noise with <br />
                        <span className="text-brand">Priority Email.</span>
                    </h2>

                    <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                        Standard queues are congested, slow, and predictable. Our Priority Pipeline gives your critical outreach the fast-track it deserves—delivering 3x faster with higher inbox precedence.
                    </p>

                    <div className="space-y-6 mb-12">
                        {[
                            { icon: Clock, title: "Zero Congestion", desc: "Your emails bypass the general queue for instant processing." },
                            { icon: ShieldCheck, title: "High-Reputation Pools", desc: "Priority campaigns route through our cleanest IPs with the highest trust scores." },
                            { icon: TrendingUp, title: "Adaptive Precedence", desc: "Dynamic rescheduling ensures your priority sends hit when recipients are most active." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-brand">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                    <p className="text-sm text-white/50">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button size="lg" className="h-14 px-8" onClick={() => router.push("/login")}>
                        Activate Priority Sending
                    </Button>
                </div>

                {/* Visual Differentiation */}
                <div className="relative animate-up animate-delay-200">
                    <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm overflow-hidden">
                        <div className="mb-8">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Standard Queue [CONGESTED]</div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/20 w-[80%] animate-pulse" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-white/40">Latency: 14.5m average</div>
                        </div>

                        <div className="h-px bg-white/10 my-10 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-text-primary px-4 py-1 text-[8px] font-black uppercase text-brand tracking-widest border border-brand/30 rounded-full">
                                The SharaSpot Gap
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-brand">Priority Pipeline [ACTIVE]</div>
                                <div className="flex h-2 w-2 rounded-full bg-brand animate-ping" />
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 10].map(i => (
                                    <div key={i} className="flex-1 h-2 bg-brand/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand w-full" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-brand">Latency: 0.1s [INSTANT]</div>
                        </div>

                        {/* Tactical Overlay */}
                        <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-[10px] text-white/60">
                            <div className="flex items-center justify-between mb-2">
                                <span>ENQUEUE_PRIORITY_JOB</span>
                                <span className="text-brand">SUCCESS</span>
                            </div>
                            <div className="opacity-40">TARGET_REPUTATION: 98/100</div>
                            <div className="opacity-40">QUEUE_BYPASS: ENABLED</div>
                            <div className="mt-3 text-brand font-black tracking-widest uppercase text-[8px]">Proprietary routing active</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
