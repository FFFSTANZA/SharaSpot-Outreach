"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import Button from "@/components/Button";
import {
  Shield, Lock, Eye, Server, Trash2,
  FileText, Database, RefreshCw, Mail,
  Menu, X, Globe, Cookie, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildBreadcrumbJsonLd, SITE_NAME, absoluteUrl } from "@/lib/seo";

const sections = [
  {
    number: "1",
    icon: FileText,
    title: "Information We Collect",
    content: (
      <div className="space-y-3">
        <p>We collect only the information necessary to provide and improve the Service:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Account information:</strong> When you sign in via Google OAuth, we collect your name, email address, and profile picture.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Sender credentials:</strong> App passwords or SMTP credentials you provide for sending emails. These are encrypted at rest.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Recipient data:</strong> Email addresses and any additional data you upload via CSV for your campaigns.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Campaign content:</strong> Subject lines, email body, follow-up sequences, templates, and signatures you create.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Engagement data:</strong> Open events, click events, reply detection, and bounce information for your campaigns.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Usage data:</strong> Basic analytics about how you interact with the Service (pages visited, features used).</li>
        </ul>
      </div>
    ),
  },
  {
    number: "2",
    icon: Eye,
    title: "How We Use Your Information",
    content: (
      <div className="space-y-3">
        <p>We use your information solely to operate and improve SharaSpot:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>To send emails on your behalf through the SMTP credentials you provide</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>To display campaign performance metrics (opens, clicks, replies)</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>To detect replies and stop follow-up sequences automatically</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>To manage your subscription and billing</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>To provide customer support and respond to your inquiries</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>To improve the Service based on usage patterns and feedback</li>
        </ul>
        <div className="border-l-2 border-brand/30 pl-5 py-1 mt-4">
          <p className="text-xs text-slate-500">We do not use your campaign content or recipient data to train AI models or for any purpose other than delivering your outreach.</p>
        </div>
      </div>
    ),
  },
  {
    number: "3",
    icon: Globe,
    title: "Legal Basis for Processing (GDPR)",
    content: (
      <div className="space-y-3">
        <p>If you are located in the European Economic Area (EEA) or the United Kingdom, our legal basis for processing your personal data is as follows:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Contract performance:</strong> Processing is necessary to provide the Service you have subscribed to.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Legitimate interests:</strong> Processing usage data to improve the Service and ensure security.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Consent:</strong> Where required, we obtain your consent before processing your data.</li>
        </ul>
      </div>
    ),
  },
  {
    number: "4",
    icon: Lock,
    title: "How We Protect Your Data",
    content: (
      <div className="space-y-3">
        <p>We implement industry-standard security measures to protect your data:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>All SMTP credentials (app passwords) are encrypted at rest using <strong>AES-256-CBC</strong> with a unique random initialization vector per encryption.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>The encryption key is a server-side secret that never leaves the server.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>Credentials are decrypted momentarily in memory only when sending an email, then discarded immediately.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>All connections use TLS/SSL encryption where available.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span>We never store your Google account password — only the App Password you generate for SharaSpot.</li>
        </ul>
      </div>
    ),
  },
  {
    number: "5",
    icon: Server,
    title: "Data Storage and Retention",
    content: (
      <div className="space-y-3">
        <p>Your data is stored on secure infrastructure:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Primary database:</strong> PostgreSQL — stores account data, campaigns, contacts, and configuration.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>File storage:</strong> Cloudinary — stores email attachments.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Cache and queues:</strong> Redis — stores job queues and temporary session data.</li>
        </ul>
        <p>We retain your data for as long as your account is active. After account deletion, we retain your data for 30 days before permanent removal, unless a longer retention period is required by law.</p>
      </div>
    ),
  },
  {
    number: "6",
    icon: Database,
    title: "Data Sharing and Disclosure",
    content: (
      <div className="space-y-3">
        <p>We do not sell your personal data. We do not share your recipient lists with third parties. We may share data only in the following circumstances:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Service providers:</strong> We use third-party services (Cloudinary, Redis, PostgreSQL) to operate the platform. These providers have access only to the data necessary to perform their functions.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Legal compliance:</strong> We may disclose data if required by law, court order, or government request.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity.</li>
        </ul>
      </div>
    ),
  },
  {
    number: "7",
    icon: UserCheck,
    title: "Your Rights and Choices",
    content: (
      <div className="space-y-3">
        <p>Depending on your jurisdiction, you have the following rights regarding your personal data:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Access:</strong> Request a copy of the data we hold about you.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations).</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Portability:</strong> Request your data in a machine-readable format.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Objection:</strong> Object to the processing of your data for legitimate interests.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Withdrawal of consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:support@folonite.in" className="text-brand font-semibold hover:underline">support@folonite.in</a>. We will respond within 30 days.</p>
      </div>
    ),
  },
  {
    number: "8",
    icon: Trash2,
    title: "Data Deletion",
    content: (
      <div className="space-y-3">
        <p>You can delete your data in several ways:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Self-service:</strong> Delete sender accounts from the Senders page at any time. Campaigns can be deleted from the dashboard — associated data such as attachments, sequences, and analytics are removed automatically.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Account deletion:</strong> Cancel your subscription and request account deletion via <a href="mailto:data@folonite.in" className="text-brand font-semibold hover:underline">data@folonite.in</a>.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Retention period:</strong> After account deletion, we retain your data for 30 days before permanent removal. After this period, data cannot be recovered.</li>
        </ul>
        <div className="border-l-2 border-brand/30 pl-5 py-1 mt-4">
          <p className="text-xs text-slate-500">For data removal requests, email <a href="mailto:data@folonite.in" className="text-brand font-semibold hover:underline">data@folonite.in</a> with your account email. We will process your request within 30 days.</p>
        </div>
      </div>
    ),
  },
  {
    number: "9",
    icon: Cookie,
    title: "Cookies and Tracking",
    content: (
      <div className="space-y-3">
        <p>SharaSpot uses minimal cookies essential for authentication and service functionality. We do not use cookies for advertising or cross-site tracking.</p>
        <p>For email tracking, we use:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Tracking pixels:</strong> A transparent 1x1 image in outgoing emails to record open events (industry standard).</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Link redirects:</strong> Links in your emails are wrapped in a redirect URL to record click events.</li>
        </ul>
        <p>You can disable open and click tracking per campaign in the compose settings. Tracking data is only visible to you and is never shared.</p>
      </div>
    ),
  },
  {
    number: "10",
    icon: Shield,
    title: "Third-Party Services",
    content: (
      <div className="space-y-3">
        <p>SharaSpot integrates with the following third-party services:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Google:</strong> Authentication via Google OAuth. Email sending via Gmail SMTP.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Microsoft:</strong> Email sending via Outlook SMTP (optional).</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Cloudinary:</strong> File and attachment hosting.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Redis:</strong> Job queues and caching.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>PostgreSQL:</strong> Primary database.</li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Dodo Payments:</strong> Subscription and billing processing.</li>
        </ul>
        <p>Each third party has its own privacy policy governing how they handle your data. We encourage you to review them.</p>
      </div>
    ),
  },
  {
    number: "11",
    icon: Shield,
    title: "Children&apos;s Privacy",
    content: (
      <div className="space-y-3">
        <p>SharaSpot is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us at <a href="mailto:support@folonite.in" className="text-brand font-semibold hover:underline">support@folonite.in</a> so we can take appropriate action.</p>
      </div>
    ),
  },
  {
    number: "12",
    icon: RefreshCw,
    title: "Changes to This Policy",
    content: (
      <div className="space-y-3">
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or the Service. When we make material changes, we will notify you via email or through the Service.</p>
        <p>We encourage you to review this page periodically. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision. Continued use of SharaSpot after changes take effect constitutes your acceptance of the updated policy.</p>
      </div>
    ),
  },
  {
    number: "13",
    icon: Mail,
    title: "Contact Information",
    content: (
      <div className="space-y-3">
        <p>If you have questions about this Privacy Policy or how your data is handled, please reach out:</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>General inquiries:</strong> <a href="mailto:support@folonite.in" className="text-brand font-semibold hover:underline">support@folonite.in</a></li>
          <li className="flex gap-2"><span className="text-brand mt-2">—</span><strong>Data removal requests:</strong> <a href="mailto:data@folonite.in" className="text-brand font-semibold hover:underline">data@folonite.in</a></li>
        </ul>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  const privacyJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildBreadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Privacy Policy", path: "/privacy" },
      ]),
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/privacy"),
        "url": absoluteUrl("/privacy"),
        "name": `${SITE_NAME} Privacy Policy`,
        "description": "Read the SharaSpot privacy policy to understand what data we collect, how credentials are protected, and how outreach data is handled.",
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
          __html: JSON.stringify(privacyJsonLd).replace(/</g, "\\u003c"),
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
            <Shield size={12} /> Privacy
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Your data, <span className="text-brand">your control.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            We believe in transparency. Here&apos;s exactly what we collect, how we protect it, and what we don&apos;t do.
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
            <p className="text-xs text-slate-400">
              Questions about privacy?{" "}
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
            <Link href="/privacy" className="text-xs font-semibold text-brand">Privacy</Link>
            <Link href="/terms" className="text-xs font-semibold text-text-muted hover:text-text-primary">Terms</Link>
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