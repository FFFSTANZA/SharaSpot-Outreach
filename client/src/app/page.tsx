"use client";

import MailAppContainer from "@/components/landing/MailAppContainer";
import Hero from "@/components/landing/Hero";
import PriorityFeature from "@/components/landing/PriorityFeature";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import { BRAND_CONFIG } from "@/lib/config";
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
        <section className="py-24 lg:py-40 bg-white relative overflow-hidden border-t border-border-light">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-brand/[0.05] blur-[120px]" />
          </div>

          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-10">
                    <Zap size={32} fill="currentColor" />
                </div>
                
                <h2 className="text-4xl lg:text-7xl font-bold text-text-primary tracking-tight leading-[1.05] mb-8 max-w-4xl">
                  The person you need to reach is checking their inbox <span className="text-brand">right now.</span>
                </h2>
                
                <p className="text-lg lg:text-xl text-text-secondary leading-relaxed mb-12 max-w-2xl">
                  Every day without SharaSpot is another investor who never saw your pitch, another candidate who joined a competitor, another deal that went cold. Stop leaving delivery to chance.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full sm:w-auto bg-brand text-white text-sm font-semibold px-10 py-4 rounded-xl hover:bg-brand/90 hover:shadow-brand-glow transition-all flex items-center justify-center gap-2 group"
                  >
                    Start Sending for Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <p className="text-xs text-text-muted font-medium">7-day free trial. No credit card required.</p>
                </div>

                <div className="mt-20 flex flex-wrap justify-center gap-x-10 gap-y-4">
                    {["Google Workspace", "Microsoft 365", "Outlook", "Custom SMTP"].map((p) => (
                        <div key={p} className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                            <CheckCircle2 size={14} className="text-brand" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary">{p}</span>
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
