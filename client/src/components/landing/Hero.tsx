"use client";

import { useRouter } from "next/navigation";
import { BRAND_CONFIG } from "@/lib/config";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative pt-24 pb-20 lg:pt-48 lg:pb-40 overflow-hidden bg-white">
            {/* Elegant Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/[0.04] rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-brand/[0.02] rounded-full blur-[100px]" />
                </div>
                {/* Subtle Grid / Grain */}
                <div 
                    className="absolute inset-0 opacity-[0.015]"
                    style={{ 
                        backgroundImage: `radial-gradient(var(--color-text-primary) 0.5px, transparent 0.5px)`, 
                        backgroundSize: '32px 32px' 
                    }}
                />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light border border-brand-muted text-brand text-[10px] font-bold tracking-[0.15em] uppercase mb-10"
                    >
                        <Sparkles size={12} fill="currentColor" />
                        Next-Gen Outreach Engine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl lg:text-8xl font-bold text-text-primary tracking-tight leading-[0.95] mb-8 max-w-5xl"
                    >
                        Deliver messages that <br />
                        <span className="text-brand">actually get seen.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-lg lg:text-xl text-text-secondary leading-relaxed max-w-2xl mb-12"
                    >
                        {BRAND_CONFIG.description} Stop falling into promotions. Use the same technology as top-tier venture firms and startups to reach the primary inbox.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col sm:flex-row items-center gap-6"
                    >
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full sm:w-auto bg-brand text-white text-sm font-semibold px-10 py-4 rounded-xl hover:bg-brand/90 hover:shadow-brand-glow transition-all flex items-center justify-center gap-2 group"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center overflow-hidden">
                                        <div className={`w-full h-full bg-gradient-to-br ${i % 2 === 0 ? 'from-brand-muted to-brand' : 'from-slate-200 to-slate-300'}`} />
                                    </div>
                                ))}
                            </div>
                            <span>Join 500+ high-growth teams</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                        className="mt-32 lg:mt-48 w-full"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 border-t border-border-light pt-12">
                            {[
                                { val: "99.9%", label: "Inbox placement" },
                                { val: "340ms", label: "Average delivery" },
                                { val: "24/7", label: "Reputation monitoring" },
                                { val: "Zero", label: "Technical setup" }
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <p className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight mb-1">{stat.val}</p>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
