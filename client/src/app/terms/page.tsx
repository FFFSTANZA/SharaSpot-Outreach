"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  FileText, Scale, Ban, AlertTriangle,
  ShieldCheck, UserCheck, Lock, Gavel, RefreshCw,
  Menu, X, Mail,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buildBreadcrumbJsonLd, SITE_NAME, absoluteUrl } from "@/lib/seo";

const sections = [
  {
    number: "1",
    icon: FileText,
    title: "Acceptance of Terms",
    content: (
      <div className="space-y-3">
        <p>By accessing or using SharaSpot (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, you may not use the Service.</p>
        <p>These Terms apply to all users, including visitors, free trial users, and paid subscribers. SharaSpot is a tool for professional outreach — specifically designed for individuals reaching out to recruiters, hiring managers, and business contacts.</p>
      </div>
    ),
  },
  {
    number: "2",
    icon: UserCheck,
    title: "User Accounts",
    content: (
      <div className="space-y-3">
        <p>You must be at least 18 years old to use SharaSpot. When you create an account, you agree to provide accurate, current, and complete information.</p>
        <p>You are responsible for:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Maintaining the confidentiality of your login credentials</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>All activity that occurs under your account</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Notifying us immediately of any unauthorized use</li>
        </ul>
        <p>You may not create accounts through automated means or on behalf of someone else without their authorization.</p>
      </div>
    ),
  },
  {
    number: "3",
    icon: FileText,
    title: "Description of Service",
    content: (
      <div className="space-y-3">
        <p>SharaSpot provides an outreach automation platform that allows users to send email campaigns, manage follow-up sequences, track engagement, and organize contacts. The Service includes features such as:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Multi-sender email campaign management</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Automated follow-up sequences (up to 10 steps)</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Sender warmup and adaptive throttling</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Open and click tracking</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Partner Relationship Management (PRM)</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Call tracking and disposition logging</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>MCP integrations for AI agent access</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Team collaboration with role-based access</li>
        </ul>
        <p>The Service is provided by Folonite and is accessed via a web browser at your configured SharaSpot domain.</p>
      </div>
    ),
  },
  {
    number: "4",
    icon: Scale,
    title: "Acceptable Use",
    content: (
      <div className="space-y-3">
        <p>You may use SharaSpot to send professional outreach emails related to job seeking, networking, partnership development, and business communication. You must comply with all applicable laws, including:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>The CAN-SPAM Act (US)</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>The General Data Protection Regulation (GDPR, EU)</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Your local email marketing and anti-spam regulations</li>
        </ul>
        <p>You are solely responsible for the content of your campaigns and ensuring your sending practices comply with your email provider&apos;s terms of service.</p>
      </div>
    ),
  },
  {
    number: "5",
    icon: Ban,
    title: "Prohibited Use",
    content: (
      <div className="space-y-3">
        <p>You may not use SharaSpot for:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Sending spam, unsolicited bulk email, or phishing messages</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Harassment, threats, or any form of abuse</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Any illegal activity or violation of applicable law</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Sending to purchased, rented, or scraped email lists</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Sending to recipients who have opted out or unsubscribed</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Impersonating another person or entity</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Distributing malware, viruses, or harmful code</li>
        </ul>
        <div className="border-l-2 border-red-300/50 pl-5 py-1 mt-4">
          <p className="text-xs text-red-600 font-semibold">Violation of these prohibitions will result in immediate account termination without refund.</p>
        </div>
      </div>
    ),
  },
  {
    number: "6",
    icon: ShieldCheck,
    title: "Subscription and Billing",
    content: (
      <div className="space-y-3">
        <p>SharaSpot requires a paid subscription to access the full Service. Subscription terms are as follows:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Global price:</strong> $29.00 USD per month</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>India price:</strong> ₹999.00 INR per month</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Billing:</strong> Monthly via Dodo Payments</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Trial:</strong> New customers receive a 7-day free trial before billing begins</li>
        </ul>
        <p>Subscriptions can be cancelled at any time through the billing dashboard. Upon cancellation, access to premium features continues until the end of the current billing period. No prorated refunds are provided for partial months.</p>
        <p>We reserve the right to change pricing with 30 days&apos; notice. Price changes do not affect your current billing period.</p>
      </div>
    ),
  },
  {
    number: "7",
    icon: Lock,
    title: "Data and Privacy",
    content: (
      <div className="space-y-3">
        <p>We take the security of your data seriously. SMTP credentials (app passwords) are encrypted at rest using AES-256-CBC with a unique initialization vector per encryption. Our full data handling practices are described in our <Link href="/privacy" className="text-brand font-semibold hover:underline">Privacy Policy</Link>.</p>
        <p>You retain all rights to your campaign content and recipient data. We do not sell your data or share your recipient lists with third parties.</p>
      </div>
    ),
  },
  {
    number: "8",
    icon: Gavel,
    title: "Intellectual Property",
    content: (
      <div className="space-y-3">
        <p>The SharaSpot platform, including its code, design, logo, brand name, and underlying technology, is the intellectual property of Folonite. You may not copy, modify, reverse engineer, or create derivative works of the Service without our express written permission.</p>
        <p>You retain ownership of any content you create using the Service — your email copy, templates, and recipient data remain yours.</p>
      </div>
    ),
  },
  {
    number: "9",
    icon: AlertTriangle,
    title: "Disclaimer of Warranties",
    content: (
      <div className="space-y-3">
        <p>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied.</p>
        <p>We do not guarantee:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Email deliverability, inbox placement, or response rates</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>That the Service will be uninterrupted or error-free</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>That the Service will meet your specific requirements</li>
        </ul>
        <p>Email sending limits and policies are controlled by your email provider (e.g., Google, Microsoft). We help you stay within those limits but cannot override them.</p>
      </div>
    ),
  },
  {
    number: "10",
    icon: Ban,
    title: "Limitation of Liability",
    content: (
      <div className="space-y-3">
        <p>To the maximum extent permitted by law, Folonite shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.</p>
        <p>Our total liability for any claim arising from these Terms or the Service shall not exceed the total amount paid by you to us in the 12 months preceding the claim.</p>
        <p>We are not responsible for:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Actions taken by your email provider (account suspension, rate limiting)</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Damages resulting from your failure to comply with applicable laws</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Loss of data resulting from account termination for Terms violations</li>
        </ul>
      </div>
    ),
  },
  {
    number: "11",
    icon: RefreshCw,
    title: "Termination",
    content: (
      <div className="space-y-3">
        <p>You may terminate your account at any time by cancelling your subscription in the billing dashboard. Your data will be retained for 30 days after termination, after which it may be permanently deleted.</p>
        <p>We reserve the right to suspend or terminate your account immediately without notice if:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>You violate these Terms</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Your use of the Service creates risk or legal exposure for us</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>You fail to pay subscription fees when due</li>
        </ul>
        <div className="border-l-2 border-brand/30 pl-5 py-1 mt-4">
          <p className="text-xs text-slate-500">Upon termination for violation, your access to the Service is revoked immediately and no refund will be provided for any prepaid period.</p>
        </div>
      </div>
    ),
  },
  {
    number: "12",
    icon: Gavel,
    title: "Governing Law",
    content: (
      <div className="space-y-3">
        <p>These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.</p>
        <p>We encourage you to reach out to us before initiating any formal dispute. Most concerns can be resolved quickly through our support channels.</p>
      </div>
    ),
  },
  {
    number: "13",
    icon: RefreshCw,
    title: "Changes to Terms",
    content: (
      <div className="space-y-3">
        <p>We may update these Terms from time to time to reflect changes in our Service, legal requirements, or business practices. When we make material changes, we will notify you via email or through the Service.</p>
        <p>Continued use of SharaSpot after changes take effect constitutes your acceptance of the updated Terms. If you do not agree with the changes, you may stop using the Service and cancel your subscription.</p>
        <p>The &quot;Last updated&quot; date at the top of this page will reflect the most recent revision.</p>
      </div>
    ),
  },
  {
    number: "14",
    icon: Mail,
    title: "Contact Information",
    content: (
      <div className="space-y-3">
        <p>If you have any questions about these Terms, please reach out:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Email:</strong> <a href="mailto:support@folonite.in" className="text-brand font-semibold hover:underline">support@folonite.in</a></li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Support:</strong> <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold hover:underline">tally.so/r/aQee69</a></li>
        </ul>
      </div>
    ),
  },
];

export default function TermsPage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  const termsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Terms of Service", path: "/terms" },
      ]),
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/terms"),
        "url": absoluteUrl("/terms"),
        "name": `${SITE_NAME} Terms of Service`,
        "description": "Read the SharaSpot terms of service for access, usage, billing, and platform responsibilities.",
        "isPartOf": { "@id": `${absoluteUrl("/")}#website` },
        "about": { "@id": `${absoluteUrl("/")}#software` },
        "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", "h2"] },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(termsJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Go to homepage"><Logo size="md" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/guide" className="hover:text-slate-900 transition-colors">Guide</Link>
            <Link href="/priority" className="hover:text-slate-900 transition-colors">Priority</Link>
            <Link href="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
          </div>
          <Button className="hidden md:block w-auto px-5 py-2 rounded-lg text-sm font-semibold" onClick={() => router.push("/login")}>
            Get Started
          </Button>
          <button className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-2 bg-white">
            <Link href="/guide" className="block text-sm font-medium text-slate-600 py-2">Guide</Link>
            <Link href="/priority" className="block text-sm font-medium text-slate-600 py-2">Priority</Link>
            <Link href="/faq" className="block text-sm font-medium text-slate-600 py-2">FAQ</Link>
            <Button className="w-full rounded-lg mt-2" onClick={() => router.push("/login")}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="py-20 lg:py-24 border-b border-slate-100 bg-gradient-to-b from-brand/[0.02] to-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-6">
            <FileText size={12} /> Legal
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Terms of <span className="text-brand">Service</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Simple, fair terms for using SharaSpot. No legalese, just clarity.
          </p>
          <p className="text-xs text-slate-400 mt-4">Last updated: March 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {sections.map((section, i) => (
          <div key={section.number} className={cn(
            "py-8 md:py-10 px-6 sm:px-8 -mx-6 sm:-mx-8",
            i < sections.length - 1 ? "border-b border-slate-100" : "",
            i % 2 === 1 ? "bg-slate-50/50" : ""
          )}>
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center shrink-0 mt-0.5">
                  <section.icon size={17} className="text-brand" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-brand uppercase tracking-[0.25em]">Section {section.number}</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{section.title}</h2>
                </div>
              </div>
              <div className="pl-0 sm:pl-[52px] text-sm text-slate-600 leading-relaxed">
                {section.content}
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="border-t border-slate-200 pt-10">
            <p className="text-xs text-slate-400 mb-4">
              Questions about these terms?{" "}
              <a href="mailto:support@folonite.in" className="text-brand font-semibold hover:underline">Contact us</a>
            </p>
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
            <Link href="/privacy" className="text-xs font-semibold text-text-muted hover:text-text-primary">Privacy</Link>
            <Link href="/terms" className="text-xs font-semibold text-brand">Terms</Link>
            <a href="https://tally.so/r/aQee69" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand hover:text-brand/80">Support</a>
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
