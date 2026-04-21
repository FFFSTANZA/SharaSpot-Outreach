"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const personas = [
    {
        id: "founders",
        label: "Founders",
        title: "Pitching investors without the spam folder.",
        accent: "#00A63E",
        body: "You drafted the right message. You found the right partner at the right fund. You hit send, and nothing comes back. SharaSpot fixes the delivery problem so your pitch gets the attention it deserves.",
        points: ["Avoid 'Promotions' tab", "Automatic follow-up pause", "Domain reputation safety"],
        cta: "Scale your fundraise",
    },
    {
        id: "sales",
        label: "Sales Teams",
        title: "Book more calls from the same volume.",
        accent: "#1A1D21",
        body: "The VPs you need to reach get 100+ emails a day. SharaSpot sends through warmed-up accounts with human-like timing, so each email reads like it came from a colleague, not a bot.",
        points: ["Multi-sender rotation", "Real-time reply detection", "Human-like sending patterns"],
        cta: "Boost reply rates",
    },
    {
        id: "hr",
        label: "Recruiters",
        title: "Source talent without burning your domain.",
        accent: "#5F6368",
        body: "Top candidates aren't scrolling promo tabs. If your offer letter lands there, you've lost. Priority routing ensures your first touchpoint lands in the primary inbox every time.",
        points: ["High-throughput delivery", "Verified placement stats", "Personalized at scale"],
        cta: "Hire faster",
    },
];

export default function UseCases() {
    const router = useRouter();

    return (
        <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="max-w-3xl mb-24">
                    <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Strategic Use Cases</p>
                    <h2 className="text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-[1.1] mb-6">
                        Three outreach problems. <br />
                        <span className="text-text-muted text-3xl lg:text-4xl">One definitive solution.</span>
                    </h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {personas.map((p, i) => (
                        <div 
                            key={p.id} 
                            className="flex flex-col p-10 rounded-3xl border border-border-light bg-white hover:border-brand/20 hover:shadow-elevated transition-all duration-500 group"
                        >
                            <div className="mb-8">
                                <span className="inline-block px-3 py-1 rounded-full bg-slate-50 border border-border-light text-[10px] font-bold text-text-muted uppercase tracking-wider mb-6">
                                    {p.label}
                                </span>
                                <h3 className="text-2xl font-bold text-text-primary leading-tight mb-4">
                                    {p.title}
                                </h3>
                                <p className="text-[15px] text-text-secondary leading-relaxed">
                                    {p.body}
                                </p>
                            </div>

                            <div className="space-y-3 mb-10 mt-auto">
                                {p.points.map((point, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-brand" />
                                        <span className="text-[13px] font-medium text-text-primary">{point}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => router.push("/login")}
                                className="w-full py-3 px-6 rounded-xl border border-border-medium text-sm font-semibold text-text-primary hover:bg-text-primary hover:text-white hover:border-text-primary transition-all flex items-center justify-center gap-2"
                            >
                                {p.cta}
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
