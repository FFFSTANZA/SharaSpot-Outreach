"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  Mail, Shield, Clock, Gauge, AlertTriangle, CheckCircle2,
  ArrowRight, ChevronDown, Send, Users, Rocket,
  Zap, BookOpen, Target, BarChart3, Lock, Menu, X,
  Flame, Paperclip, RefreshCw, FileText, HelpCircle,
  TrendingUp, ShieldCheck, EyeOff, Plus, MousePointer2,
  Handshake, Sparkles, FolderOpen, Tag, Database
} from "lucide-react";

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-20">{children}</section>;
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-600" strokeWidth={1.8} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function Accordion({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
        <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
        <span className="flex-1 text-sm font-semibold text-slate-700">{title}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">{children}</div>}
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function InfoBox({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

function StatGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-white border border-slate-200 p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
          <p className="text-lg font-bold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

const navItems = [
  { label: "Setup", href: "#setup" },
  { label: "Senders", href: "#senders" },
  { label: "Providers", href: "#providers" },
  { label: "Campaigns", href: "#campaigns" },
  { label: "Sequences", href: "#sequences" },
  { label: "PRM", href: "#prm" },
  { label: "Tips", href: "#tips" },
];

export default function GuidePage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-slate-900 transition-colors">{item.label}</a>
            ))}
          </div>
          <Button className="hidden md:block w-auto px-5 py-2 rounded-lg text-sm font-semibold" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-2 bg-white">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="block text-sm font-medium text-slate-600 py-2" onClick={() => setMobileNav(false)}>{item.label}</a>
            ))}
            <Button className="w-full rounded-lg mt-2" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="py-20 lg:py-28 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            <BookOpen size={12} /> Documentation
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mt-6 mb-4">
            SharaSpot <span className="text-brand">Guide</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Everything you need to send emails that actually land in the inbox. Setup, features, and best practices — all in one place.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">

        {/* Setup */}
        <Section id="setup">
          <SectionHeader icon={Rocket} title="Getting Started" description="Set up your first campaign in 5 minutes" />
          <div className="space-y-3">
            <StepCard step="1" title="Sign in with Google" desc="Click 'Continue with Google' on the login page. We'll create a placeholder sender using your Gmail." />
            <StepCard step="2" title="Add your sender" desc="Go to Senders, choose your provider (Gmail, Outlook, Zoho, Yahoo, or Company/Custom), then add your app password." />
            <StepCard step="3" title="Create a campaign" desc="Click Compose, add recipients manually or import a CSV, write your email, and hit send." />
          </div>
          <InfoBox title="App Password" icon={Lock}>
            You need a Google App Password to send emails through SharaSpot. Go to your Google Account → Security → App passwords. Create one for SharaSpot and use it when adding your sender.
          </InfoBox>
        </Section>

        {/* Senders */}
        <Section id="senders">
          <SectionHeader icon={Users} title="Sender Accounts" description="Multiple senders for higher volume" />

          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Each Gmail account has limits (~500 emails/day). Adding multiple senders lets you scale outreach while staying within safe limits. SharaSpot automatically rotates between senders.
            </p>

            <div className="rounded-xl bg-brand-light border border-brand-muted p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-brand mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-brand mb-1">How rotation works</h3>
                  <p className="text-xs text-brand leading-relaxed">Emails are distributed evenly across all senders. If one hits its limit, the rest pick up the slack automatically.</p>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-700">Daily limits by account type</h3>
            <StatGrid
              items={[
                { label: "Free Gmail", value: "300-400/day" },
                { label: "Google Workspace", value: "1,500-1,800/day" },
                { label: "Warmup (Day 1-5)", value: "20-100/day" },
                { label: "Fully warmed", value: "Full limit" },
              ]}
            />

            <InfoBox title="Warmup" icon={Flame}>
              New senders start with low limits that gradually increase over 14 days. This builds sender reputation and prevents spam filters from flagging your account.
            </InfoBox>
          </div>
        </Section>

        {/* Email Providers */}
        <Section id="providers">
          <SectionHeader icon={Shield} title="Connecting Email Providers" description="Gmail, Outlook, Zoho, Yahoo, and company SMTP" />

          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              SharaSpot supports multiple email providers. Each has different setup requirements and daily limits.
            </p>

            <div className="space-y-4">
              {/* Gmail */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">Gmail (free)</h3>
                    <p className="text-xs text-slate-500">@gmail.com addresses</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand bg-brand-light px-2 py-1 rounded">Easiest</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">1</span>
                    <p className="text-xs text-slate-600">Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-bold">myaccount.google.com/apppasswords</a></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">2</span>
                    <p className="text-xs text-slate-600">Select "Mail" as the app and "Other" for device name</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">3</span>
                    <p className="text-xs text-slate-600">Copy the 16-character password</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">4</span>
                    <p className="text-xs text-slate-600">Paste it in SharaSpot when adding your sender</p>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-2">Daily limit: 300-400 emails</p>
                </div>
              </div>

              {/* Google Workspace */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">Google Workspace</h3>
                    <p className="text-xs text-slate-500">@yourcompany.com addresses</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand bg-brand-light px-2 py-1 rounded">Higher limits</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">1</span>
                    <p className="text-xs text-slate-600">Enable 2-Factor Authentication on the Google Admin console</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">2</span>
                    <p className="text-xs text-slate-600">Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-bold">myaccount.google.com/apppasswords</a> for each user</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">3</span>
                    <p className="text-xs text-slate-600">Generate App Password and add to SharaSpot</p>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-2">Daily limit: 1,500-1,800 emails</p>
                </div>
              </div>

              {/* Custom SMTP */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <Database className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">Custom SMTP / Other Providers</h3>
                    <p className="text-xs text-slate-500">Outlook, Proton, iCloud, custom mail servers</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Guided setup</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">1</span>
                    <p className="text-xs text-slate-600">SMTP host (e.g., smtp.gmail.com, smtp.office365.com)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">2</span>
                    <p className="text-xs text-slate-600">Port (usually 587 for TLS or 465 for SSL)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">3</span>
                    <p className="text-xs text-slate-600">Username (usually your full email address)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">4</span>
                    <p className="text-xs text-slate-600">Password or app-specific password</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-6">5</span>
                    <p className="text-xs text-slate-600">Enable TLS/SSL based on provider requirements</p>
                  </div>
                  <InfoBox title="Note" icon={AlertTriangle}>
                    Outlook, Zoho, Yahoo, and many company mailboxes require app passwords. Keep your provider's SMTP host/port handy if you use Company/Custom.
                  </InfoBox>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Campaigns */}
        <Section id="campaigns">
          <SectionHeader icon={Send} title="Campaigns" description="Create and manage your outreach" />

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-700">What you can do</h3>
            <div className="grid gap-3">
              {[
                { icon: Users, title: "Add recipients", desc: "Type manually or import from CSV. CSV columns become template variables." },
                { icon: Paperclip, title: "Attach files", desc: "Up to 10MB per file, 25MB total per campaign. PDF, DOC, XLS, CSV." },
                { icon: EyeOff, title: "Track opens & clicks", desc: "Toggle tracking in sending settings. Enabled by default." },
                { icon: Clock, title: "Schedule sends", desc: "Send immediately or schedule for a specific date and time." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-slate-700">Template variables</h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">CSV Example</p>
              </div>
              <div className="p-4 font-mono text-xs text-slate-600">
                <p>email,name,company</p>
                <p className="text-slate-900">john@acme.com,John,Acme Inc</p>
                <p className="text-slate-900">sarah@tech.co,Sarah,TechCo</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Email Body</p>
              </div>
              <div className="p-4 text-sm text-slate-600">
                <p>Hi <span className="bg-brand-light text-brand px-1.5 py-0.5 rounded font-mono text-xs">{"{{name}}"}</span>,</p>
                <p className="mt-2">I noticed <span className="bg-brand-light text-brand px-1.5 py-0.5 rounded font-mono text-xs">{"{{company}}"}</span> is growing fast...</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Sequences */}
        <Section id="sequences">
          <SectionHeader icon={RefreshCw} title="Follow-Up Sequences" description="Automated follow-ups that stop on reply" />

          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Add up to 5 follow-up steps to any campaign. Each step has its own subject, body, and wait period. When a recipient replies, their sequence stops automatically.
            </p>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Example Sequence</p>
              </div>
              {[
                { step: "1", subject: "Initial outreach", wait: "Day 0 (sent immediately)", color: "bg-brand" },
                { step: "2", subject: "Follow-up", wait: "Day 3", color: "bg-brand-muted" },
                { step: "3", subject: "Last check", wait: "Day 7", color: "bg-brand" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
                  <div className={`h-6 w-6 rounded-md ${s.color} text-white flex items-center justify-center text-xs font-bold`}>
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{s.subject}</p>
                    <p className="text-xs text-slate-500">{s.wait}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-brand-light border border-brand-muted p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-brand mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-brand">Per-recipient controls</h3>
                  <p className="text-xs text-brand mt-1 leading-relaxed">From the campaign detail page, you can pause, resume, or stop sequences for individual recipients.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Priority */}
        <Section id="priority">
          <SectionHeader icon={Zap} title="Priority Delivery" description="Enhanced inbox placement for critical outreach" />

          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Priority Delivery is our premium infrastructure that maximizes inbox placement rates. It uses adaptive throttling, warmup acceleration, and intelligent routing to get your emails where they belong.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "Inbox Placement", value: "96%+", desc: "vs. 52% standard" },
                { title: "Warmup Speed", value: "3x faster", desc: "reaches full limits" },
                { title: "Block Risk", value: "Near-zero", desc: "adaptive protection" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.title}</p>
                  <p className="text-xl font-bold text-brand">{item.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <InfoBox title="How to enable" icon={Zap}>
              Priority Delivery is included in all plans. Campaigns automatically use priority infrastructure when available. Check the Priority page for detailed benchmarks.
            </InfoBox>
          </div>
        </Section>

        {/* PRM */}
        <Section id="prm">
          <SectionHeader icon={Handshake} title="Partner Relationship Management" description="Track and manage your partner network" />

          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              PRM helps you manage channel partners, resellers, and business relationships. Track stages, segment by region or tier, and keep every touchpoint organized.
            </p>

            <h3 className="text-sm font-bold text-slate-700">Key features</h3>
            <div className="space-y-3">
              {[
                { icon: FolderOpen, title: "Contact lists", desc: "Organize partners into lists by region, tier, or status." },
                { icon: Tag, title: "Tags & stages", desc: "Tag partners and track stages: Cold → Warm → Hot → Converted." },
                { icon: Mail, title: "Direct outreach", desc: "Send emails directly to contacts from their profile." },
                { icon: RefreshCw, title: "Automated follow-ups", desc: "Set up sequences to remind you when to reconnect." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                  <div className="h-8 w-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <InfoBox title="Coming from spreadsheets?" icon={Database}>
              Import your existing partner data via CSV. Each row becomes a contact that you can segment, tag, and track over time.
            </InfoBox>
          </div>
        </Section>

        {/* Tips */}
        <Section id="tips">
          <SectionHeader icon={Target} title="Best Practices" description="Get more replies, land in inbox" />

          <div className="space-y-3">
            <Accordion title="Write subject lines that get opened" icon={Mail}>
              <div className="space-y-3 mt-3">
                <p>Keep subjects clear and honest. Avoid spam triggers like "FREE", "URGENT", or excessive punctuation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-brand-light border border-brand-muted p-4">
                    <p className="text-[10px] font-bold text-brand uppercase mb-2">Good</p>
                    <ul className="text-xs text-brand space-y-1">
                      <li>• Quick question about the SWE role</li>
                      <li>• Following up on our conversation</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                    <p className="text-[10px] font-bold text-red-700 uppercase mb-2">Avoid</p>
                    <ul className="text-xs text-red-800 space-y-1">
                      <li>• FREE OPPORTUNITY!!!</li>
                      <li>• URGENT: ACT NOW</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion title="Keep your email list clean" icon={Users}>
              <div className="space-y-2 mt-3">
                <p>Clean lists mean better deliverability:</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• Remove duplicate and invalid emails</li>
                  <li>• Check for typos (gmial.com, yaho.com)</li>
                  <li>• Remove addresses that bounced</li>
                </ul>
              </div>
            </Accordion>

            <Accordion title="Time your campaigns right" icon={Clock}>
              <div className="space-y-2 mt-3">
                <p>Best times to send:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Tuesday–Thursday", "10–11 AM", "2–3 PM"].map((t) => (
                    <span key={t} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{t}</span>
                  ))}
                </div>
              </div>
            </Accordion>

            <Accordion title="Protect your account" icon={Lock}>
              <div className="space-y-2 mt-3">
                <ul className="space-y-1 text-slate-600">
                  <li>• Enable 2FA on your Google account</li>
                  <li>• Use a unique App Password for SharaSpot</li>
                  <li>• Revoke the password if you suspect compromise</li>
                </ul>
              </div>
            </Accordion>
          </div>
        </Section>

        {/* Troubleshooting */}
        <Section id="troubleshooting">
          <SectionHeader icon={AlertTriangle} title="Troubleshooting" description="Common issues and solutions" />

          <div className="space-y-3">
            <Accordion title="All senders at limit" icon={Gauge}>
              <div className="space-y-2 mt-3 text-slate-600">
                <p>All senders have reached their daily limit. The campaign will auto-resume when capacity is available (checked hourly).</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Add more senders to the campaign</li>
                  <li>Wait for midnight UTC when limits reset</li>
                </ul>
              </div>
            </Accordion>

            <Accordion title="Sender in cooldown" icon={Shield}>
              <div className="space-y-2 mt-3 text-slate-600">
                <p>3+ consecutive SMTP errors trigger a 5-minute cooldown. Common causes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>App Password was revoked</li>
                  <li>Google temporarily blocked the account</li>
                </ul>
                <p className="text-xs mt-2">Cooldown expires automatically.</p>
              </div>
            </Accordion>

            <Accordion title="Emails going to spam" icon={AlertTriangle}>
              <div className="space-y-2 mt-3 text-slate-600">
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Remove spam trigger words</li>
                  <li>Add more text content</li>
                  <li>Reduce sending volume initially</li>
                  <li>Clean your email list</li>
                </ul>
              </div>
            </Accordion>
          </div>
        </Section>

        {/* CTA */}
        <div className="rounded-2xl bg-slate-900 p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to start?</h3>
          <p className="text-sm text-slate-400 mb-6">Activate your outreach today and send your first campaign.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button className="w-full sm:w-auto" onClick={() => router.push("/login")}>
              Get Started
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => router.push("/faq")}>
              Read FAQ
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <nav className="flex items-center gap-6">
            <Link href="/guide" className="text-xs font-semibold text-slate-500 hover:text-slate-900">Guide</Link>
            <Link href="/priority" className="text-xs font-semibold text-slate-500 hover:text-slate-900">Priority</Link>
            <Link href="/faq" className="text-xs font-semibold text-slate-500 hover:text-slate-900">FAQ</Link>
          </nav>
          <span className="text-xs font-semibold text-slate-400">© 2026 SharaSpot</span>
        </div>
      </footer>
    </div>
  );
}
