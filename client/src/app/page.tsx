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

export default function LandingPage() {
  const router = useRouter();

  return (
    <MailAppContainer>
      <main>
        <Hero />
        <UseCases />
        <Features />
        <PriorityFeature />
        <HowItWorks />
        <Stats />
        <FAQ />

        {/* Final CTA */}
        <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-light to-transparent" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand/[0.03] blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
              <div className="lg:pt-3">
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Early access
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand mb-3">
                  ${BRAND_CONFIG.pricing.monthly}/month, all features included
                </p>
                <h2 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight mb-6">
                  The person you need to reach is checking their inbox right now
                </h2>
                <p className="text-base text-text-secondary leading-relaxed mb-10 max-w-xl">
                  Every day without this is another investor who never saw your pitch, another candidate who joined someone else, another deal that went to whoever followed up. Start today.
                </p>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => router.push("/login")}
                    className="bg-brand text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    Start for free
                  </button>
                  <p className="text-xs text-text-muted">7-day free trial. No credit card required.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MailAppContainer>
  );
}
