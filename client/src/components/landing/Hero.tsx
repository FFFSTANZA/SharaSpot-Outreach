"use client";

import { useRouter } from "next/navigation";
import { BRAND_CONFIG } from "@/lib/config";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative pt-24 pb-20 lg:pt-36 lg:pb-32 overflow-hidden bg-white">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/[0.04] rounded-full blur-[140px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand/[0.02] rounded-full blur-[120px] -ml-24 -mb-24" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                    <div className="lg:pt-3">
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">
                            Platform version 2.0
                        </p>
                    </div>

                    <div>
                        <h1 className="text-4xl lg:text-6xl font-bold text-text-primary tracking-tighter leading-[1.05] mb-8 max-w-2xl">
                            {BRAND_CONFIG.tagline}
                        </h1>

                        <p className="text-lg lg:text-xl text-text-secondary leading-relaxed max-w-xl mb-12">
                            {BRAND_CONFIG.description}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full sm:w-auto bg-brand text-white text-sm font-semibold px-8 py-3.5 rounded-lg hover:bg-brand/90 transition-colors flex items-center justify-center gap-2 group"
                            >
                                Start for free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
                                <span className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                                        </div>
                                    ))}
                                </span>
                                <span className="ml-2">Join 200+ teams sending better outreach</span>
                            </div>
                        </div>

                        <div className="mt-20 lg:mt-28 grid grid-cols-2 sm:grid-cols-4 gap-8">
                            {[
                                { val: "99.9%", label: "Throughput placement" },
                                { val: "340k/s", label: "Decision speed" },
                                { val: "Zero", label: "Technical warmup needed" },
                                { val: "100%", label: "Data privacy isolation" }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <p className="text-xl font-bold text-text-primary tracking-tight mb-1">{stat.val}</p>
                                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
