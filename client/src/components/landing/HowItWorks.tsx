"use client";

import { motion } from "framer-motion";
import { UserPlus, Settings, Zap, BarChart3 } from "lucide-react";

const steps = [
    {
        icon: UserPlus,
        title: "Connect Senders",
        desc: "Add your Google Workspace, Microsoft 365, or custom SMTP accounts. Our system validates every connection in seconds.",
        detail: "No limit on the number of accounts you can connect."
    },
    {
        icon: Settings,
        title: "Auto-Warmup",
        desc: "New accounts are gradually warmed up over 14-28 days. We handle the volume ramp-up so you don't have to.",
        detail: "Building reputation with ESPs is fully automated."
    },
    {
        icon: Zap,
        title: "Launch Campaign",
        desc: "Compose your sequence with rich personalization. We rotate senders and add human-like delays automatically.",
        detail: "Priority routing ensures primary inbox placement."
    },
    {
        icon: BarChart3,
        title: "Monitor & Scale",
        desc: "Track opens, clicks, and replies in real-time. Follow-ups stop automatically when a reply is detected.",
        detail: "Get detailed insights into which accounts perform best."
    }
];

export default function HowItWorks() {
    return (
        <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="text-center mb-24">
                    <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">The Process</p>
                    <h2 className="text-4xl lg:text-5xl font-bold text-text-primary tracking-tight">
                        Built for <span className="text-brand">professional</span> outreach.
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {steps.map((step, i) => (
                        <div key={i} className="relative group">
                            {/* Connector Line (visible on desktop) */}
                            {i < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-border-light z-0 -translate-x-1/2" />
                            )}
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-white border border-border-light shadow-sm flex items-center justify-center mb-8 group-hover:border-brand/30 group-hover:shadow-brand-glow transition-all duration-500">
                                    <step.icon className="w-8 h-8 text-brand" />
                                </div>
                                
                                <div className="inline-block px-3 py-0.5 rounded-full bg-slate-50 border border-border-light text-[10px] font-bold text-text-muted mb-4">
                                    STEP 0{i + 1}
                                </div>
                                
                                <h3 className="text-lg font-bold text-text-primary mb-4">{step.title}</h3>
                                <p className="text-[14px] text-text-secondary leading-relaxed mb-6">
                                    {step.desc}
                                </p>
                                
                                <p className="text-[12px] font-medium text-brand/70 bg-brand-light px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {step.detail}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
