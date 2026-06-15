"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { Loader2, Building2, Globe, Mail } from "lucide-react";

interface CompanyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; website: string; email: string }) => Promise<void>;
}

export default function CompanyCreateModal({ isOpen, onClose, onSubmit }: CompanyCreateModalProps) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setWebsite("");
      setEmail("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, website, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white">
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center px-8 py-16">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-brand" />
            <p className="text-sm font-medium text-text-primary">Enriching company data...</p>
            <p className="mt-1 text-xs text-text-muted">Fetching details from their public website.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-border-light px-6 py-4">
              <h2 className="text-sm font-semibold text-text-primary">New company</h2>
              <p className="mt-0.5 text-xs text-text-muted">Create a company profile from a website or work email.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Company name</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Work email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="team@company.com"
                  />
                </div>
                <p className="px-1 text-[11px] text-text-muted">Add either a website or a work email. We use that domain to build the profile.</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                <Button type="submit" size="sm" disabled={!website.trim() && !email.trim()}>Create company</Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
