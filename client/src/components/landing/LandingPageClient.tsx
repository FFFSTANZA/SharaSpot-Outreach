"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import MailAppContainer from "@/components/landing/MailAppContainer";
import Hero from "@/components/landing/Hero";
import PriorityFeature from "@/components/landing/PriorityFeature";
import Features from "@/components/landing/Features";
import AILab from "@/components/landing/AILab";
import UseCases from "@/components/landing/UseCases";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import Support from "@/components/landing/Support";
import { BRAND_CONFIG } from "@/lib/config";

export default function LandingPageClient() {
  const router = useRouter();

  return (
    <MailAppContainer>
      <main>
        <Hero />
        <UseCases />
        <Features />
        <AeoSection />
        <AILab />
        <PriorityFeature />
        <HowItWorks />

        <section id="pricing" className="py-16 sm:py-20 lg:py-32 bg-slate-950 relative overflow-hidden border-t border-slate-800">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('/pricing-faq-bg.jpg')] bg-cover bg-center opacity-18" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/80 to-slate-950/90" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-brand/15 blur-[120px]" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            <div className="grid lg:grid-cols-[1fr_400px] gap-10 lg:gap-32 items-center">
              <div>
                <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em] mb-4">
                  Everything included
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white tracking-tighter leading-[1.08] mb-6 sm:mb-8">
                  The person you need to reach is <br />
                  <span className="text-brand">checking their inbox</span> right now.
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 sm:mb-10 max-w-xl">
                  If your outreach problem is really a deliverability problem, better messaging alone will not fix it. Start with a system that helps your team send more carefully from day one.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full sm:w-auto bg-brand text-white text-sm font-semibold px-8 py-3.5 rounded-lg hover:bg-brand/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group shadow-xl shadow-brand/10"
                  >
                    Get Started Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-xs text-slate-400">Fast setup • Secure checkout via Dodo</p>
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

function AeoSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F8F9FA] border-t border-border-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-10 sm:mb-14">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.22em] mb-4">
            Search-Ready Answers
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tighter leading-tight mb-5">
            What SharaSpot is, who it is for, and why teams use it.
          </h2>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            This section is written to answer the exact questions founders, SDR leaders, recruiters, and partner teams ask when they evaluate cold outreach software.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              title: "What is SharaSpot?",
              body: "SharaSpot is a cold outreach platform designed to improve deliverability discipline, protect sender reputation, and help teams get more useful conversations from outbound email. It combines sender rotation, account warmup, reply detection, tracking, and workflow tools in one system.",
            },
            {
              title: "Who should use SharaSpot?",
              body: "SharaSpot is built for founders doing investor outreach, sales teams running outbound, recruiters sourcing talent, and partnership teams managing partner pipelines. It fits teams that care more about inbox placement and response quality than raw send volume.",
            },
            {
              title: "How does SharaSpot improve cold email deliverability?",
              body: "It spreads volume across multiple senders, ramps new accounts gradually with warmup, uses adaptive throttling, and stops follow-ups when recipients reply. That reduces risky behavior patterns that often push outreach into spam or secondary tabs.",
            },
            {
              title: "Why is SharaSpot a strong lead-generation tool?",
              body: "It helps teams reach decision-makers more consistently, keep outreach personalized, and track engagement without losing control of sender health. Better delivery discipline gives good messaging a better chance to convert into meetings, candidates, and partnership conversations.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-border-light bg-white p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-text-primary tracking-tight mb-3">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-text-secondary leading-7">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "What problem does it solve?",
              body: "SharaSpot is useful when your team already has offers, lists, and messaging, but your process around sender reputation, sequence control, and outreach operations is still fragile.",
            },
            {
              title: "What is the main differentiator?",
              body: "The platform is organized around operational safety: sender rotation, warmup, reply-aware sequences, and workflow visibility instead of just send-more automation.",
            },
            {
              title: "What should a buyer evaluate first?",
              body: "Check whether your current bottleneck is list quality, copy, or sender health. That answer determines whether you need more messaging work, better targeting, or better delivery controls.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-border-light bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-text-primary tracking-tight mb-3">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-7">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-slate-950 p-6 sm:p-8 lg:p-10 text-white">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            What you get in the first {BRAND_CONFIG.pricing.trialDays} days
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "A sender setup path that gets your first account connected quickly.",
              "A practical workflow for building safer campaigns and follow-up sequences.",
              "A clearer benchmark for whether your current outreach problem is messaging, list quality, or deliverability.",
            ].map((point) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-200 leading-6">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard() {
  const [region, setRegion] = React.useState<"india" | "global">("global");

  React.useEffect(() => {
    fetch("/geo")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.country_code === "IN") setRegion("india");
      })
      .catch(() => {});
  }, []);

  const pricing = BRAND_CONFIG.pricing[region];

  return (
    <div className="bg-slate-50 border border-border-light rounded-2xl p-6 sm:p-8">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Transparent Pricing</p>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold text-text-primary">{pricing.symbol}{pricing.amount}</span>
        <span className="text-sm font-medium text-text-muted">/month</span>
      </div>
      <p className="text-[13px] text-text-secondary mb-8 font-medium">Start with {BRAND_CONFIG.pricing.trialDays} days free. Then one flat price with zero hidden fees.</p>

      <ul className="space-y-3">
        {[
          "Unlimited Sender Rotation",
          "Unlimited Campaigns",
          "Adaptive Priority Delivery",
          "Reply Detection",
          "PRM Infrastructure",
          "Automated Account Warmup",
          "Real-time Signal Analytics"
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-[12px] font-bold text-text-primary uppercase tracking-tight">
            <Zap size={10} className="text-brand fill-brand" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
