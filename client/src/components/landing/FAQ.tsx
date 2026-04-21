"use client";

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
    {
        question: "How does multi-sender rotation function?",
        answer: "Instead of overwhelming a single domain, SharaSpot distributes volume across a network of verified senders. This decentralization mimics human behavior and preserves domain integrity across all major ESPs."
    },
    {
        question: "Is there a limit to connected infrastructure?",
        answer: "No. The system is architected for infinite horizontal scale. You can connect an unlimited number of Google, Microsoft, or custom SMTP nodes. Each node operates in isolation with its own reputation layer."
    },
    {
        question: "What differentiates Priority from standard sending?",
        answer: "Standard sending is batched and queued, making it predictable for spam filters. Priority utilizes a high-frequency routing layer that makes micro-adjustments in real-time to bypass shared buffers."
    },
    {
        question: "How is the warmup protocol managed?",
        answer: "New senders are introduced through a gradual volume ramp over 14-28 days. This seasoning process is fully automated, ensuring each domain achieves peak reputation before high-volume execution."
    },
    {
        question: "Does SharaSpot integrate with my existing stack?",
        answer: "Yes. SharaSpot is designed as a modular delivery layer. We provide robust API endpoints and native hooks for major CRMs, allowing you to trigger Priority sends from your current workflow."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-24 lg:py-32 bg-[#fcfcfc] border-b border-border-light">
            <div className="max-w-4xl mx-auto px-6">
                <div className="flex flex-col items-center text-center mb-20">
                    <div className="w-10 h-10 border border-border-light flex items-center justify-center mb-6">
                        <HelpCircle size={20} className="text-text-muted" />
                    </div>
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">System Documentation</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
                        Technical Inquiries.
                    </h2>
                </div>

                <div className="space-y-px bg-border-light border border-border-light">
                    {faqs.map((faq, i) => (
                        <div 
                            key={i} 
                            className="bg-white overflow-hidden transition-colors hover:bg-slate-50"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full px-8 py-8 flex items-center justify-between text-left"
                            >
                                <span className="text-[15px] font-bold text-text-primary uppercase tracking-tight">{faq.question}</span>
                                <div className={`transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-brand' : 'text-text-muted'}`}>
                                    {openIndex === i ? <Minus size={18} /> : <Plus size={18} />}
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                    >
                                        <div className="px-8 pb-8">
                                            <p className="text-[14px] text-text-secondary leading-relaxed max-w-2xl">
                                                {faq.answer}
                                            </p>
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
