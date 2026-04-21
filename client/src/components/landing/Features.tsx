"use client";

import { Zap, Clock, ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, Ghost, EyeOff, Users, ShieldAlert, Target, Heart, Handshake, Sparkles, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Features() {
    const router = useRouter();
    return (
        <section className="py-24 bg-[#fcfcfc] border-b border-border-light relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20">
                    <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-4">The SharaSpot Standard</p>
                    <h2 className="text-3xl lg:text-5xl font-bold text-text-primary tracking-tighter leading-tight mb-6">
                        Stop shouting into the void. <br />
                        <span className="text-brand">Start getting replies.</span>
                    </h2>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto font-medium">
                        Generic email tools are designed for noise. SharaSpot is for results—ensuring your high-stakes outreach is seen by the people who matter.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {[
                        {
                            icon: EyeOff,
                            accent: "text-amber-600 bg-amber-50",
                            title: "Never Get Ignored Again",
                            pain: "Your pitch is perfect, but it's sitting in the junk folder where no one will ever find it.",
                            outcome: "We ensure you land exactly where your prospects look first: the Primary Inbox. No promotions tab. No spam. Just visibility."
                        },
                        {
                            icon: Target,
                            accent: "text-brand bg-brand-light",
                            title: "Land Where They Look",
                            pain: "Decision-makers check their primary inbox at 8 AM. If you aren't there, you don't exist.",
                            outcome: "Our system adapts to the natural rhythm of the business day, making sure your invitation is the first thing they see when they start their work."
                        },
                        {
                            icon: ShieldCheck,
                            accent: "text-slate-600 bg-slate-100",
                            title: "Protect Your Reputation",
                            pain: "One bad week of mass mailing can flag your company domain forever, killing your future growth.",
                            outcome: "We act as a protective barrier, isolating your primary brand from the risks of outreach while maintaining absolute authority."
                        },
                        {
                            icon: Heart,
                            accent: "text-blue-600 bg-blue-50",
                            title: "Human-First Connection",
                            pain: "Nothing kills a deal faster than a robotic follow-up that arrives after the person already replied.",
                            outcome: "Our logic understands human interaction. We stop everything the moment they engage, preserving the respect and trust you've built."
                        },
                        {
                            icon: TrendingUp,
                            accent: "text-brand bg-brand-light",
                            title: "Verified Opportunities",
                            pain: "Wasting effort on dead-end leads hurts your performance and kills your motivation.",
                            outcome: "We find the 'green lights' for you, ensuring every minute you spend on outreach is directed toward live, active opportunities."
                        },
                        {
                            icon: Zap,
                            accent: "text-emerald-600 bg-emerald-50",
                            title: "Command the Inbox",
                            pain: "Sending too much at once triggers 'digital alarms' that get you blocked before you even start.",
                            outcome: "We engineer a sequence that feels completely natural, bypassing standard restrictions to keep your pipeline moving at scale."
                        },
                        {
                            icon: Handshake,
                            accent: "text-violet-600 bg-violet-50",
                            title: "Partner Relationship Management",
                            pain: "Your partner network lives in spreadsheets. You forget who you last contacted, deals stall without warning, and regional partners slip through the cracks.",
                            outcome: "Track every partner stage, segment by region or tier, and automate follow-ups that remind you when it's time to reconnect. Never let a partnership go cold again."
                        }
                    ].map((f, i) => (
                        <div key={i} className="group relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${f.accent} group-hover:scale-110 transition-transform`}>
                                <f.icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-3">{f.title}</h3>
                            <p className="text-[13px] text-text-muted leading-relaxed mb-4 pb-4 border-b border-border-light italic font-medium">
                                &ldquo;{f.pain}&rdquo;
                            </p>
                            <p className="text-[14px] text-text-secondary leading-relaxed font-medium">
                                {f.outcome}
                            </p>
                        </div>
                    ))}
                    <div className="group relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-orange-600 bg-orange-50 group-hover:scale-110 transition-transform`}>
                            <Sparkles size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-3">AI Follow-up Generation</h3>
                        <p className="text-[13px] text-text-muted leading-relaxed mb-4 pb-4 border-b border-border-light italic font-medium">
                            &ldquo;Writing five different follow-ups that don’t sound like annoying spam is nearly impossible.&rdquo;
                        </p>
                        <p className="text-[14px] text-text-secondary leading-relaxed font-medium">
                            Our AI engine crafts personalized, threaded follow-ups that build on your last message. It keeps the conversation alive and professional automatically.
                        </p>
                    </div>
                    <div className="group relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 bg-emerald-50 group-hover:scale-110 transition-transform`}>
                            <BarChart3 size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-3">Real-Time Signal Analytics</h3>
                        <p className="text-[13px] text-text-muted leading-relaxed mb-4 pb-4 border-b border-border-light italic font-medium">
                            &ldquo;You have no idea why your campaign failed or which subject line actually worked.&rdquo;
                        </p>
                        <p className="text-[14px] text-text-secondary leading-relaxed font-medium">
                            Track every open, click, and reply with absolute precision. Our dashboard gives you the raw data you need to kill what fails and scale what wins.
                        </p>
                    </div>
                </div>

                <div className="mt-20 p-1 bg-white border border-border-light rounded-2xl shadow-sm">
                    <div className="p-8 border border-border-light rounded-xl flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <p className="text-xl font-bold text-text-primary tracking-tight">Protect your most valuable asset.</p>
                            <p className="text-sm text-text-muted font-medium">Your company's reputation is harder to fix than it is to protect. Start reaching out with confidence today.</p>
                        </div>
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-brand text-white text-sm font-bold px-8 py-3 rounded-lg hover:bg-brand/90 transition-all shadow-lg shadow-brand/10 whitespace-nowrap"
                        >
                            Get the replies you deserve
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
