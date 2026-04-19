"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import { 
  Zap, Shield, Gauge, Cpu, Clock, 
  CheckCircle2, Menu, X, Activity,
  RefreshCw, Globe
} from "lucide-react";

export default function PriorityPage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/guide" className="hover:text-gray-900 transition-colors">Guide</Link>
            <Link href="/priority" className="text-gray-900 font-semibold">Priority</Link>
            <Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
          </div>
          <Button className="hidden md:block w-auto px-5 py-2 rounded-full text-sm" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-1 bg-white">
            <Link href="/guide" className="block text-sm text-gray-600 py-3" onClick={() => setMobileNav(false)}>Guide</Link>
            <Link href="/priority" className="block text-sm text-gray-900 font-medium py-3" onClick={() => setMobileNav(false)}>Priority</Link>
            <Link href="/faq" className="block text-sm text-gray-600 py-3" onClick={() => setMobileNav(false)}>FAQ</Link>
            <Button className="w-full rounded-full mt-2" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32 bg-slate-950">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00A63E]/10 rounded-full blur-[120px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00A63E]/5 rounded-full blur-[100px] -ml-24 -mb-24" />
          </div>
          
          <div className="max-w-6xl mx-auto px-6 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A63E]/10 border border-[#00A63E]/20 text-[#00A63E] text-xs font-bold mb-6">
                <Zap size={14} />
                <span>REAL-TIME INFRASTRUCTURE</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-8">
                Priority Mail <br />
                <span className="text-[#00A63E]">Engineered for Speed.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-400 leading-relaxed mb-10">
                When your outreach cannot wait for a queue. Priority Mail bypasses standard processing pipelines, routing your most critical messages through dedicated high-reputation nodes with sub-millisecond decision latency.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="rounded-full px-8 py-6 text-base" onClick={() => router.push("/login")}>
                  Experience Priority
                </Button>
                <Link href="#benchmarks">
                  <button className="px-8 py-3 h-full rounded-full border border-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors">
                    View Benchmarks
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benchmarks Section */}
        <section id="benchmarks" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Industry-Leading Performance
                </h2>
                <p className="text-slate-600 mb-10 leading-relaxed">
                  We&apos;ve stress-tested our routing engine against global workloads. The results show that SharaSpot Priority Mail isn&apos;t just fast—it&apos;s the fastest infrastructure for personalized outreach.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Cpu className="text-[#00A63E]" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Decision Throughput</h4>
                      <p className="text-sm text-slate-500">Capable of handling complex routing logic for hundreds of thousands of concurrent requests.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Clock className="text-[#00A63E]" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Predictable Latency</h4>
                      <p className="text-sm text-slate-500">Sub-millisecond processing ensures your emails hit the SMTP wire instantly.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Throughput</p>
                    <Activity className="text-[#00A63E] mb-1" size={20} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">340,000+</h3>
                    <p className="text-slate-500 font-medium text-lg">decisions / sec</p>
                  </div>
                  <div className="mt-6 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00A63E] w-[94%]" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Latency</p>
                    <Gauge className="text-[#00A63E] mb-1" size={20} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">&lt; 1</h3>
                    <p className="text-slate-500 font-medium text-lg">millisecond</p>
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00A63E] w-[15%]" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">OPTIMIZED PATH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">The Priority Advantage</h2>
              <p className="text-slate-600">Built for the most demanding outreach scenarios where every minute matters.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Instant Queue Bypass",
                  desc: "While standard emails wait in batch processing, Priority messages are routed to the front of the line immediately.",
                  icon: Zap
                },
                {
                  title: "Premium Node Selection",
                  desc: "We route priority traffic through IPs with the highest reputation scores and lowest bounce rates globally.",
                  icon: Globe
                },
                {
                  title: "Smart Retry Logic",
                  desc: "If a node experiences even minor latency, our engine reroutes your message in real-time to an optimal path.",
                  icon: RefreshCw
                },
                {
                  title: "Enhanced Security",
                  desc: "Priority traffic is isolated in a secure environment with end-to-end encryption and audit logging.",
                  icon: Shield
                },
                {
                  title: "Real-time Monitoring",
                  desc: "Track your priority sends with second-by-second updates and detailed delivery reports.",
                  icon: Activity
                },
                {
                  title: "100% Delivery Goal",
                  desc: "Designed to minimize any risk of gray-listing or delays through aggressive reputation management.",
                  icon: CheckCircle2
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-[#00A63E]/30 transition-all hover:shadow-md group">
                  <div className="w-12 h-12 rounded-xl bg-[#00A63E]/5 flex items-center justify-center mb-6 group-hover:bg-[#00A63E]/10 transition-colors">
                    <feature.icon className="text-[#00A63E]" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A63E]/10 border border-[#00A63E]/20 text-[#00A63E] text-xs font-bold mb-8">
              <span>UPGRADE YOUR OUTREACH</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-8 tracking-tight">
              Ready to send with <br />
              uncompromising performance?
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Join the elite founders and sales teams who use Priority Mail to close deals, raise capital, and hire talent before anyone else.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="rounded-full w-full sm:w-auto px-12 py-6 text-base" onClick={() => router.push("/login")}>
                Start Sending Now
              </Button>
              <p className="text-sm text-slate-400 font-medium">No credit card required for 7 days.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Link href="/" aria-label="Go to homepage"><Logo size="sm" /></Link>
          <nav className="flex flex-wrap justify-center items-center gap-6 text-sm">
            <Link href="/guide" className="text-slate-500 hover:text-[#00A63E] transition-colors">Guide</Link>
            <Link href="/priority" className="text-slate-900 font-medium">Priority</Link>
            <Link href="/faq" className="text-slate-500 hover:text-[#00A63E] transition-colors">FAQ</Link>
            <Link href="/privacy" className="text-slate-500 hover:text-[#00A63E] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-slate-500 hover:text-[#00A63E] transition-colors">Terms</Link>
          </nav>
          <span className="text-xs text-slate-400 font-medium">© 2026 SharaSpot Infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
