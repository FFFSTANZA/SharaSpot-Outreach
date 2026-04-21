"use client";

import { useRouter } from "next/navigation";
import { BRAND_CONFIG } from "@/lib/config";
import { ArrowRight, Sparkles, Inbox, Send, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function Hero() {
    const router = useRouter();
    const [packets, setPackets] = useState<{ id: number; type: 'standard' | 'priority' }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPackets(prev => {
                const id = Date.now();
                const type = Math.random() > 0.7 ? 'priority' : 'standard';
                return [...prev.slice(-10), { id, type }];
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-white">
            {/* Grid Background */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ 
                    backgroundImage: `linear-gradient(to right, var(--color-text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-text-primary) 1px, transparent 1px)`, 
                    backgroundSize: '40px 40px' 
                }}
            />

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="flex flex-col items-start text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-light bg-slate-50 text-text-muted text-[10px] font-bold tracking-[0.15em] uppercase mb-10"
                        >
                            <Zap size={12} className="text-brand" fill="currentColor" />
                            Transmission Layer 7 Verified
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-5xl lg:text-7xl font-bold text-text-primary tracking-tighter leading-[0.95] mb-8"
                        >
                            Engineered for <br />
                            <span className="text-brand">total delivery.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="text-lg text-text-secondary leading-relaxed max-w-lg mb-12"
                        >
                            Stop fighting promotional filters. SharaSpot uses architectural routing to ensure your messages bypass the noise and land exactly where they belong.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
                        >
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full sm:w-auto bg-text-primary text-white text-[13px] font-bold uppercase tracking-widest px-10 py-4 rounded hover:bg-slate-800 transition-all flex items-center justify-center gap-3 border border-text-primary"
                            >
                                Initialize System
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>

                    {/* Interactive Visualization */}
                    <div className="relative h-[400px] w-full bg-slate-50 border border-border-light rounded-sm overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-between px-12">
                            {/* Source Node */}
                            <div className="z-10 flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-sm bg-white border border-border-light flex items-center justify-center shadow-sm">
                                    <Send size={24} className="text-text-muted" />
                                </div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Source</span>
                            </div>

                            {/* Network Paths */}
                            <div className="absolute inset-0 flex flex-col justify-center gap-24 pointer-events-none">
                                {/* Priority Path (Direct) */}
                                <div className="h-px w-full bg-brand/20 relative">
                                    <div className="absolute top-[-10px] left-[15%] text-[8px] font-bold text-brand uppercase tracking-widest">Priority Lane (Active)</div>
                                </div>
                                {/* Standard Path (Congested) */}
                                <div className="h-px w-full bg-slate-200 relative">
                                    <div className="absolute top-[-10px] left-[15%] text-[8px] font-bold text-text-muted uppercase tracking-widest">Standard Queue</div>
                                </div>
                            </div>

                            {/* Packets */}
                            <AnimatePresence>
                                {packets.map((packet) => (
                                    <motion.div
                                        key={packet.id}
                                        initial={{ left: "15%", opacity: 0 }}
                                        animate={{ 
                                            left: "85%", 
                                            opacity: [0, 1, 1, 0],
                                            top: packet.type === 'priority' ? "35%" : "65%"
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ 
                                            duration: packet.type === 'priority' ? 1.5 : 3, 
                                            ease: "linear" 
                                        }}
                                        className="absolute z-20 flex items-center justify-center"
                                    >
                                        <div className={`w-3 h-3 rounded-full ${packet.type === 'priority' ? 'bg-brand shadow-[0_0_10px_rgba(0,166,62,0.5)]' : 'bg-slate-300'}`} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Target Node */}
                            <div className="z-10 flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-sm bg-white border border-border-light flex items-center justify-center shadow-sm relative">
                                    <Inbox size={24} className="text-text-primary" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full border-2 border-white flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Primary Inbox</span>
                            </div>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border border-border-light rounded-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand" />
                                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">96% Accuracy</span>
                                </div>
                                <div className="w-px h-3 bg-border-light" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Latency: 0.4ms</span>
                                </div>
                            </div>
                            <Activity size={12} className="text-brand" />
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px bg-border-light border border-border-light">
                    {[
                        { val: "99.9%", label: "Placement" },
                        { val: "340ms", label: "Speed" },
                        { val: "100%", label: "Uptime" },
                        { val: "Tier 1", label: "Reputation" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 flex flex-col items-center">
                            <p className="text-2xl font-bold text-text-primary tracking-tight mb-1">{stat.val}</p>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{stat.label}</p>
                        </div>
                    ))}
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
