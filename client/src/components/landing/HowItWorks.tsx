"use client";

import { Mail, Layers, TrendingUp } from "lucide-react";

const steps = [
    {
        num: "01",
        title: "Link Infrastructure",
        desc: "Connect your SMTP/IMAP accounts. SharaSpot immediately begins the 14-day safety warmup.",
        icon: Mail,
    },
    {
        num: "02",
        title: "Define Sequences",
        desc: "Draft your emails and set up multi-step follow-ups. Upload your CSV and map custom variables.",
        icon: Layers,
    },
    {
        num: "03",
        title: "Execute & Monitor",
        desc: "Launch with adaptive throttling. Watch opens, clicks, and real-time reply detection from the dashboard.",
        icon: TrendingUp,
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20 animate-up">
                    <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4">Deployment Pipeline</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter leading-tight">
                        From zero to <span className="text-brand">active outreach</span> <br />
                        in three cycles.
                    </h3>
                </div>

                <div className="space-y-4">
                    {steps.map((step, i) => (
                        <div key={step.num} className={`flex items-start gap-8 p-8 border border-border-light rounded-2xl hover:bg-[#f8f9fa] transition-all animate-up animate-delay-${(i + 1) * 150} group`}>
                            <div className="shrink-0 w-16 h-16 rounded-2xl bg-brand-light flex flex-col items-center justify-center text-brand font-black">
                                <div className="text-[10px] opacity-40 uppercase tracking-tighter mb-1">Cycle</div>
                                <div className="text-xl">{step.num}</div>
                            </div>
                            <div className="flex-1 pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-xl font-bold text-text-primary uppercase tracking-tight">{step.title}</h4>
                                    <div className="px-2 py-0.5 rounded bg-brand text-white text-[8px] font-black uppercase tracking-widest leading-none">Status: Ready</div>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed max-w-2xl font-medium">
                                    {step.desc}
                                </p>
                            </div>
                            <div className="hidden lg:block shrink-0 pt-4">
                                <step.icon className="text-text-muted group-hover:text-brand transition-colors" size={32} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
