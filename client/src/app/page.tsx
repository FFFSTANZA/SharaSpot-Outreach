"use client";

import MailAppContainer from "@/components/landing/MailAppContainer";
import Hero from "@/components/landing/Hero";
import PriorityFeature from "@/components/landing/PriorityFeature";
import Features from "@/components/landing/Features";
import UseCases from "@/components/landing/UseCases";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import Button from "@/components/Button";
import { BRAND_CONFIG } from "@/lib/config";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Landing Page - Refactored as an Email/Inbox experience.
 * Direct visceral addressing of outreach pain points.
 */
export default function LandingPage() {
  const router = useRouter();

  return (
    <MailAppContainer>
      <main className="space-y-32">
        {/* Entrance Hero */}
        <section id="hero">
          <Hero />
        </section>

        {/* The X-Factor */}
        <section id="priority">
          <PriorityFeature />
        </section>

        {/* Core Differentiation */}
        <section id="features">
          <Features />
        </section>

        {/* Applied Context */}
        <section id="use-cases">
          <UseCases />
        </section>

        {/* Implementation Logic */}
        <section id="how-it-works">
          <HowItWorks />
        </section>

        {/* Infrastructure Stats */}
        <section id="stats">
          <Stats />
        </section>

        {/* Support Context */}
        <section id="faq">
          <FAQ />
        </section>

        {/* Purposeful CTA */}
        <section className="py-24">
          <div className="bg-background border border-border-medium rounded-3xl p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand" />

            <div className="mb-8 inline-flex px-4 py-2 rounded-full bg-brand-light text-brand text-[10px] font-black tracking-widest uppercase">
              Limited Phase: All features inclusive · ${BRAND_CONFIG.pricing.monthly}/mo
            </div>

            <h2 className="text-4xl lg:text-7xl font-black text-text-primary tracking-tighter mb-8 leading-tight">
              Scale your outreach <br />
              <span className="text-brand">without burning out.</span>
            </h2>

            <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop fighting the blacklists. Join the infrastructure layer designed for professional outreach.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="px-10 h-16 text-lg font-black" onClick={() => router.push("/login")}>
                Get Your Priority Seat
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-8 text-[10px] font-mono text-text-muted uppercase tracking-tighter">
              Deployment in &lt; 2 minutes · No lock-in contracts
            </div>
          </div>
        </section>
      </main>
    </MailAppContainer>
  );
}
