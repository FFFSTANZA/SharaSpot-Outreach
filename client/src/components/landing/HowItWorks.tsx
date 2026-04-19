"use client";

import { useRouter } from "next/navigation";

const steps = [
    {
        step: "Connect your sending accounts",
        desc: "Add one or more Gmail or Outlook accounts. SharaSpot runs a 14-day warmup automatically, gradually increasing volume through each account until it has a clean sending history. You can skip warmup for accounts you have already been using for outreach.",
        note: "Takes about 3 minutes. No developer setup or IT involvement needed.",
    },
    {
        step: "Write your message and upload your list",
        desc: "Paste a CSV with your contacts. Write your email in a plain editor, add follow-up steps, and use variables to personalize by name, company, or any column in your spreadsheet. There is a template library for investor, sales, and recruiting outreach if you want a starting point.",
        note: "Your words, your message. SharaSpot handles everything after you hit send.",
    },
    {
        step: "Watch the replies come in",
        desc: "SharaSpot handles timing, rotation across your accounts, and follow-up scheduling. When anyone on your list replies, their sequence stops immediately. You come in to have the conversation. Everything else runs without you.",
        note: "Real-time dashboard shows opens, clicks, and replies as they happen.",
    },
];

export default function HowItWorks() {
    const router = useRouter();

    return (
        <section id="how-it-works" className="py-20 lg:py-28 bg-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
                <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-[#00A63E]/[0.015] blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-brand/[0.01] blur-3xl" />
                <svg className="absolute top-20 left-[10%] w-24 h-24 text-border-light opacity-30" viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="45" />
                </svg>
                <svg className="absolute bottom-32 right-[15%] w-16 h-16 text-border-light opacity-20" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="15" y="15" width="70" height="70" rx="8" />
                </svg>
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">

                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-16">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                            How it works
                        </h2>
                    </div>
                    <div className="lg:pt-2">
                        <p className="text-text-secondary text-lg leading-relaxed max-w-xl">
                            You do not need to understand email infrastructure. You need to know who you are reaching out to and what you want to say.
                        </p>
                    </div>
                </div>

                <div className="border-t border-border-light">
                    {steps.map((s, i) => (
                        <div
                            key={s.step}
                            className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-20 py-10 border-b border-border-light"
                        >
                            <div className="flex items-start gap-4 lg:block">
                                <div className="w-8 h-8 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0 lg:mb-4">
                                    {i + 1}
                                </div>
                                <p className="text-sm font-bold text-text-primary lg:mt-0 mt-1.5">{s.step}</p>
                            </div>
                            <div>
                                <p className="text-sm text-text-secondary leading-[1.85] mb-4">{s.desc}</p>
                                <p className="text-xs text-brand font-medium">{s.note}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-10 border-t border-border-light">
                    <div>
                        <p className="text-base font-semibold text-text-primary mb-1">Ready to try it?</p>
                        <p className="text-sm text-text-secondary">Free for 7 days. No credit card required.</p>
                    </div>
                    <button
                        onClick={() => router.push("/login")}
                        className="bg-brand text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors whitespace-nowrap"
                    >
                        Get started free
                    </button>
                </div>

            </div>
        </section>
    );
}
