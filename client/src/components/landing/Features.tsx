"use client";

import { Shield, Zap, Clock, Fingerprint, Database, Globe } from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Send emails at scale with our high-performance infrastructure.",
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description: "Your data is encrypted and never shared with third parties.",
    },
    {
        icon: Clock,
        title: "Smart Scheduling",
        description: "AI-powered timing ensures your emails land at the perfect moment.",
    },
    {
        icon: Fingerprint,
        title: "Personalized at Scale",
        description: "Custom templates that feel personally written for each recipient.",
    },
    {
        icon: Database,
        title: "Advanced Analytics",
        description: "Track opens, clicks, and responses with detailed insights.",
    },
    {
        icon: Globe,
        title: "Global Delivery",
        description: "Reach inbox anywhere with our worldwide email network.",
    },
];

export default function Features() {
    return (
        <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight mb-4">
                        Everything you need to scale outreach
                    </h2>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Powerful features designed to help you reach more people, faster.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-text-primary/5 border border-border-light hover:border-brand/20 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                                <feature.icon className="w-6 h-6 text-brand" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-text-muted">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
