"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  Mail, Shield, Clock, Gauge, AlertTriangle, CheckCircle2,
  ChevronDown, Send, Users,
  BookOpen, Target, BarChart3, Lock, Menu, X,
  Paperclip, RefreshCw,
  TrendingUp, ShieldCheck, EyeOff,
  FolderOpen, Tag, Database,
  Activity, Search, Sliders,
  MessageSquare,
  Globe, Phone, Bot, UserPlus, Key,
} from "lucide-react";
import { SITE_NAME, absoluteUrl, buildBreadcrumbJsonLd } from "@/lib/seo";

const navItems = [
  { label: "Setup", href: "#setup" },
  { label: "Senders", href: "#senders" },
  { label: "Providers", href: "#providers" },
  { label: "Campaigns", href: "#campaigns" },
  { label: "Templates", href: "#templates" },
  { label: "Validation", href: "#validation" },
  { label: "Sequences", href: "#sequences" },
  { label: "Analytics", href: "#analytics" },
  { label: "Inbox", href: "#inbox" },
  { label: "PRM", href: "#prm" },
  { label: "Calls", href: "#calls" },
  { label: "MCP", href: "#mcp" },
  { label: "Team", href: "#team" },
  { label: "Tips", href: "#tips" },
];

const guideStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Guide", path: "/guide" },
    ]),
    {
      "@type": "HowTo",
      "name": `How to get started with ${SITE_NAME}`,
      "url": absoluteUrl("/guide"),
      "description": "A practical setup guide for connecting senders, warming accounts, creating campaigns, and running safer cold outreach.",
      "step": [
        {
          "@type": "HowToStep",
          "name": "Sign in",
          "text": "Sign in with Google to create your workspace and access the platform."
        },
        {
          "@type": "HowToStep",
          "name": "Add a sender",
          "text": "Connect Gmail, Outlook, Zoho, Yahoo, or custom SMTP with an app password."
        },
        {
          "@type": "HowToStep",
          "name": "Create a campaign",
          "text": "Import recipients, write your message, configure tracking and sequences, then send."
        },
        {
          "@type": "HowToStep",
          "name": "Monitor replies and analytics",
          "text": "Use the inbox, tracking, and analytics workflows to monitor engagement and stop follow-ups when replies come in."
        }
      ]
    },
    {
      "@type": "TechArticle",
      "headline": `${SITE_NAME} cold outreach guide`,
      "url": absoluteUrl("/guide"),
      "about": [
        "Cold outreach",
        "Email deliverability",
        "Sender setup",
        "Outbound campaign workflows"
      ]
    }
  ]
};

