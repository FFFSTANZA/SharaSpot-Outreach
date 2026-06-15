"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/config";
import { detectRegion, getCachedRegionSync } from "@/lib/geo";

const faqs = (region: "india" | "global") => [
    {
        q: "I am not technical at all. Can I still use this?",
        a: "Yes. You connect your email account, upload contacts, and write your message. SharaSpot handles sender rotation, warmup, reply monitoring, and campaign workflow so non-technical users can get started without learning a complex deliverability stack."
    },
    {
        q: "How does SharaSpot protect deliverability?",
        a: "SharaSpot combines sender rotation, warmup, adaptive throttling, and reply detection so campaigns move at a human pace without putting one mailbox or domain under unnecessary pressure."
    },
    {
        q: "Can I use multiple email accounts?",
        a: "Yes. You can connect multiple SMTP accounts and SharaSpot will distribute campaign volume across them automatically. That helps teams scale outreach while avoiding unnecessary pressure on one mailbox."
    },
    {
        q: "What happens when someone on my list replies?",
        a: "The moment a reply arrives, SharaSpot stops all follow-up actions for that person immediately. This prevents the awkwardness of sending a robotic follow-up to someone who has already engaged, preserving the professional respect you've built."
    },
    {
        q: "Why is my outreach landing in spam?",
        a: "Usually it comes from a mix of list quality, sender reputation, message content, and sending patterns. SharaSpot helps by warming accounts gradually, spacing volume more carefully, and reducing the fixed batch behavior that often creates extra risk."
    },
    {
        q: "Is it safe to use with my main work account?",
        a: "It is designed to be safer than sending unmanaged cold volume from one account. SharaSpot uses sending limits, warmup, and reply-aware workflow controls to help protect sender reputation, though responsible list quality and message quality still matter."
    },
    {
        q: `How much does it cost?`,
        a: `You can start with a ${BRAND_CONFIG.pricing.trialDays}-day free trial. After the trial, early access is ${BRAND_CONFIG.pricing[region].symbol}${BRAND_CONFIG.pricing[region].amount} per month for access to sender rotation, analytics, PRM workflows, reply detection, and delivery controls.`
    },
];

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-border-light last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full py-5 flex items-start justify-between gap-6 text-left group"
            >
                <span className="text-base font-semibold text-text-primary leading-snug group-hover:text-brand transition-colors">
                    {q}
                </span>
                <span className="text-text-muted mt-0.5 shrink-0 text-lg leading-none">
                    {open ? "−" : "+"}
                </span>
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-200",
                open ? "max-h-[400px] pb-5 opacity-100" : "max-h-0 opacity-0"
            )}>
                <p className="text-sm text-text-secondary leading-[1.85]">{a}</p>
            </div>
        </div>
    );
}

export default function FAQ() {
    const [region, setRegion] = useState<"india" | "global">(
        getCachedRegionSync() || "global"
    );

    useEffect(() => {
        detectRegion().then(setRegion);
    }, []);

    const items = faqs(region);

    return (
        <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-transparent relative overflow-hidden border-t border-border-light">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/pricing-faq-bg.jpg')] bg-cover bg-center opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-sky-100/35 via-white/15 to-blue-50/55" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/[0.03] blur-[120px] rounded-full opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand/[0.03] blur-[120px] rounded-full opacity-50" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
                <div className="text-center mb-12 sm:mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/[0.05] border border-brand/10 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                        Support & Knowledge
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-primary tracking-tighter leading-tight mb-5 sm:mb-6">
                        Everything you need <br /><span className="text-brand">to know.</span>
                    </h2>
                    <p className="text-text-secondary text-base sm:text-lg font-medium max-w-xl mx-auto">
                        Got a question? We have answers. If you don&apos;t find what you are looking for, our support team is just a click away.
                    </p>
                </div>

                <div className="bg-[#fcfcfc] border border-border-light rounded-[32px] p-2 lg:p-4 shadow-sm">
                    <div className="bg-white border border-border-light rounded-[24px] overflow-hidden p-4 sm:p-6 lg:p-10">
                        <div className="divide-y divide-slate-100">
                            {items.map((f, i) => (
                                <FAQItem key={i} q={f.q} a={f.a} />
                            ))}
                        </div>

                        <div className="pt-10 mt-6 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-6">
                            <p className="text-sm text-text-muted font-medium">
                                Something else on your mind?
                            </p>
                            <a
                                href={BRAND_CONFIG.supportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-brand text-white text-[11px] font-black uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
                            >
                                Talk to the team
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
