"use client";

import { BRAND_CONFIG } from "@/lib/config";

const testimonials = [
    {
        quote: "We booked 6 investor meetings in 3 weeks. I had been sending the same emails before. They were landing in spam and I had no idea.",
        name: "Dev Maheshwari",
        title: "Co-founder, fintech startup, Pune",
    },
    {
        quote: "Hired a senior data scientist we reached through outreach. She told us our email was the only recruiter message she had ever replied to in her career.",
        name: "Sneha Rajput",
        title: "Head of Talent, Series B startup",
    },
    {
        quote: "Closed a significant deal after a cold email campaign. The client said he almost never responds to cold outreach. Something about ours felt different.",
        name: "Vikram Naidu",
        title: "Enterprise Sales, SaaS company",
    },
];

export default function Stats() {
    return (
        <section id="results" className="py-20 lg:py-28 bg-text-primary relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-[20%] w-[400px] h-[400px] rounded-full bg-brand/[0.03] blur-3xl" />
                <div className="absolute bottom-20 right-[10%] w-[500px] h-[500px] rounded-full bg-brand/[0.02] blur-3xl" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">

                {/* Top line numbers, inline not in cards */}
                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-20">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                            Results
                        </h2>
                    </div>
                    <div className="lg:pt-2">
                        <div className="flex flex-wrap gap-x-12 gap-y-8">
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">4.2x</p>
                                <p className="text-sm text-white/60">More replies than standard cold email tools</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">400+</p>
                                <p className="text-sm text-white/60">Teams running active campaigns</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">7 days</p>
                                <p className="text-sm text-white/60">Average time to first reply on a new campaign</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-brand mb-1">${BRAND_CONFIG.pricing.monthly}/mo</p>
                                <p className="text-sm text-white/60">All features, no seat limits, early access pricing</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Testimonials as pull quotes, not cards */}
                <div className="border-t border-white/10 pt-16">
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-12">
                        From people using it
                    </p>

                    <div className="grid lg:grid-cols-3 gap-x-16 gap-y-12">
                        {testimonials.map((t) => (
                            <div key={t.name}>
                                <p className="text-base text-white/80 leading-[1.75] mb-6 font-medium">
                                    "{t.quote}"
                                </p>
                                <p className="text-xs text-white/40">
                                    {t.name}, {t.title}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
