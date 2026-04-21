"use client";

import React from "react";
import { Sparkles, Bot, Zap, ArrowRight } from "lucide-react";

export default function AILab() {
    const [activeTab, setActiveTab] = React.useState<"followup" | "agent">("followup");

    return (
        <section id="ai-lab" className="py-24 bg-[#020617] relative overflow-hidden border-y border-white/5">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand/10 blur-[160px] rounded-full opacity-40" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand/10 blur-[160px] rounded-full opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-brand-light text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                        <Sparkles size={12} className="text-brand" /> The Laboratory
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-6 leading-[1.05]">
                        Outreach powered by <br /><span className="text-brand">Shara AI Intelligence.</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                        Step into the future of autonomous communication. We are experimenting with deep logic to solve the silence of cold outreach. Discover what happens when curiosity meets algorithmic precision.
                    </p>
                </div>

                <div className="flex justify-center mb-20">
                    <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-2 shadow-2xl">
                        <button
                            onClick={() => setActiveTab("followup")}
                            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === "followup" ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                        >
                            AI Follow-ups
                        </button>
                        <button
                            onClick={() => setActiveTab("agent")}
                            className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 relative ${activeTab === "agent" ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                        >
                            Shara AI Agent
                            <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-brand text-white text-[8px] rounded-full uppercase tracking-tighter font-black shadow-[0_4px_12px_rgba(0,166,62,0.4)] border-2 border-[#020617]">Beta</span>
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 lg:gap-24 items-center min-h-[480px]">
                    {activeTab === "followup" ? (
                        <>
                            <div className="order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-700">
                                <div className="w-14 h-14 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-10 shadow-[0_0_30px_rgba(0,166,62,0.2)] relative group">
                                    <Sparkles size={28} className="relative transition-transform group-hover:scale-110" />
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight">Stop staring at a blank screen.</h3>
                                <p className="text-lg text-slate-400 leading-relaxed mb-10 font-medium">
                                    Our AI Follow-up Generator understands the deep context of your previous conversation. It doesn't just "bump" the thread—it adds strategic value, asks the right questions, and builds momentum automatically.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        "Context-Aware Sequences",
                                        "Persona-Based Voice",
                                        "Strategic Timing Logic",
                                        "Automated Sentiment"
                                    ].map(item => (
                                        <div key={item} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand/30 hover:bg-white/10 transition-all group/item">
                                            <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center shrink-0 group-hover/item:bg-brand/30 transition-colors">
                                                <Zap size={10} className="text-brand fill-brand" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="order-1 lg:order-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[40px] p-8 lg:p-14 relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] group animate-in fade-in scale-in-95 duration-700">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
                                <div className="space-y-8 relative text-left">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 shadow-sm transform group-hover:-translate-y-1 transition-transform duration-500">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Incoming Signal</p>
                                        </div>
                                        <p className="text-sm text-slate-300 italic font-medium leading-relaxed">"Hi, I saw your recent post about the expansion plan. Would love to hear how SharaSpot fits in..."</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-600">
                                            <ArrowRight className="transform rotate-90" size={16} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-brand/5 rounded-2xl border border-brand/20 shadow-sm border-dashed relative">
                                        <div className="absolute top-6 right-6">
                                            <div className="p-2 rounded-lg bg-brand/10">
                                                <Sparkles size={16} className="text-brand animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                                            <p className="text-[10px] uppercase font-black text-brand tracking-[0.2em]">Generated Response</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2 w-full bg-brand/20 rounded-full animate-pulse" />
                                            <div className="h-2 w-[92%] bg-brand/20 rounded-full animate-pulse delay-75" />
                                            <div className="h-2 w-[85%] bg-brand/20 rounded-full animate-pulse delay-150" />
                                            <div className="h-2 w-[40%] bg-brand/20 rounded-full animate-pulse delay-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="order-2 lg:order-1 animate-in fade-in slide-in-from-left-8 duration-700">
                                <div className="w-14 h-14 rounded-3xl bg-white flex items-center justify-center text-slate-950 mb-10 shadow-[0_0_40px_rgba(255,255,255,0.2)] relative group">
                                    <Bot size={28} className="relative transition-transform group-hover:rotate-12" />
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight font-mono uppercase">The Shara Autonomous Agent.</h3>
                                <p className="text-lg text-slate-400 leading-relaxed mb-10 font-medium">
                                    A fully autonomous outreach engine that handles everything from target research to the final handshake. The Shara AI Agent finds your prospects, analyzes their data, and starts the conversation with expert-level personalization.
                                </p>
                                <div className="p-8 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-transparent pointer-events-none opacity-50" />
                                    <div className="relative flex items-start gap-4">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-brand animate-ping" />
                                        <div>
                                            <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2 block">Alpha Prototype</span>
                                            <p className="text-sm text-white font-bold mb-1">Currently in closed-beta testing.</p>
                                            <p className="text-[12px] text-slate-500 font-medium">Available to select enterprise partners today. Public rollout scheduled for Q3 2026.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2 bg-slate-900 border border-white/10 rounded-[40px] p-8 lg:p-12 relative overflow-hidden text-slate-500 font-mono text-[13px] leading-relaxed shadow-[0_50px_100px_rgba(0,0,0,0.5)] group animate-in fade-in scale-in-95 duration-700">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,166,62,0.1),transparent)] opacity-50" />
                                <div className="flex gap-2 mb-10 relative">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                                </div>
                                <div className="space-y-4 relative text-left">
                                    <p className="flex items-center gap-3"><span className="text-brand font-black">{`>`}</span> <span className="text-slate-300 font-bold">initializing shara_agent_v1.0.4...</span></p>
                                    <p className="flex items-center gap-3"><span className="text-brand font-black">{`>`}</span> <span className="text-slate-300 font-bold">scanning market: b2b_saas_founders</span></p>
                                    <p className="flex items-center gap-3"><span className="text-brand font-black">{`>`}</span> <span className="text-slate-300 font-bold">identifying high-intent signals...</span></p>
                                    <p className="flex items-center gap-3"><span className="text-brand font-black">{`>`}</span> <span className="text-emerald-400 font-bold">status: research_complete [842 targets]</span></p>
                                    <p className="flex items-center gap-3"><span className="text-brand font-black">{`>`}</span> <span className="text-amber-400 font-black animate-pulse">action: drafting_humanoid_outreach...</span></p>
                                    <p className="animate-bounce pt-4 text-brand">_</p>
                                </div>
                                <div className="absolute -bottom-16 -right-16 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 rotate-12 group-hover:rotate-0 transform transition-transform">
                                    <Bot size={320} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
