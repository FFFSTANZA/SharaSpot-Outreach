"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function Hero() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const mouseX = useRef(0);
    const mouseY = useRef(0);

    useEffect(() => {
        setMounted(true);
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            mouseX.current = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            mouseY.current = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            
            document.documentElement.style.setProperty("--hero-mouse-x", String(mouseX.current * 20));
            document.documentElement.style.setProperty("--hero-mouse-y", String(mouseY.current * 20));
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const stats = [
        { value: "4.2x", label: "More replies" },
        { value: "400+", label: "Active teams" },
        { value: "7 days", label: "Avg. first reply" },
    ];

    return (
        <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div 
                    className="absolute w-[600px] h-[600px] rounded-full bg-brand/5 blur-[100px] transition-transform duration-75 ease-out"
                    style={{ 
                        top: '20%', 
                        right: '-10%',
                        transform: 'translate(var(--hero-mouse-x, 0), var(--hero-mouse-y, 0))'
                    }} 
                />
                <div 
                    className="absolute w-[500px] h-[500px] rounded-full bg-brand/5 blur-[80px] transition-transform duration-75 ease-out"
                    style={{ 
                        bottom: '-10%', 
                        left: '-5%',
                        transform: 'translate(calc(var(--hero-mouse-x, 0) * -1), calc(var(--hero-mouse-y, 0) * -1))'
                    }} 
                />
                
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        radial-gradient(circle at 50% 50%, transparent 0%, var(--color-background) 70%),
                        linear-gradient(90deg, rgba(0,166,56,0.03) 1px, transparent 1px),
                        linear-gradient(rgba(0,166,56,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 40px 40px, 40px 40px',
                    animation: 'gridMove 20s linear infinite'
                }} />

                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-light to-transparent opacity-50" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-light to-transparent opacity-50" />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-24 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <div className={`transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-brand/20 shadow-sm mb-8">
                            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                            <span className="text-sm font-medium text-brand">Now in early access</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold text-text-primary leading-[1.02] tracking-tight mb-6">
                            Cold emails that{" "}
                            <span className="relative">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-brand via-[#16a34a] to-[#22c55e]">
                                    actually get replies
                                </span>
                            </span>
                        </h1>

                        <p className="text-xl text-text-secondary leading-relaxed mb-10 max-w-lg">
                            Founders pitching investors. Sales teams chasing decisions. Recruiters sourcing talent. SharaSpot makes sure your email lands in the primary inbox.
                        </p>

                        <div className="flex flex-wrap items-center gap-5 mb-12">
                            <button
                                onClick={() => router.push("/login")}
                                className="px-8 py-4 bg-brand text-white text-base font-semibold rounded-xl hover:bg-brand/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand/25"
                            >
                                Start for free
                            </button>
                            <button
                                onClick={() => router.push("/guide")}
                                className="px-6 py-4 text-base text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                            >
                                See how it works
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-10 pt-4">
                            {stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col">
                                    <p className="text-3xl font-bold text-text-primary tracking-tight">{stat.value}</p>
                                    <p className="text-sm text-text-muted">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`relative transition-all duration-700 ease-out delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                        <div className="relative">
                            <div className="absolute -inset-6 bg-gradient-to-br from-brand/20 via-transparent to-transparent rounded-3xl blur-3xl" />
                            
                            <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-border-light">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                    <div className="ml-3 flex-1">
                                        <div className="h-2 w-32 bg-gray-200 rounded-full" />
                                    </div>
                                    <span className="text-xs text-text-muted">sharaspot.com/inbox</span>
                                </div>
                                
                                <div className="p-4 space-y-1">
                                    {[
                                        { from: "RS", name: "Rajan Shah", role: "Partner, Sequoia", time: "2 min ago", preview: "Hey, this actually made it into my primary inbox. Let's find 20..." },
                                        { from: "PK", name: "Priya Krishnan", role: "Head of Talent, Swiggy", time: "15 min ago", preview: "We reviewed the candidate. Can you send the full profile?..." },
                                        { from: "MA", name: "Marcus Alder", role: "VP Sales, Notion", time: "1 hour ago", preview: "Caught this between meetings. I'm interested. Can you send..." },
                                        { from: "JN", name: "Jessica Ng", role: "Managing Partner", time: "3 hours ago", preview: "Thanks for reaching out. I'd love to schedule a call to discuss..." },
                                    ].map((email, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand/5 transition-colors cursor-pointer group">
                                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                                                {email.from}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-text-primary">{email.name}</span>
                                                    <span className="text-xs text-text-muted shrink-0">{email.time}</span>
                                                </div>
                                                <p className="text-xs text-text-muted mb-0.5">{email.role}</p>
                                                <p className="text-sm text-text-secondary truncate group-hover:text-brand transition-colors">{email.preview}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-4 py-3 bg-gray-50/50 border-t border-border-light">
                                    <p className="text-sm text-text-muted italic">
                                        "Booked 4 investor calls in 2 weeks. The same emails were going to spam before."
                                    </p>
                                    <p className="text-sm font-semibold text-text-primary mt-1">— Aryan M., pre-seed founder</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-light to-transparent" />
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <span className="text-xs text-text-muted">Scroll to explore</span>
                <div className="w-5 h-8 rounded-full border border-border-light flex items-start justify-center p-1">
                    <div className="w-1 h-2 bg-brand/40 rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
}