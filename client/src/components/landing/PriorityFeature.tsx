"use client";

import { useRouter } from "next/navigation";

export default function PriorityFeature() {
    const router = useRouter();

    return (
        <section id="priority" className="py-20 lg:py-28 bg-text-primary relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#00A63E]/3 to-transparent opacity-60" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#00A63E]/2 to-transparent opacity-40" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">

                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
                    <div className="pt-1">
                        <div className="w-8 h-[3px] bg-brand rounded-full mb-5" />
                        <p className="text-sm font-bold text-brand">Priority sending</p>
                    </div>

                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight mb-8">
                            When your outreach cannot wait for a queue
                        </h2>

                        <div className="space-y-8 mb-12">
                            <p className="text-base text-white/70 leading-[1.8]">
                                Most outreach can go out on a schedule. Some cannot. A fundraising window. A hiring push before a competitor moves. A deal that has gone quiet and needs a reply today. Priority sending skips the queue entirely and routes your campaign through your best-performing accounts with the cleanest sending history.
                            </p>
                            <p className="text-base text-white/70 leading-[1.8]">
                                The email goes out immediately, lands in the primary inbox, and you see the reply come in while you are still at your desk. No batch delays, no throttling windows, no waiting.
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/[2%] border border-white/[6%] p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-brand" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                                    A real use case
                                </p>
                            </div>
                            <p className="text-base text-white/80 leading-[1.8] mb-8">
                                Sahil saw a Sequoia tweet at 9am about wanting to meet climate founders. He turned on Priority sending for 12 VCs. By 9:45am every email was delivered and sitting in primary inboxes. He had his first reply by 10am.
                            </p>
                            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/[8%]">
                                <div>
                                    <p className="text-3xl font-bold text-white tracking-tight">12</p>
                                    <p className="text-xs text-white/50 mt-1">Emails sent</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white tracking-tight">43<span className="text-lg font-normal text-white/50 ml-1">min</span></p>
                                    <p className="text-xs text-white/50 mt-1">Send to first open</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-brand tracking-tight">4</p>
                                    <p className="text-xs text-white/50 mt-1">Replies by end of day</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={() => router.push("/priority")}
                                className="text-sm font-semibold text-brand border-b border-brand pb-0.5 hover:opacity-70 transition-opacity"
                            >
                                Learn more about Priority sending
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
