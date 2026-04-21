"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/config";

const faqs = [
    {
        q: "I am not technical at all. Can I still use this?",
        a: "Yes. You simply connect your email account, upload your contacts, and write your message. Our system handles everything else in the background—from establishing your professional reputation to ensuring your outreach arrives at the perfect time. Most people have their first outcome-driven campaign running the same day they sign up."
    },
    {
        q: "How does the AI Follow-up Generator work?",
        a: "Our AI engine uses 'Context Locking' to analyze your original email and craft follow-ups that reference specific value anchors. This ensures every message feels like a direct, human-to-human continuation of your first outreach."
    },
    {
        q: "Can I use multiple email accounts?",
        a: "Yes. SharaSpot is built for scale. You can connect multiple SMTP accounts and our multi-sender rotation system will automatically distribute your campaign volume across them to maximize deliverability."
    },
    {
        q: "What happens when someone on my list replies?",
        a: "The moment a reply arrives, SharaSpot stops all follow-up actions for that person immediately. This prevents the awkwardness of sending a robotic follow-up to someone who has already engaged, preserving the professional respect you've built."
    },
    {
        q: "Why is my outreach landing in spam?",
        a: "Usually it is because your account is being flagged as a 'promotions' sender. Standard tools send emails in predictable, robotic batches. SharaSpot fixes this by making your activity indistinguishable from a personal, one-to-one email sent by a human."
    },
    {
        q: "Is it safe to use with my main work account?",
        a: "Yes. SharaSpot establishes a safe sending limit and uses an adaptive warmup algorithm to protect your account's reputation. Your primary professional identity is always our first priority."
    },
    {
        q: `How much does it cost?`,
        a: `During early access, it is ${BRAND_CONFIG.pricing.global.symbol}${BRAND_CONFIG.pricing.global.amount} per month for full access to our premium infrastructure. This includes Priority Sending, AI Follow-ups, and PRM capabilities.`
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
    return (
        <section id="faq" className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand/[0.03] blur-[120px] rounded-full opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand/[0.03] blur-[120px] rounded-full opacity-50" />
            </div>

            <div className="max-w-4xl mx-auto px-6 relative">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/[0.05] border border-brand/10 text-brand text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                        Support & Knowledge
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-text-primary tracking-tighter leading-tight mb-6">
                        Everything you need <br /><span className="text-brand">to know.</span>
                    </h2>
                    <p className="text-text-secondary text-lg font-medium max-w-xl mx-auto">
                        Got a question? We have answers. If you don't find what you are looking for, our support team is just a click away.
                    </p>
                </div>

                <div className="bg-[#fcfcfc] border border-border-light rounded-[32px] p-2 lg:p-4 shadow-sm">
                    <div className="bg-white border border-border-light rounded-[24px] overflow-hidden p-6 lg:p-10">
                        <div className="divide-y divide-slate-100">
                            {faqs.map((f, i) => (
                                <FAQItem key={i} q={f.q} a={f.a} />
                            ))}
                        </div>

                        <div className="pt-10 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
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
