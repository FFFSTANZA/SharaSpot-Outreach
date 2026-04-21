"use client";

import MailAppContainer from "@/components/landing/MailAppContainer";
import Hero from "@/components/landing/Hero";
import PriorityFeature from "@/components/landing/PriorityFeature";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <MailAppContainer>
      <main>
        <Hero />
        <Stats />
        <UseCases />
        <Features />
        <PriorityFeature />
        <HowItWorks />
        <FAQ />

        {/* Final CTA */}
        <section className="py-24 lg:py-40 bg-white relative overflow-hidden">
          {/* Grid Background */}
          <div 
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{ 
                  backgroundImage: `linear-gradient(to right, var(--color-text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-text-primary) 1px, transparent 1px)`, 
                  backgroundSize: '32px 32px' 
              }}
          />

          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 border border-border-light flex items-center justify-center text-brand mb-10">
                    <Zap size={24} fill="currentColor" />
                </div>
                
                <h2 className="text-4xl lg:text-7xl font-bold text-text-primary tracking-tighter leading-[1.05] mb-8 max-w-4xl">
                  Initialize your <br />
                  <span className="text-brand">delivery advantage.</span>
                </h2>
                
                <p className="text-lg text-text-secondary leading-relaxed mb-12 max-w-2xl">
                  Stop leaving placement to chance. Join the teams using architectural routing to secure the primary inbox.
                </p>
                
                <div className="flex flex-col items-center gap-6">
                  <button
                    onClick={() => router.push("/login")}
                    className="bg-text-primary text-white text-[12px] font-bold uppercase tracking-widest px-12 py-5 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">7-day free trial. No credit card required.</p>
                </div>

                <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
                    {["Google Workspace", "Microsoft 365", "Outlook", "Custom SMTP"].map((p) => (
                        <div key={p} className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-primary">{p}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </section>
      </main>
    </MailAppContainer>
  );
}
