"use client";

import React from "react";
import { Beaker, FlaskConical, Microscope, Telescope } from "lucide-react";

export default function BenchmarkStory() {
    return (
        <section className="py-24 bg-white overflow-hidden border-b border-border-light">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                    <div className="lg:pt-2">
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Behind the numbers</p>
                        <h2 className="text-3xl font-bold text-text-primary leading-tight tracking-tight">The Benchmark Story</h2>
                    </div>

                    <div>
                        <div className="space-y-16">
                            <div className="relative pl-10 border-l border-border-medium">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-white shadow-sm" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center text-brand">
                                        <Beaker size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary">Phase 1: The Control Group</h3>
                                </div>
                                <p className="text-text-secondary leading-relaxed text-[16px] max-w-2xl">
                                    We started by setting up a "standard" outreach environment. We used three fresh domains, warmed them up for 14 days using industry-standard tools, and prepared a sequence of 5 emails. We sent these to a list of 80 verified test accounts across Google Workspace, Microsoft 365, and private enterprise servers.
                                </p>
                                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-border-light max-w-xl">
                                    <p className="text-text-secondary text-[14px] italic">
                                        The result? Only 52% of emails reached the primary inbox. 30% went to Promotions, and 18% were either flagged as spam or never delivered.
                                    </p>
                                </div>
                            </div>

                            <div className="relative pl-10 border-l border-border-medium">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-white shadow-sm" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center text-brand">
                                        <FlaskConical size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary">Phase 2: The Priority Engine</h3>
                                </div>
                                <p className="text-text-secondary leading-relaxed text-[16px] max-w-2xl">
                                    Next, we ran the exact same campaign through SharaSpot&apos;s Priority infrastructure. We didn&apos;t change a single word of the copy. We didn&apos;t change the list. The only difference was our proprietary routing engine making real-time decisions on which sender to use, when to send, and how to format the headers.
                                </p>
                                <div className="mt-6 p-4 rounded-xl bg-brand-light border border-brand-muted max-w-xl">
                                    <p className="text-brand text-[14px] font-bold">
                                        Placement jumped to 96%.
                                    </p>
                                </div>
                            </div>

                            <div className="relative pl-10 border-l border-border-medium">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-white shadow-sm" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center text-brand">
                                        <Microscope size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary">The &quot;Why&quot; Behind the 96%</h3>
                                </div>
                                <p className="text-text-secondary leading-relaxed text-[16px] max-w-2xl">
                                    Our analysis showed that standard tools send in predictable bursts that modern ESPs easily identify as automated. SharaSpot Priority adapts in milliseconds. If it detects a slight delay in delivery confirmation from a Google server, it immediately shifts the routing to avoid a &quot;batch&quot; flag.
                                </p>
                            </div>

                            <div className="bg-text-primary rounded-2xl p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-3xl rounded-full -mr-32 -mt-32" />
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white mb-6">
                                        <Telescope size={24} />
                                    </div>
                                    <h4 className="text-2xl font-bold text-white mb-4">Conclusion</h4>
                                    <p className="text-white/80 text-[18px] font-medium leading-relaxed max-w-2xl">
                                        The data is clear: the infrastructure you send through is as important as the content you write. In a world of increasing noise, Priority isn&apos;t just a feature—it&apos;s the only way to ensure your voice is heard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
