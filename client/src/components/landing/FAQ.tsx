"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
    {
        question: "How does multi-sender rotation work?",
        answer: "Instead of sending 500 emails from one account, SharaSpot can send 50 emails from 10 different accounts. This mimics natural human behavior and keeps you well within the safe limits of providers like Google and Microsoft, significantly reducing the risk of your domain being flagged."
    },
    {
        question: "Is there a limit to how many accounts I can connect?",
        answer: "No. Our platform is designed to scale with you. You can connect as many Google Workspace, Microsoft 365, or custom SMTP/IMAP accounts as you need. Each account is treated as an isolated sender with its own reputation monitoring."
    },
    {
        question: "What makes Priority Mail different from standard sending?",
        answer: "Priority Mail bypasses the shared sending queues used by most marketing platforms. Your emails are routed through high-reputation, low-latency infrastructure that is constantly monitored for placement. We make over 50,000 routing decisions per second to ensure your email lands in the primary inbox."
    },
    {
        question: "How does the automatic warmup process work?",
        answer: "When you add a new sender, we gradually increase the daily sending volume over 14 to 28 days. This process builds a positive sender reputation with ESPs. If you connect an account that already has a long history and high reputation, you can choose to skip the warmup."
    },
    {
        question: "Will SharaSpot work with my current CRM or tech stack?",
        answer: "Yes. SharaSpot is designed to be the delivery layer of your outreach. We provide easy import/export for contacts and are building native integrations with major CRMs. Our API also allows you to trigger sends and receive tracking data programmatically."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 lg:py-32 bg-[#fcfcfc] border-y border-border-light">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-20">
                    <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Support</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
                        Frequently asked <span className="text-text-muted">questions.</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div 
                            key={i} 
                            className="bg-white border border-border-light rounded-2xl overflow-hidden transition-all duration-300 hover:border-brand/20"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full px-8 py-6 flex items-center justify-between text-left"
                            >
                                <span className="text-[16px] font-bold text-text-primary">{faq.question}</span>
                                <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-text-muted transition-transform duration-300 ${openIndex === i ? 'rotate-180 bg-brand/10 text-brand' : ''}`}>
                                    {openIndex === i ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-8 pb-8">
                                            <div className="pt-4 border-t border-border-light">
                                                <p className="text-[15px] text-text-secondary leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
