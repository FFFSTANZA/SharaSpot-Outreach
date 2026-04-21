"use client";

import { UserPlus, Settings, Zap, BarChart3, ChevronRight } from "lucide-react";

const steps = [
    {
        icon: UserPlus,
        title: "Integrate Nodes",
        desc: "Connect Google Workspace, Microsoft 365, or custom SMTP accounts. Every connection is validated via automated handshake.",
    },
    {
        icon: Settings,
        title: "Reputation Ramp",
        desc: "New accounts undergo a 14-28 day controlled warmup. We manage volume velocity to secure long-term sender scores.",
    },
    {
        icon: Zap,
        title: "Execute Priority",
        desc: "Launch sequences with adaptive routing. Our system injects human-like timing patterns into every transmission.",
    },
    {
        icon: BarChart3,
        title: "Audit Performance",
        desc: "Real-time verification of opens and replies. Sequences terminate instantly upon successful recipient engagement.",
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 lg:py-32 bg-white relative overflow-hidden border-b border-border-light">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="mb-20">
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Operational Workflow</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
                        Built for <span className="text-brand">predictable</span> outcomes.
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border-light border border-border-light">
                    {steps.map((step, i) => (
                        <div key={i} className="bg-white p-10 group hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col h-full">
                                <div className="w-12 h-12 border border-border-light flex items-center justify-center mb-10 group-hover:border-brand transition-colors">
                                    <step.icon size={20} className="text-brand" />
                                </div>
                                
                                <div className="text-[10px] font-bold text-text-muted mb-4 uppercase tracking-[0.15em]">
                                    Protocol Step 0{i + 1}
                                </div>
                                
                                <h3 className="text-lg font-bold text-text-primary mb-4">{step.title}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed mb-8">
                                    {step.desc}
                                </p>

                                <div className="mt-auto flex items-center gap-2 text-[10px] font-bold text-brand uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Operational <ChevronRight size={12} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
