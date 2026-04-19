"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/config";

const faqs = [
    {
        q: "I am not technical at all. Can I still use this?",
        a: "Yes. You connect your Gmail or Outlook account, upload a spreadsheet of contacts, write your email, and click send. The 14-day account warmup, sending rotation, and reply detection all happen automatically in the background. Most people have their first campaign running on the same day they sign up."
    },
    {
        q: "Why is my outreach landing in spam?",
        a: "Usually one of three reasons: you are sending too many emails from a single account (Gmail flags this quickly), your email account is too new with no sending history, or your message looks identical to thousands of other cold emails and spam filters recognize the pattern. SharaSpot addresses all three."
    },
    {
        q: "What happens when someone on my list replies?",
        a: "SharaSpot monitors your inbox. The moment a reply arrives from anyone in your campaign, their follow-up sequence is cut immediately. You will not accidentally send a follow-up to an investor who already agreed to a call, or to a candidate who already declined."
    },
    {
        q: "I tried a cold email tool before. Why would this be different?",
        a: "Most tools focus on volume. SharaSpot focuses on delivery and readability. The relevant question is not how many emails you can send, but how many land in the primary inbox and read like a personal message. That is where reply rates are won or lost."
    },
    {
        q: "Is it safe to use with my main Gmail account?",
        a: "We recommend connecting a domain-based email (like yourname@yourcompany.com) rather than your personal Gmail. SharaSpot warms up that account first and keeps daily volume safe. You can add multiple accounts to spread the load further. Your main personal address stays untouched."
    },
    {
        q: `How much does it cost?`,
        a: `During early access, it is $${BRAND_CONFIG.pricing.monthly} per month. That includes everything. Priority sending, unlimited campaigns, tracking, and reply detection. There are no seat limits and no feature tiers. The price will increase when we launch publicly.`
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
        <section id="faq" className="py-20 lg:py-28 bg-[#f8f9fa] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
                <div className="absolute top-1/3 right-[5%] w-[350px] h-[350px] rounded-full bg-[#00A63E]/[0.02] blur-3xl" />
                <div className="absolute bottom-1/4 left-[10%] w-[300px] h-[300px] rounded-full bg-brand/[0.015] blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">

                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                            Questions
                        </h2>
                    </div>

                    <div>
                        {faqs.map((f, i) => (
                            <FAQItem key={i} q={f.q} a={f.a} />
                        ))}

                        <div className="pt-8 mt-2">
                            <p className="text-sm text-text-secondary">
                                Something else on your mind?{" "}
                                <a
                                    href={BRAND_CONFIG.supportUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand font-medium hover:underline underline-offset-4"
                                >
                                    Talk to the team
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
