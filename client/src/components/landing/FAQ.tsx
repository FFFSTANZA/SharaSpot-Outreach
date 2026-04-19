"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        q: "How does multi-sender rotation works?",
        a: "Instead of sending 500 emails from one account and hitting Gmail's limit, we rotate your emails across a pool of senders (e.g., 5 accounts sending 100 each). This protects your domain reputation and ensures high deliverability."
    },
    {
        q: "Do I need a Google App Password?",
        a: "Yes. For security, we recommend using Google App Passwords rather than your main account password. This is a standard practice for third-party email tools and keeps your primary credentials safe."
    },
    {
        q: "What is the 14-day warmup period?",
        a: "When you add a new sender, we gradually increase the sending volume over 14 days. This 'warms up' the IP and domain, building trust with email providers like Google and Outlook to prevent your emails from landing in spam."
    },
    {
        q: "Can I track opens and clicks?",
        a: "Absolutely. We provide real-time tracking for every email sent. You can see who opened your email, which links they clicked, and even if they replied, all from your dashboard."
    }
];

function FAQItem({ q, a, i }: { q: string, a: string, i: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn(
            "border-b border-border-light last:border-0 transition-all",
            isOpen && "pb-6"
        )}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group"
            >
                <span className="text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
                    {q}
                </span>
                <ChevronDown className={cn(
                    "text-text-muted transition-transform duration-300",
                    isOpen && "rotate-180 text-brand"
                )} size={20} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}>
                <p className="text-text-secondary leading-relaxed">
                    {a}
                </p>
            </div>
        </div>
    );
}

export default function FAQ() {
    return (
        <section id="faq" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6">
                <div className="mb-16 text-center">
                    <div className="inline-flex p-3 rounded-2xl bg-brand-light text-brand mb-6">
                        <HelpCircle size={24} />
                    </div>
                    <h2 className="text-3xl lg:text-5xl font-black text-text-primary tracking-tighter mb-4">
                        Common Questions
                    </h2>
                    <p className="text-text-secondary">
                        Everything you need to know about the SharaSpot infrastructure.
                    </p>
                </div>

                <div className="border border-border-light rounded-3xl px-8 bg-background/30 shadow-sm">
                    {faqs.map((faq, idx) => (
                        <FAQItem key={idx} q={faq.q} a={faq.a} i={idx} />
                    ))}
                </div>
            </div>
        </section>
    );
}
