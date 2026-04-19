"use client";

import {
    Users, Gauge, Flame, Eye, MessageSquare, Shield, CheckCircle
} from "lucide-react";
import { BRAND_CONFIG } from "@/lib/config";

const iconMap: Record<string, any> = {
    rotation: Users,
    scheduling: Gauge,
    warmup: Flame,
    tracking: Eye,
    replies: MessageSquare,
    security: Shield,
};

export default function Features() {
    return (
        <section id="features" className="py-24 border-y border-border-light bg-[#f8f9fa] -mx-8 lg:-mx-12 px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20 animate-up">
                    <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4">Infrastructure Audit</h2>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h3 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter max-w-2xl leading-tight">
                            Deterministic sending. <br />
                            <span className="text-brand">Zero "vibe-coding".</span>
                        </h3>
                        <p className="text-text-secondary max-w-sm leading-relaxed text-sm">
                            Our architecture is designed to withstand aggressive filters by mimicking unique human behavior at a massive scale.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BRAND_CONFIG.features.map((feature, i) => {
                        const Icon = iconMap[feature.id] || CheckCircle;
                        return (
                            <div
                                key={feature.id}
                                className={`p-8 bg-white border border-border-light rounded-2xl hover:border-brand/40 hover:shadow-sm transition-all animate-up animate-delay-${(i + 1) * 100} group`}
                            >
                                <div className="mb-6 inline-flex p-3 rounded-xl bg-brand-light/40 text-brand">
                                    <Icon size={24} />
                                </div>
                                <h4 className="text-lg font-black text-text-primary mb-3 uppercase tracking-tight">{feature.title}</h4>
                                <p className="text-xs text-text-secondary leading-[1.6] mb-6 font-medium">
                                    {feature.desc}
                                </p>
                                <div className="flex items-center gap-2 pt-4 border-t border-border-light">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Enterprise Standard</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
