"use client";

import { Shield, Zap, Clock, Fingerprint, Database, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: Zap,
        title: "Lightning Fast Delivery",
        description: "Bypass standard queues with high-performance infrastructure designed for speed and reliability.",
    },
    {
        icon: Shield,
        title: "Domain Protection",
        description: "Automatic sender rotation and volume limits keep your primary domain safe from being blacklisted.",
    },
    {
        icon: Clock,
        title: "Human-Like Timing",
        description: "Intelligent delays mimic real human behavior, making your outreach indistinguishable from a manual send.",
    },
    {
        icon: Fingerprint,
        title: "Deep Personalization",
        description: "Dynamic variables and custom templates that feel personally written for every single recipient.",
    },
    {
        icon: Database,
        title: "Enterprise Analytics",
        description: "Track opens, clicks, and replies with per-recipient granularity and real-time dashboard updates.",
    },
    {
        icon: Globe,
        title: "Universal Support",
        description: "Works seamlessly with Google Workspace, Microsoft 365, and any custom SMTP/IMAP provider.",
    },
];

export default function Features() {
    return (
        <section className="py-24 lg:py-32 bg-[#fcfcfc] relative overflow-hidden border-y border-border-light">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="grid lg:grid-cols-[300px_1fr] gap-16 lg:gap-24 mb-20">
                    <div>
                        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Core Capabilities</p>
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                            Everything you need to <span className="text-text-muted">scale outreach.</span>
                        </h2>
                    </div>
                    <div className="flex items-end">
                        <p className="text-text-secondary text-lg max-w-xl leading-relaxed">
                            We've engineered every part of the outreach stack to prioritize one thing: getting your message in front of the right person.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-light border border-border-light rounded-3xl overflow-hidden">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-10 bg-white hover:bg-slate-50/50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand/5 flex items-center justify-center mb-6 group-hover:bg-brand group-hover:text-white transition-all duration-300">
                                <feature.icon className="w-6 h-6 text-brand group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-[17px] font-bold text-text-primary mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-[14px] text-text-secondary leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
