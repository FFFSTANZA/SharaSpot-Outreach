"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Zap, Mail, ShieldCheck, Target } from "lucide-react";
import Button from "@/components/Button";
import { BRAND_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative py-12 lg:py-20 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="animate-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
                        <Zap size={14} className="fill-current" />
                        Infrastructure Report: v4.2 Status Active
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-text-primary leading-[0.9] tracking-tighter mb-8">
                        Stop landing in <br />
                        <span className="text-brand text-6xl lg:text-8xl italic">Spam.</span>
                    </h1>

                    <p className="text-lg text-text-secondary leading-relaxed mb-12 max-w-xl">
                        Your outreach is being ignored because your infrastructure is generic. <strong>SharaSpot</strong> replaces "vibe-coded" sending with deterministic, human-like rotation and a dedicated <strong>Priority Pipeline</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-12">
                        <Button size="lg" className="group h-14 px-8" onClick={() => router.push("/login")}>
                            Claim Your Access
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8" onClick={() => router.push("/guide")}>
                            Technical Guide
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-8 p-6 bg-[#f8f9fa] border border-border-light rounded-2xl">
                        {[
                            { label: "Inbox Delivery", val: "99.4%", icon: Mail },
                            { label: "Accounts Safe", val: "100%", icon: ShieldCheck },
                            { label: "Targeting", val: "High", icon: Target }
                        ].map(stat => (
                            <div key={stat.label} className="text-center">
                                <stat.icon className="mx-auto text-brand mb-2" size={18} />
                                <div className="text-xl font-black text-text-primary tracking-tighter">{stat.val}</div>
                                <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Email Interface Mockup (No AI images) */}
                <div className="relative animate-up animate-delay-200">
                    <div className="bg-[#f1f3f4] rounded-[24px] border border-border-medium shadow-elevated overflow-hidden">
                        <div className="bg-white border-b border-border-light px-4 py-3 flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            <div className="text-[10px] font-mono text-text-muted">priority_dispatch_monitor.sh</div>
                        </div>
                        <div className="p-4 space-y-3">
                            {/* Mock Emails in Queue */}
                            {[
                                { from: "Ops", sub: "Sending to Founders...", status: "In Progress", color: "brand" },
                                { from: "Auth", sub: "Warmup: Account #42", status: "Active", color: "brand" },
                                { from: "System", sub: "Priority bypass triggered", status: "Bypassed", color: "amber-500" },
                            ].map((email, i) => (
                                <div key={i} className="bg-white border border-border-light p-3 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                            email.color === "brand" ? "bg-brand-light text-brand" : "bg-amber-100 text-amber-600"
                                        )}>
                                            {email.from[0]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-text-primary">{email.from}</div>
                                            <div className="text-[10px] text-text-secondary">{email.sub}</div>
                                        </div>
                                    </div>
                                    <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                        email.color === "brand" ? "bg-brand text-white" : "bg-amber-500 text-white"
                                    )}>
                                        {email.status}
                                    </div>
                                </div>
                            ))}

                            {/* Terminal Output */}
                            <div className="mt-4 bg-[#1A1D21] rounded-xl p-4 font-mono text-[10px] text-[#00ff00] h-32 overflow-hidden relative">
                                <div className="opacity-70">shara@infra:~$ tail -f log/priority.log</div>
                                <div className="mt-2">[14:22:01] ENQUEUE_JOB_ID_7721 - OK</div>
                                <div className="mt-1">[14:22:02] ROTATING_SENDER_TO_ACCOUNT_B</div>
                                <div className="mt-1 text-white text-[11px] font-bold">[14:22:03] PRIORITY_BYPASS_ENABLED - LATENCY 0.08s</div>
                                <div className="mt-1">[14:22:04] SYNCING_REPLY_DETECTION_ENGINES</div>
                                <div className="mt-1 opacity-40">[14:22:05] WAITING_FOR_NEXT_BATCH...</div>
                                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#1A1D21] to-transparent" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
