"use client";

import { Shield, Zap, Clock, Fingerprint, Database, Globe, Users, BarChart3, Lock, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function Features() {
    return (
        <section id="features" className="py-24 lg:py-32 bg-white relative overflow-hidden border-y border-border-light">
            <div className="max-w-6xl mx-auto px-6 relative">
                <div className="mb-20">
                    <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Functional Architecture</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight max-w-2xl">
                        A structured approach to <span className="text-text-muted">unbreakable delivery.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-px bg-border-light border border-border-light">
                    {/* Multi-Sender Rotation - Large 2x2 */}
                    <div className="md:col-span-2 md:row-span-2 bg-white p-10 flex flex-col justify-between group">
                        <div>
                            <div className="w-10 h-10 border border-border-light flex items-center justify-center mb-8 group-hover:border-brand transition-colors">
                                <RotateCcw size={20} className="text-text-muted group-hover:text-brand" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-4">Multi-Sender Rotation</h3>
                            <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
                                Distribute volume across hundreds of unique sender profiles. Our system automatically rotates accounts to maintain high reputation and bypass daily provider limits.
                            </p>
                        </div>
                        <div className="mt-12 bg-slate-50 border border-border-light p-6 rounded-sm">
                            <div className="flex flex-col gap-3">
                                {[
                                    { name: "Sender Alpha", status: "Active", load: "24%" },
                                    { name: "Sender Beta", status: "Active", load: "18%" },
                                    { name: "Sender Gamma", status: "Cooldown", load: "0%" }
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-text-primary">{s.name}</span>
                                        <div className="flex items-center gap-4">
                                            <span className={s.status === 'Active' ? 'text-brand' : 'text-text-muted'}>{s.status}</span>
                                            <span className="text-text-muted tabular-nums w-8 text-right">{s.load}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Priority Email - Wide 2x1 */}
                    <div className="md:col-span-2 bg-white p-10 flex flex-col justify-between group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary mb-2">Priority Protocol</h3>
                                <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                                    High-stakes messages bypass standard buffers for immediate primary inbox placement.
                                </p>
                            </div>
                            <div className="w-10 h-10 border border-border-light flex items-center justify-center group-hover:border-brand transition-colors">
                                <Zap size={20} className="text-brand" fill="currentColor" />
                            </div>
                        </div>
                        <div className="mt-8 flex items-center gap-2">
                            <div className="flex -space-x-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">+ 42 verification nodes active</span>
                        </div>
                    </div>

                    {/* Analytics - Small 1x1 */}
                    <div className="bg-white p-8 group">
                        <div className="w-10 h-10 border border-border-light flex items-center justify-center mb-6 group-hover:border-brand transition-colors">
                            <BarChart3 size={20} className="text-text-muted group-hover:text-brand" />
                        </div>
                        <h3 className="text-sm font-bold text-text-primary mb-2">Deep Analytics</h3>
                        <p className="text-text-muted text-xs leading-relaxed">
                            Per-recipient granularity on opens, clicks, and session time.
                        </p>
                    </div>

                    {/* Security - Small 1x1 */}
                    <div className="bg-white p-8 group">
                        <div className="w-10 h-10 border border-border-light flex items-center justify-center mb-6 group-hover:border-brand transition-colors">
                            <Lock size={20} className="text-text-muted group-hover:text-brand" />
                        </div>
                        <h3 className="text-sm font-bold text-text-primary mb-2">Encryption</h3>
                        <p className="text-text-muted text-xs leading-relaxed">
                            Enterprise-grade security for your credentials and data.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
