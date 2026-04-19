"use client";

import { BRAND_CONFIG } from "@/lib/config";

const stats = [
    { label: "Emails Sent Annually", value: "2.5M+" },
    { label: "Avg Platform Delivery", value: "98.8%" },
    { label: "Priority Latency", value: "< 0.1s" },
    { label: "Monthly Full Access", value: `$${BRAND_CONFIG.pricing.monthly}` },
];

export default function Stats() {
    return (
        <section id="stats" className="py-24">
            <div className="bg-[#f8f9fa] border border-border-light rounded-[32px] p-12 lg:p-20 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="max-w-md animate-up">
                        <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4">Network Health</h2>
                        <h3 className="text-4xl font-black text-text-primary tracking-tighter leading-tight mb-6">
                            Real-time platform <br />
                            <span className="text-brand text-5xl italic">benchmarks.</span>
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed font-medium">
                            Our metrics are derived from over 2.5M successfully routed emails across diverse industries.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 lg:gap-16">
                        {stats.map((stat, i) => (
                            <div key={stat.label} className={`animate-up animate-delay-${(i + 1) * 100}`}>
                                <div className="text-4xl lg:text-5xl font-black text-text-primary mb-2 tracking-tighter italic">
                                    {stat.value}
                                </div>
                                <div className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-tight">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tactical grid background for the card */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#00A63E 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                />
            </div>
        </section>
    );
}
