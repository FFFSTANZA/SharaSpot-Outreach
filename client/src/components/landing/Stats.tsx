"use client";

import { CheckCircle2, TrendingUp, BarChart3, Fingerprint, Activity, ShieldCheck, Globe, Shield, Zap, Target } from "lucide-react";

const reliabilityPoints = [
    {
        label: "Continuous Growth",
        accent: "#00A63E",
        body: "Outreach shouldn't be a gamble. We provide the stability your pipeline needs, ensuring that your messages arrive with the same reliability as a direct meeting invite. When your growth is consistent, your business is unstoppable.",
        outcome: "Verified 96% placement rate across all client portfolios. Zero downtime for your outreach sequences."
    },
    {
        label: "Brand Authority",
        accent: "#1A56DB",
        body: "Your brand is your most valuable asset. We ensure your reputation remains spotless by making your outreach look exactly like what it is: a human-led inquiry from a professional peer. No bot-like footprints, no automated noise.",
        outcome: "Clean-slate reputation protection for every sender account. Indistinguishable from manual, one-to-one business sends."
    },
    {
        label: "Operational Speed",
        accent: "#7C3AED",
        body: "Business moves fast, and so should your outreach. We ensure your messages are dispatched exactly when they need to be seen, without delays or processing bottlenecks. Scale your effort without losing the 'first-mover' advantage.",
        outcome: "Instant delivery to the primary inbox. Adaptive timing that hits recipient windows with mathematical precision."
    }
];

export default function Stats() {
    return (
        <section className="py-24 bg-white border-y border-border-light relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative">

                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-20">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                            The Foundation of <br />
                            <span className="text-brand">Your Growth.</span>
                        </h2>
                    </div>
                    <div className="lg:pt-2">
                        <p className="text-text-secondary text-lg leading-relaxed max-w-xl font-medium">
                            We maintain the highest standards in the outreach industry. While others focus on volume, we focus on the outcome of every single send.
                        </p>
                    </div>
                </div>

                <div className="space-y-20">
                    {reliabilityPoints.map((p, i) => (
                        <div key={i} className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-start">
                            {/* Left label col */}
                            <div className="lg:pt-1">
                                <div
                                    className="w-8 h-[3px] mb-5 rounded-full"
                                    style={{ background: p.accent }}
                                />
                                <h3
                                    className="text-lg font-bold leading-snug"
                                    style={{ color: p.accent }}
                                >
                                    {p.label}
                                </h3>
                            </div>

                            {/* Right body col */}
                            <div>
                                <p className="text-base text-text-primary leading-[1.75] mb-6 font-semibold">
                                    {p.body}
                                </p>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                        <CheckCircle2 size={16} className="text-brand" />
                                    </div>
                                    <p className="text-[13px] text-text-secondary font-bold leading-snug">
                                        {p.outcome}
                                    </p>
                                </div>
                                <div className="h-px bg-border-light w-full mt-8" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-8 p-10 border border-border-light rounded-3xl bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white border border-border-light flex items-center justify-center text-brand shadow-sm">
                            <ShieldCheck size={24} />
                        </div>
                        <p className="text-[13px] font-bold text-text-primary tracking-tight uppercase">Outcome-first infrastructure trusted by high-stakes deal-makers.</p>
                    </div>
                    <button className="text-[11px] font-black text-text-muted hover:text-brand uppercase tracking-[0.2em] transition-colors border-b-2 border-transparent hover:border-brand">
                        Request Case Studies
                    </button>
                </div>

            </div>
        </section>
    );
}