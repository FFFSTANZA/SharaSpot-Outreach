"use client";

import { useRouter } from "next/navigation";

const points = [
    {
        title: "Your email looks personal because it is treated that way",
        desc: "SharaSpot rotates across multiple email accounts, each built up over 14 days of normal sending activity before your campaign ever touches it. No shared IP pools. No \"sent via\" headers that flag it as a tool. To the recipient's inbox, your message looks exactly like a personal email from someone they know.",
    },
    {
        title: "Follow-ups stop the moment someone responds",
        desc: "Sending a follow-up to someone who already replied is one of the fastest ways to kill a conversation. SharaSpot scans your inbox continuously and cuts the sequence the moment a reply lands. You never have to worry about it again.",
    },
    {
        title: "Volume spread across accounts, not stacked on one",
        desc: "Sending 200 emails a day from a single account is how domains get blacklisted. SharaSpot distributes your sending across as many accounts as you connect, so no single account ever approaches the thresholds that trigger spam filters. Your primary domain stays clean.",
    },
    {
        title: "Everything that happens, you can see",
        desc: "Opens, link clicks, replies, every touchpoint in your campaign is tracked in real time. You know within minutes when someone engages. No more waiting a week to find out if a campaign is working.",
    },
];

export default function Features() {
    const router = useRouter();

    return (
        <section id="features" className="py-20 lg:py-28 bg-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
                <div className="absolute top-1/3 right-[5%] w-[400px] h-[400px] rounded-full bg-brand/[0.02] blur-3xl" />
                <div className="absolute bottom-1/3 left-[15%] w-[250px] h-[250px] rounded-full bg-brand/[0.015] blur-3xl" />
                <svg className="absolute top-24 right-[25%] w-12 h-12 text-border-light opacity-30" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M50 0L61 39H100L68 59L79 98L50 75L21 98L32 59L0 39H39L50 0Z" />
                </svg>
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">

                <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-16">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
                            What makes the difference
                        </h2>
                    </div>
                    <div className="lg:pt-2">
                        <p className="text-text-secondary text-lg leading-relaxed max-w-xl">
                            Most cold email tools focus on sending more. The reply rate stays the same. SharaSpot focuses on what happens to the message between send and inbox.
                        </p>
                    </div>
                </div>

                {/* Feature rows, not cards */}
                <div className="border-t border-border-light">
                    {points.map((p, i) => (
                        <div
                            key={p.title}
                            className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-20 py-10 border-b border-border-light"
                        >
                            <div className="lg:pt-1">
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                                    0{i + 1}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-text-primary mb-3 leading-snug">
                                    {p.title}
                                </h3>
                                <p className="text-sm text-text-secondary leading-[1.8]">
                                    {p.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
