"use client";

import React from "react";

import MailAppContainer from "@/components/landing/MailAppContainer";
import Hero from "@/components/landing/Hero";
import PriorityFeature from "@/components/landing/PriorityFeature";
import Features from "@/components/landing/Features";
import AILab from "@/components/landing/AILab";
import UseCases from "@/components/landing/UseCases";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import Support from "@/components/landing/Support";
import { BRAND_CONFIG } from "@/lib/config";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <MailAppContainer>
      <main>
        <Hero />
        <UseCases />
        <Features />
        <AILab />
        <PriorityFeature />
        <HowItWorks />
        <Stats />

        {/* Final CTA / Pricing */}
        <section id="pricing" className="py-24 lg:py-32 bg-white relative overflow-hidden border-t border-border-light">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-brand/[0.04] blur-[120px]" />
          </div>

          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-32 items-center">
              <div>
                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">
                  Everything included
                </p>
                <h2 className="text-3xl lg:text-5xl font-bold text-text-primary tracking-tighter leading-[1.05] mb-8">
                  The person you need to reach is <br />
                  <span className="text-brand">checking their inbox</span> right now.
                </h2>
                <p className="text-lg text-text-secondary leading-relaxed mb-10 max-w-xl">
                  Every day without this is another investor who never saw your pitch, another candidate who joined someone else, or another deal lost to a competitor. Start today.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full sm:w-auto bg-brand text-white text-sm font-semibold px-8 py-3.5 rounded-lg hover:bg-brand/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group shadow-xl shadow-brand/10"
                  >
                    Start for free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-xs text-text-muted">7-day free trial. No credit card required.</p>
                </div>
              </div>

              <PricingCard />
            </div>
          </div>
        </section>

        <FAQ />
        <Support />
      </main>
    </MailAppContainer>
  );
}

function PricingCard() {
  const [region, setRegion] = React.useState<"india" | "global">("global");

  React.useEffect(() => {
    // Simple client-side region detection
    fetch("https://ipapi.co/json/")
      .then(res => {
        if (!res.ok) return null;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data && data.country_code === "IN") {
          setRegion("india");
        }
      })
      .catch(() => {
        // Silently fail to global
      });
  }, []);

  const pricing = BRAND_CONFIG.pricing[region];

  return (
    <div className="bg-slate-50 border border-border-light rounded-2xl p-8">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Transparent Pricing</p>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold text-text-primary">{pricing.symbol}{pricing.amount}</span>
        <span className="text-sm font-medium text-text-muted">/month</span>
      </div>
      <p className="text-[13px] text-text-secondary mb-8 font-medium">One flat price. Zero hidden fees. All premium infrastructure included.</p>

      <ul className="space-y-3">
        {[
          "Unlimited Sender Rotation",
          "Unlimited Campaigns",
          "Adaptive Priority Delivery",
          "AI Follow-up Generator",
          "PRM Infrastructure",
          "Automated Account Warmup",
          "Real-time Signal Analytics"
        ].map(item => (
          <li key={item} className="flex items-center gap-2.5 text-[12px] font-bold text-text-primary uppercase tracking-tight">
            <Zap size={10} className="text-brand fill-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