export default function GuidePage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(guideStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center flex-1 mx-6 overflow-x-auto whitespace-nowrap gap-5 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-slate-900 transition-colors shrink-0">{item.label}</a>
            ))}
          </div>
          <Button className="hidden md:block w-auto px-5 py-2 rounded-lg text-sm font-semibold shrink-0" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileNav(!mobileNav)}>
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
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to send emails that actually land in the inbox. Setup, features, and best practices — all in one place.
          </p>
        </div>
      </div>

      {/* ───────────── 1. SETUP ───────────── */}
      <section id="setup" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Step 1</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Getting Started</h2>
            <p className="text-slate-500 mt-2">Set up your first campaign in 5 minutes</p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</div>
                <div className="w-px flex-1 bg-slate-200 mt-2" />
              </div>
              <div className="pb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Sign in with Google</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Click <span className="font-semibold text-slate-900">Continue with Google</span> on the login page. We&apos;ll create a placeholder sender from your Gmail automatically.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</div>
                <div className="w-px flex-1 bg-slate-200 mt-2" />
              </div>
              <div className="pb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Add a sender</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Go to <span className="font-semibold text-slate-900">Senders</span>, choose your provider (Gmail, Outlook, Zoho, Yahoo, or Custom SMTP), then enter your app password.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">Send your first campaign</h3>
                <p className="text-sm text-slate-600 leading-relaxed">Click <span className="font-semibold text-slate-900">Compose</span>, add recipients manually or import a CSV, write your email, and hit send.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pl-[52px]">
            <div className="border-l-2 border-brand/30 pl-5 py-0.5">
              <p className="text-[11px] font-bold text-brand uppercase tracking-wider mb-1.5">App Password</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                You need an app password to send emails through SharaSpot. Go to your Google Account → <span className="font-semibold text-slate-900">Security → App passwords</span>. Create one for SharaSpot and paste it when adding your sender.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 2. SENDERS ───────────── */}
      <section id="senders" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Step 2</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Sender Accounts</h2>
            <p className="text-slate-500 mt-2">Connect multiple accounts to scale your outreach</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            Every email account has daily limits. A free Gmail can send about 300–400 emails per day, while a Google Workspace account can do 1,500–1,800. By adding multiple senders, you spread the volume across accounts — and SharaSpot rotates between them automatically.
          </p>

          <div className="border-l-2 border-brand/30 pl-5 mb-8">
            <p className="text-[11px] font-bold text-brand uppercase tracking-wider mb-1.5">How rotation works</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Emails are distributed evenly across all connected senders. If one hits its daily limit, the rest pick up the slack automatically. No manual intervention needed.
            </p>
          </div>

          <div className="mb-8">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Daily limits</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
              {[
                { label: "Free Gmail", value: "300–400/day" },
                { label: "Google Workspace", value: "1,500–1,800/day" },
                { label: "Warming up (Day 1–5)", value: "20–100/day" },
                { label: "Fully warmed", value: "Full limit" },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l-2 border-amber-400/40 pl-5">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Warmup</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              New senders start with low limits that increase gradually over 14 days. This builds sender reputation and keeps spam filters from flagging your account. You can skip warmup for accounts with existing sending history.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 3. PROVIDERS ───────────── */}
      <section id="providers" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Step 3</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Connecting Email Providers</h2>
            <p className="text-slate-500 mt-2">Gmail, Outlook, Zoho, Yahoo, or custom SMTP</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            SharaSpot works with any provider that supports SMTP. Each one has slightly different setup steps, but the pattern is the same: create an app password, enter it in SharaSpot, and you&apos;re good to go.
          </p>

          <div className="divide-y divide-slate-200">
            {/* Gmail */}
            <div className="py-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Mail size={16} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Gmail (free)</h3>
                  <p className="text-xs text-slate-500">@gmail.com addresses &middot; ~300–400 emails/day</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-brand tracking-wider">Easiest</span>
              </div>
              <ol className="space-y-1.5 text-sm text-slate-600">
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">1.</span>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold hover:underline">myaccount.google.com/apppasswords</a></li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">2.</span>Select <span className="font-semibold text-slate-900">Mail</span> as the app and <span className="font-semibold text-slate-900">Other</span> for device name</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">3.</span>Copy the 16-character password that appears</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">4.</span>Paste it in SharaSpot when adding your sender</li>
              </ol>
            </div>

            {/* Google Workspace */}
            <div className="py-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Shield size={16} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Google Workspace</h3>
                  <p className="text-xs text-slate-500">@yourcompany.com &middot; ~1,500–1,800 emails/day</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-slate-500 tracking-wider">Higher limits</span>
              </div>
              <ol className="space-y-1.5 text-sm text-slate-600">
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">1.</span>Enable 2-Factor Authentication on the Google Admin console</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">2.</span>Go to <span className="font-semibold text-slate-900">myaccount.google.com/apppasswords</span> for each user</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">3.</span>Generate an App Password and add it to SharaSpot</li>
              </ol>
            </div>

            {/* Custom SMTP */}
            <div className="py-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Database size={16} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom SMTP</h3>
                  <p className="text-xs text-slate-500">Outlook, Zoho, Yahoo, Proton, iCloud, or your own mail server</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-amber-600 tracking-wider">More setup</span>
              </div>
              <ol className="space-y-1.5 text-sm text-slate-600">
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">1.</span>Enter the SMTP host (e.g., <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">smtp.office365.com</span>)</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">2.</span>Set the port — <span className="font-semibold text-slate-900">587</span> for TLS or <span className="font-semibold text-slate-900">465</span> for SSL</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">3.</span>Use your full email address as the username</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">4.</span>Enter the app password or mailbox password</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold w-5 shrink-0">5.</span>Enable TLS/SSL based on your provider&apos;s requirements</li>
              </ol>
              <p className="text-xs text-slate-400 mt-3 border-l-2 border-slate-200 pl-4">Outlook, Zoho, Yahoo, and most business mailboxes require app passwords. Keep your provider&apos;s SMTP host and port handy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 4. CAMPAIGNS ───────────── */}
      <section id="campaigns" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Step 4</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Creating Campaigns</h2>
            <p className="text-slate-500 mt-2">Compose, schedule, and send your outreach</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            A campaign is a single email (or follow-up sequence) sent to a list of recipients. You control everything — who gets it, when it sends, and how it looks.
          </p>

          <div className="divide-y divide-slate-200">
            {[
              { icon: Users, title: "Add recipients", desc: "Type email addresses manually or import a CSV. Every column in your CSV becomes a template variable you can use in your email." },
              { icon: Paperclip, title: "Attach files", desc: "Up to 10 MB per file, 25 MB total per campaign. Supported formats: PDF, DOC, XLS, CSV, and images." },
              { icon: EyeOff, title: "Track opens and clicks", desc: "See exactly who opened your email and which links they clicked. You can toggle tracking on or off per campaign." },
              { icon: Clock, title: "Schedule sending", desc: "Send immediately or pick a specific date and time. Use the delay settings to space out emails naturally." },
              { icon: Sliders, title: "Set sending limits", desc: "Control how many emails go out per hour or per day. Set a delay (in seconds) between each send." },
              { icon: MessageSquare, title: "Add signatures", desc: "Create multiple email signatures and assign them to different senders. Useful when you have multiple team members sending." },
            ].map((item) => (
              <div key={item.title} className="py-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Template variables from CSV</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CSV file</p>
                <div className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-4 leading-loose">
                  <p>email, name, company</p>
                  <p className="text-slate-900">john@acme.com, John, Acme Inc</p>
                  <p className="text-slate-900">sarah@tech.co, Sarah, TechCo</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email body</p>
                <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-4 leading-relaxed">
                  <p>Hi <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-mono text-xs font-semibold">{`{{name}}`}</span>,</p>
                  <p className="mt-2">I noticed <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-mono text-xs font-semibold">{`{{company}}`}</span> is growing fast...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 5. TEMPLATES ───────────── */}
      <section id="templates" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Email Templates</h2>
            <p className="text-slate-500 mt-2">Save your best emails and reuse them instantly</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Don&apos;t rewrite the same email every time. Save any campaign as a template — including its subject line, body, and follow-up structure. When you create a new campaign, pick a template and your entire sequence is ready to go.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 mb-6">
            <div className="bg-white p-5">
              <p className="text-[11px] font-bold text-slate-900 mb-2">Save any campaign</p>
              <p className="text-xs text-slate-600 leading-relaxed">After composing, save it as a template. The subject, body, and follow-ups are all preserved.</p>
            </div>
            <div className="bg-white p-5">
              <p className="text-[11px] font-bold text-slate-900 mb-2">Follow-up templates</p>
              <p className="text-xs text-slate-600 leading-relaxed">Save complete multi-step follow-up sequences and reuse them across campaigns.</p>
            </div>
            <div className="bg-white p-5">
              <p className="text-[11px] font-bold text-slate-900 mb-2">Variables work in templates</p>
              <p className="text-xs text-slate-600 leading-relaxed">You can use personalization variables like <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{`{{name}}`}</span> in any template.</p>
            </div>
            <div className="bg-white p-5">
              <p className="text-[11px] font-bold text-slate-900 mb-2">Manage all templates</p>
              <p className="text-xs text-slate-600 leading-relaxed">Browse, search, and delete your saved templates from the Templates page anytime.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">Templates are a time-saver. The more you save, the faster each new campaign gets out the door.</p>
        </div>
      </section>

      {/* ───────────── 6. VALIDATION ───────────── */}
      <section id="validation" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Email Validation</h2>
            <p className="text-slate-500 mt-2">Clean your list before you send</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            Bad emails hurt your deliverability. SharaSpot checks every recipient before sending — catching typos, disposable addresses, role-based accounts, and risky domains. You can validate a single email or your entire list at once.
          </p>

          <div className="space-y-5">
            <div className="flex gap-4">
              <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Syntax checks</p>
                <p className="text-sm text-slate-600">Catches formatting errors and typos like <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">gmial.com</span> or <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">name@</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">MX record verification</p>
                <p className="text-sm text-slate-600">Confirms the domain can actually receive email</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Disposable and role-based detection</p>
                <p className="text-sm text-slate-600">Flags temporary emails (like <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">mailinator.com</span>) and role accounts (<span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">info@</span>, <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">support@</span>)</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-900">Risk scoring</p>
                <p className="text-sm text-slate-600">Each email gets a risk score so you can decide what to keep or remove</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 7. SEQUENCES ───────────── */}
      <section id="sequences" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Step 5</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Follow-Up Sequences</h2>
            <p className="text-slate-500 mt-2">Automated follow-ups that stop when someone replies</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            You can add up to 10 follow-up steps to any campaign. Each step has its own subject line, body, and wait period (how many days to wait before sending it). When a recipient replies, their sequence stops automatically — no one gets a follow-up after they&apos;ve already responded.
          </p>

          <div className="mb-8">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Example sequence</p>
            <div className="relative">
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-slate-200" />
              {[
                { step: "1", subject: "Initial outreach", wait: "Sent immediately", color: "bg-slate-900" },
                { step: "2", subject: "Follow-up", wait: "3 days later", color: "bg-slate-500" },
                { step: "3", subject: "Final check", wait: "7 days later", color: "bg-slate-400" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-4 py-3">
                  <div className={`w-[38px] h-[38px] rounded-full ${s.color} text-white flex items-center justify-center text-xs font-bold shrink-0 relative z-10`}>
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.subject}</p>
                    <p className="text-xs text-slate-500">{s.wait}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l-2 border-brand/30 pl-5">
            <p className="text-[11px] font-bold text-brand uppercase tracking-wider mb-1.5">Per-recipient controls</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              From the campaign detail page, you can pause, resume, or stop sequences for individual recipients. You can also pause or stop the entire campaign at once.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 8. PRIORITY ───────────── */}
      <section id="priority" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Priority Delivery</h2>
            <p className="text-slate-500 mt-2">Enhanced infrastructure for critical outreach</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            Priority Delivery is our premium sending infrastructure. It maximizes inbox placement rates using adaptive throttling, intelligent routing, and real-time congestion detection. Campaigns use it automatically when priority is enabled.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-200 mb-6">
            {[
              { title: "Inbox Placement", value: "Adaptive", desc: "guarded per sender" },
              { title: "Warmup Speed", value: "3x faster", desc: "reaches full limits" },
              { title: "Block Risk", value: "Reduced", desc: "adaptive protection" },
            ].map((item) => (
              <div key={item.title} className="bg-white px-5 py-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.title}</p>
                <p className="text-2xl font-bold text-brand mb-1">{item.value}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="border-l-2 border-brand/30 pl-5">
            <p className="text-[11px] font-bold text-brand uppercase tracking-wider mb-1.5">Included in every plan</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Priority Delivery is included in all SharaSpot plans. Check the <Link href="/priority" className="text-brand font-semibold hover:underline">Priority page</Link> for detailed benchmarks and performance data.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 9. ANALYTICS ───────────── */}
      <section id="analytics" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Analytics and Reports</h2>
            <p className="text-slate-500 mt-2">See what&apos;s working and what&apos;s not</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            The Analytics dashboard gives you a complete picture of your campaign performance — open rates, click rates, reply rates, and more. Use it to refine your approach and get better results over time.
          </p>

          <div className="space-y-5">
            {[
              { icon: TrendingUp, title: "Campaign performance", desc: "Overall open rate, click rate, reply rate, and bounce rate at a glance. Top-performing campaigns are ranked by open rate automatically." },
              { icon: Activity, title: "Trends over time", desc: "Interactive charts show daily opens, clicks, and replies across 7, 14, 30, or 90 day ranges." },
              { icon: BarChart3, title: "Sender health", desc: "Monitor success rate, failure rate, and bounce rate per sender account. Catch problems before they affect delivery." },
              { icon: Globe, title: "Platform and device data", desc: "See which platforms (iOS, Android, macOS) and device types (desktop, mobile) your recipients are opening on." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 10. INBOX ───────────── */}
      <section id="inbox" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Inbox and Replies</h2>
            <p className="text-slate-500 mt-2">Every reply, all in one place</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            When someone replies to your campaign, the conversation appears in your SharaSpot inbox. You can read, reply, star, or archive it — all without leaving the app. SharaSpot detects replies automatically by scanning your sender accounts every few minutes.
          </p>

          <div className="space-y-5">
            {[
              { icon: MessageSquare, title: "Unified inbox", desc: "All replies to a selected sender account appear in one place. Switch between sender accounts to view their conversations." },
              { icon: Search, title: "Search and filter", desc: "Filter by All, Unread, Starred, or Archived. Search by subject, sender name, or email address." },
              { icon: ShieldCheck, title: "Auto-stop sequences", desc: "When a reply is detected, that recipient&apos;s follow-up sequence stops immediately. No embarrassing follow-ups." },
              { icon: RefreshCw, title: "Manual sync", desc: "New replies are detected automatically, but you can also trigger a manual sync anytime." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 11. PRM ───────────── */}
      <section id="prm" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Partner Relationship Management</h2>
            <p className="text-slate-500 mt-2">Track and manage your partner network</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            PRM helps you organize channel partners, resellers, and business relationships. Track where each contact is in your pipeline, segment by region or tier, and never lose track of a follow-up.
          </p>

          <div className="divide-y divide-slate-200">
            {[
              { icon: Users, title: "Contact lists", desc: "Organize partners into named lists by region, tier, or relationship stage." },
              { icon: Tag, title: "Tags and stages", desc: "Tag contacts and move them through stages: Cold → Warm → Hot → Replied → Converted." },
              { icon: FolderOpen, title: "Bulk operations", desc: "Select multiple contacts to update stages, add tags, or delete in one action. Changes can be undone." },
              { icon: Send, title: "Send direct emails", desc: "Reach out to any contact directly from their profile page." },
              { icon: Database, title: "Import from CSV", desc: "Import your existing partner data. Each row becomes a contact with all its columns preserved as data fields." },
              { icon: RefreshCw, title: "Automated follow-ups", desc: "Set reminders and sequences to make sure no relationship goes cold." },
            ].map((item) => (
              <div key={item.title} className="py-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 12. CALL TRACKING ───────────── */}
      <section id="calls" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Call Tracking</h2>
            <p className="text-slate-500 mt-2">Log calls, track outcomes, schedule follow-ups</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            The Calls page helps you manage phone outreach alongside your email campaigns. Log every call, record what happened, and schedule the next one — all linked to your PRM contacts.
          </p>

          <div className="divide-y divide-slate-200">
            {[
              { icon: Phone, title: "Call queue", desc: "View all scheduled calls with due dates, searchable by name, email, or company. Filter by contact list or due date." },
              { icon: CheckCircle2, title: "Log outcomes", desc: "Record the result of every call: No Answer, Connected, Interested, Booked Meeting, Not a Fit, or Do Not Call. Terminal outcomes like Do Not Call prevent future tasks automatically." },
              { icon: Sliders, title: "Pipeline stages", desc: "Filter the queue by stage: Pending, Follow-up Required, Interested, Not Interested, Converted, or Closed. Each stage shows its count at a glance." },
              { icon: Clock, title: "Schedule follow-ups", desc: "Quick-reschedule from the queue or set a next call date when logging an outcome. The system creates the follow-up task for you." },
              { icon: Users, title: "Linked to contacts", desc: "Every call task is tied to a PRM contact. Click through to their profile for full context before you dial." },
            ].map((item) => (
              <div key={item.title} className="py-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 13. MCP INTEGRATIONS ───────────── */}
      <section id="mcp" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">MCP Integrations</h2>
            <p className="text-slate-500 mt-2">Connect SharaSpot to AI agents and external tools</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            MCP (Model Context Protocol) lets you connect SharaSpot to AI coding assistants like Claude, Cursor, and Windsurf. Create API keys with granular permissions, and your AI tools can read contacts, check analytics, manage campaigns, and more — right from your editor.
          </p>

          <div className="divide-y divide-slate-200">
            {[
              { icon: Bot, title: "AI agent access", desc: "Connect Claude, Cursor, Windsurf, or VS Code to SharaSpot. Your AI can research contacts, draft campaigns, check deliverability, and track results." },
              { icon: Shield, title: "Granular permissions", desc: "Choose Read Only, Read/Write Selected, or Full Access. Pick which areas each key can access — contacts, campaigns, analytics, inbox, and more." },
              { icon: Globe, title: "Scope options", desc: "Personal keys are tied to your account. Organization keys (available to admins and owners) give access to the entire workspace." },
              { icon: Key, title: "API key management", desc: "Create named keys, set permissions, and revoke or delete them anytime. Keys are shown once after creation — store them safely." },
            ].map((item) => (
              <div key={item.title} className="py-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 14. TEAM ───────────── */}
      <section id="team" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Feature</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Team Collaboration</h2>
            <p className="text-slate-500 mt-2">Invite teammates and work together</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            You can invite up to 5 team members to your workspace. Each member gets their own role with appropriate permissions — from read-only viewers to admins who can manage the team.
          </p>

          <div className="divide-y divide-slate-200">
            {[
              { icon: UserPlus, title: "Invite members", desc: "Send invites by email with a role: Admin (can manage members), Member (can create and edit), or Viewer (read-only access). Invite links expire automatically." },
              { icon: ShieldCheck, title: "Role-based access", desc: "Owners have full control. Admins can invite, rename the workspace, and manage pending invites. Members can create and edit campaigns. Viewers have read-only access to everything." },
              { icon: Users, title: "Member management", desc: "See all members, their roles, and pending invites. Change roles, remove members, or let members leave on their own." },
              { icon: Database, title: "Shared workspace", desc: "All campaigns, contacts, senders, and templates are shared within the workspace. Switch between organizations if you belong to multiple." },
            ].map((item) => (
              <div key={item.title} className="py-4 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 15. TIPS ───────────── */}
      <section id="tips" className="py-16 md:py-20 border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Reference</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Best Practices</h2>
            <p className="text-slate-500 mt-2">Get more replies and land in the inbox</p>
          </div>

          <div className="divide-y divide-slate-200">
            {/* Subject lines */}
            <div>
              <button onClick={() => toggleAccordion("subject")} className="w-full flex items-center gap-3 py-5 text-left">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Write subject lines that get opened</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "subject" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "subject" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-4">
                  <p>Keep subjects clear and honest. Avoid spam triggers like all-caps, excessive punctuation, or words like &quot;FREE&quot; and &quot;URGENT&quot;.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border-l-2 border-brand/30 pl-4">
                      <p className="text-[10px] font-bold text-brand uppercase tracking-wider mb-2">Good</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Quick question about the SWE role</li>
                        <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Following up on our conversation</li>
                      </ul>
                    </div>
                    <div className="border-l-2 border-red-300/50 pl-4">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Avoid</p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex gap-2"><span className="text-red-400 mt-1.5">—</span>FREE OPPORTUNITY!!!</li>
                        <li className="flex gap-2"><span className="text-red-400 mt-1.5">—</span>URGENT: ACT NOW</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clean list */}
            <div>
              <button onClick={() => toggleAccordion("list")} className="w-full flex items-center gap-3 py-5 text-left">
                <Users size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Keep your email list clean</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "list" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "list" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>Clean lists mean better deliverability:</p>
                  <ul className="space-y-1.5">
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Remove duplicate and invalid emails</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Check for typos (gmial.com, yaho.com)</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Remove addresses that bounced — they hurt your sender reputation</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">Use the built-in Email Validation tool to clean your list before sending.</p>
                </div>
              )}
            </div>

            {/* Timing */}
            <div>
              <button onClick={() => toggleAccordion("timing")} className="w-full flex items-center gap-3 py-5 text-left">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Time your campaigns right</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "timing" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "timing" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-3">
                  <p>Best times to send outreach emails:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Tuesday–Thursday", "10–11 AM", "2–3 PM"].map((t) => (
                      <span key={t} className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Mid-week mornings consistently get the highest open and reply rates.</p>
                </div>
              )}
            </div>

            {/* Account protection */}
            <div>
              <button onClick={() => toggleAccordion("security")} className="w-full flex items-center gap-3 py-5 text-left">
                <Lock size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Protect your account</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "security" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "security" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-2">
                  <ul className="space-y-1.5">
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Enable two-factor authentication on your Google account</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Use a unique App Password for SharaSpot — don&apos;t reuse it elsewhere</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Revoke the App Password immediately if you suspect a compromise</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Personalization */}
            <div>
              <button onClick={() => toggleAccordion("personalize")} className="w-full flex items-center gap-3 py-5 text-left">
                <Target size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Personalize every email</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "personalize" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "personalize" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>Emails with personalization get significantly higher reply rates. Use CSV columns as template variables:</p>
                  <ul className="space-y-1.5 mt-2">
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{`{{name}}`}</span> — the recipient&apos;s first name or full name</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{`{{company}}`}</span> — their company name</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{`{{title}}`}</span> — their job title</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">Any column in your CSV becomes a variable. Just wrap the column name in double curly braces.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 16. TROUBLESHOOTING ───────────── */}
      <section id="troubleshooting" className="py-16 md:py-20 border-b border-slate-100">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.25em] mb-3">Reference</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Troubleshooting</h2>
            <p className="text-slate-500 mt-2">Common issues and how to fix them</p>
          </div>

          <div className="divide-y divide-slate-200">
            <div>
              <button onClick={() => toggleAccordion("limits")} className="w-full flex items-center gap-3 py-5 text-left">
                <Gauge size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">All senders at limit</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "limits" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "limits" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>All senders have reached their daily limit. The campaign will auto-resume when capacity is available (checked hourly).</p>
                  <ul className="space-y-1.5 mt-2">
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Add more senders to the campaign to increase capacity</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Wait for midnight UTC when daily limits reset</li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => toggleAccordion("cooldown")} className="w-full flex items-center gap-3 py-5 text-left">
                <Shield size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Sender in cooldown</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "cooldown" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "cooldown" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>Three or more consecutive SMTP errors trigger a 5-minute cooldown. Common causes:</p>
                  <ul className="space-y-1.5 mt-2">
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>The App Password was revoked or changed</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Google temporarily blocked the account</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">Cooldowns expire automatically after 5 minutes. No manual action needed.</p>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => toggleAccordion("spam")} className="w-full flex items-center gap-3 py-5 text-left">
                <AlertTriangle size={16} className="text-slate-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-slate-900">Emails going to spam</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openAccordion === "spam" ? "rotate-180" : ""}`} />
              </button>
              {openAccordion === "spam" && (
                <div className="pb-6 text-sm text-slate-600 leading-relaxed space-y-2">
                  <ul className="space-y-1.5">
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Remove spam trigger words from your subject line and body</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Add more text content — emails with mostly images get flagged</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Reduce sending volume, especially for new or un-warmed accounts</li>
                    <li className="flex gap-2"><span className="text-brand mt-1.5">—</span>Clean your email list using the built-in validation tool</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="border-t border-slate-200 pt-16">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to start?</h3>
            <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">Activate your outreach today and send your first campaign in minutes.</p>
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
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-border-light bg-[#F8F9FA]">
        <div className="mx-auto max-w-5xl px-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <Link href="/"><Logo size="sm" /></Link>
          <nav className="flex items-center gap-6">
            <Link href="/guide" className="text-xs font-semibold text-text-muted hover:text-text-primary">Guide</Link>
            <Link href="/priority" className="text-xs font-semibold text-text-muted hover:text-text-primary">Priority</Link>
            <Link href="/faq" className="text-xs font-semibold text-text-muted hover:text-text-primary">FAQ</Link>
          </nav>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-text-muted">&copy; 2026 SharaSpot</span>
            <p className="text-[10px] text-text-muted">Hire me as GTM engineer — <a href="mailto:fffstanza@gmail.com" className="text-brand hover:text-brand/80 transition-colors">fffstanza@gmail.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
