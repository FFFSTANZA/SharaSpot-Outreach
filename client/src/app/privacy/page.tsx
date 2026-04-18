"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Lock, EyeOff, Database, Mail, Globe } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

  const sections = [
    {
      icon: Shield,
      title: "Data Protection",
      content: "We take data security seriously. Your email account credentials (SMTP/IMAP) are encrypted at rest using industry-standard AES-256 encryption. We never store your plain-text passwords.",
    },
    {
      icon: Lock,
      title: "Google OAuth",
      content: "When you connect Gmail via OAuth, we only request the specific scopes needed to send emails and detect replies. You can revoke this access at any time through your Google Security settings.",
    },
    {
      icon: EyeOff,
      title: "No Selling of Data",
      content: "We never sell your personal data, your recipient lists, or your email content to third parties. Your data is used exclusively to provide the SharaSpot service to you.",
    },
    {
      icon: Database,
      title: "Data Retention",
      content: "We retain your campaign data and analytics as long as your account is active. If you delete your account, all associated email credentials and campaign data are permanently purged from our systems.",
    },
    {
      icon: Mail,
      title: "Email Content",
      content: "We process the content of your emails only to send them and to identify replies from your recipients to automatically stop follow-up sequences. We do not use your email content for training AI models.",
    },
    {
      icon: Globe,
      title: "Cookie Policy",
      content: "We use essential cookies to keep you logged in and remember your preferences. We do not use invasive tracking or third-party advertising cookies.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-3xl flex items-center gap-4 px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-gray-900">Privacy Policy</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-10">
          <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mb-3">Privacy</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            How we protect you
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed max-w-xl font-medium">
            Your privacy and data security are our top priorities. Here is how we handle your information.
          </p>
          <p className="mt-2 text-xs text-gray-400 font-medium">Last updated: March 2026</p>
        </div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-6 sm:p-8 hover:border-brand/20 transition-all bg-white shadow-sm">
              <div className="flex items-start gap-5">
                <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                  <section.icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">{section.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-medium">
            Have questions about your data?{" "}
            <a href="/contact" className="text-brand font-bold hover:underline">Get in touch</a>
          </p>
        </div>
      </main>
    </div>
  );
}
