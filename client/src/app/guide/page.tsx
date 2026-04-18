"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Book, Mail, Send, RefreshCw, BarChart3, Shield, Users, Clock, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-4xl flex items-center gap-4 px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Book className="h-4 w-4 text-brand" />
            <h1 className="text-sm font-bold text-gray-900">Platform Guide</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
        <div className="mb-16">
          <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-4">Documentation</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Master the art of <br />
            <span className="text-brand">professional outreach.</span>
          </h2>
          <p className="mt-6 text-sm sm:text-base text-gray-500 leading-relaxed max-w-2xl font-medium">
            SharaSpot is more than an email tool — it&apos;s your personal career accelerator. 
            Learn how to use our multi-sender rotation, automated follow-ups, and adaptive warmup to 
            land more interviews.
          </p>
        </div>

        {/* Guide Content */}
        <div className="space-y-20">
          {/* Section 1: Multi-Sender Rotation */}
          <section className="space-y-8">
            <SectionHeader icon={Users} title="Sender Management" bg="bg-brand" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-100 p-8 hover:border-brand/20 transition-all bg-white shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Multi-Account Rotation</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  Connect multiple Gmail or SMTP accounts to a single campaign. SharaSpot intelligently rotates 
                  between them, ensuring no single account hits sending limits while maximizing your total outreach volume.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-8 hover:border-brand/20 transition-all bg-white shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Natural Pacing</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  We don&apos;t blast emails. SharaSpot adds human-like delays (30-120s) between every send, 
                  mimicking real human behavior to stay under the radar of spam filters.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Follow-up Sequences */}
          <section className="space-y-8">
            <SectionHeader icon={RefreshCw} title="Follow-Up Sequences" bg="bg-brand" />
            
            <div className="rounded-2xl bg-brand-light border border-brand-muted p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="md:w-1/2">
                  <h3 className="text-sm font-bold text-brand mb-4 uppercase tracking-wider">Automated Persistence</h3>
                  <p className="text-sm text-brand/80 leading-relaxed font-bold">
                    Add up to 5 automated follow-ups that stop instantly when a recipient replies. 
                    Multi-threading ensures all follow-ups appear in the same email chain, 
                    maintaining professional context.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      "Custom delay days between steps",
                      "Variable-based personalization in every step",
                      "Automatic reply & bounce detection",
                      "Real-time sequence status per recipient"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold text-brand">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:w-1/2 bg-white rounded-xl border border-brand-muted p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="h-6 w-6 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold">1</div>
                      <span className="text-xs font-bold text-gray-700">Initial Outreach</span>
                    </div>
                    <div className="w-px h-6 bg-brand/20 ml-6" />
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-brand/5 border border-brand/10">
                      <div className="h-6 w-6 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold">2</div>
                      <span className="text-xs font-bold text-brand">Follow-up (3 days later)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Delivery Optimization */}
          <section className="space-y-8">
            <SectionHeader icon={Shield} title="Deliverability & Safety" bg="bg-brand" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard 
                icon={Zap} 
                title="Adaptive Warmup" 
                desc="Gradually ramps up volume over 28 days for new accounts."
              />
              <FeatureCard 
                icon={BarChart3} 
                title="Tracking Pixel" 
                desc="Know exactly when your emails are opened or links are clicked."
              />
              <FeatureCard 
                icon={Clock} 
                title="Business Hours" 
                desc="Emails only send during professional hours to look natural."
              />
            </div>
          </section>

          {/* Call to Action */}
          <section className="pt-10">
            <div className="rounded-2xl bg-gray-900 p-8 sm:p-12 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Ready to accelerate your career?</h3>
                <p className="text-gray-400 text-sm mb-8 max-w-lg mx-auto font-medium">
                  Connect your first sender and start reaching out to decision-makers today.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => router.push('/dashboard/compose')}
                    className="px-8 h-12 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand/20"
                  >
                    Start New Campaign
                  </button>
                  <button 
                    onClick={() => router.push('/contact')}
                    className="px-8 h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
                  >
                    Get Support
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, bg }: { icon: any, title: string, bg: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", bg)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-brand/20 transition-all shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
