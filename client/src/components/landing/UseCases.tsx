"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const personas = [
    {
        id: "founders",
        label: "Founders",
        title: "Investor relations that bypass the noise.",
        body: "Fresh domains and critical updates require perfect placement. Ensure your pitch lands in the primary inbox where decisions happen.",
        points: ["Zero 'Promotions' risk", "Reputation-safe warming", "Adaptive sender rotation"],
        cta: "Scale fundraise",
    },
    {
        id: "sales",
        label: "Sales Teams",
        title: "Maximize response across every domain.",
        body: "Outreach that feels authentic. Our system randomizes patterns and timings to remain indistinguishable from manual sends.",
        points: ["High-volume resilience", "Real-time reply tracking", "Pattern variance engine"],
        cta: "Increase replies",
    },
    {
        id: "hr",
        label: "Recruiters",
        title: "High-stakes sourcing for elite talent.",
        body: "The candidates you want aren't looking for you in the junk folder. Priority routing guarantees visibility for your outreach.",
        points: ["Primary inbox placement", "Verified open tracking", "Scalable personalization"],
        cta: "Optimize sourcing",
    },
];

export default function UseCases() {
    const router = useRouter();

    return (
        <section className="py-24 lg:py-32 bg-white relative overflow-hidden border-b border-border-light">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="max-w-3xl mb-24">
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Tactical Implementation</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                        Engineered for situations where <br />
                        <span className="text-text-muted">delivery is the only metric.</span>
                    </h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-px bg-border-light border border-border-light">
                    {personas.map((p, i) => (
                        <div 
                            key={p.id} 
                            className="flex flex-col p-10 bg-white group hover:bg-slate-50 transition-colors duration-300"
                        >
                            <div className="mb-12">
                                <span className="inline-block px-2.5 py-1 border border-border-light text-[10px] font-bold text-text-muted uppercase tracking-widest mb-8">
                                    Use Case: {p.label}
                                </span>
                                <h3 className="text-xl font-bold text-text-primary leading-tight mb-4">
                                    {p.title}
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {p.body}
                                </p>
                            </div>

                            <div className="space-y-3 mb-12 mt-auto">
                                {p.points.map((point, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <CheckCircle2 size={14} className="text-brand" />
                                        <span className="text-[12px] font-semibold text-text-primary">{point}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => router.push("/login")}
                                className="w-full py-4 border border-text-primary text-[11px] font-bold uppercase tracking-widest text-text-primary hover:bg-text-primary hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                {p.cta}
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
