"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InlineLoader } from "@/components/PageLoader";
import { SidebarProvider } from "@/context/SidebarContext";
import { useToast } from "@/context/ToastContext";
import { getCompanyById, refreshCompany } from "@/lib/apis";
import type { CompanyProfile } from "@/types";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  RefreshCcw,
  ServerCog,
  Send,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn, sanitizeUrl } from "@/lib/utils";

const formatDate = (ts?: string | null) => ts ? new Date(ts).toLocaleDateString() : null;

function AvatarInitial({ name, email }: { name?: string | null; email?: string }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-muted/40 text-[11px] font-semibold text-brand">
      {(name?.[0] || email?.[0] || "?").toUpperCase()}
    </div>
  );
}

export default function CompanyProfilePage() {
  return (
      <AuthGuard requirePremium={true}>
        <ErrorBoundary>
          <CompanyProfileView />
        </ErrorBoundary>
      </AuthGuard>
  );
}

function CompanyProfileView() {
  const params = useParams<{ companyId: string }>();
  const router = useRouter();
  const { addToast } = useToast();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (!params.companyId) return;
    setIsLoading(true);
    try {
      const data = await getCompanyById(params.companyId);
      setCompany(data);
    } catch {
      addToast("error", "Failed to load company profile");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, params.companyId]);

  useEffect(() => {
    void fetchCompany();
  }, [fetchCompany]);

  const handleRefresh = async () => {
    if (!company) return;
    setIsRefreshing(true);
    try {
      await refreshCompany(company.id);
      await fetchCompany();
      addToast("success", "Company profile refreshed");
    } catch {
      addToast("error", "Failed to refresh company profile");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] flex flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col overflow-hidden rounded-lg border border-border-light bg-white">
          {isLoading ? (
            <InlineLoader message="Loading company profile..." />
          ) : !company ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                <Building2 size={20} className="text-text-muted" />
              </div>
              <p className="mt-3 text-sm font-medium text-text-primary">Company not found</p>
              <Link href="/dashboard/prm" className="mt-2 text-xs font-medium text-brand hover:underline">Back to relationships</Link>
            </div>
          ) : (
            <>
              <div className="border-b border-border-light px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold text-text-primary">{company.name}</h1>
                        {company.techStack.length > 0 && (
                            <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                            {company.techStack[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{company.domain}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F0F1F3] hover:text-brand disabled:opacity-50"
                  >
                    <RefreshCcw size={11} className={isRefreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
                <Link href="/dashboard/prm" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-text-muted transition-colors hover:text-brand">
                  <ArrowLeft size={11} />
                  Back to relationships
                </Link>
              </div>

              <div className="grid gap-px bg-border-light sm:grid-cols-2 lg:grid-cols-4">
                <DetailCell icon={<Globe size={13} />} label="Website" value={sanitizeUrl(company.website) || company.fallbackWebsite || "Not available"} href={sanitizeUrl(company.website) || company.fallbackWebsite || undefined} />
                <DetailCell icon={<Mail size={13} />} label="Company email" value={company.primaryEmail || "Not found"} href={company.primaryEmail ? `mailto:${company.primaryEmail}` : undefined} />
                <DetailCell icon={<Phone size={13} />} label="Phone" value={company.phone || "Not found"} href={company.phone ? `tel:${company.phone}` : undefined} />
                <DetailCell icon={<CalendarDays size={13} />} label="Last refresh" value={formatDate(company.lastEnrichedAt) || "Never"} />
              </div>

              <div className="border-t border-border-light px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2">
                  <ExternalLink size={13} className="text-text-muted" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Social profiles</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <SocialChip label="LinkedIn" href={company.linkedinUrl} />
                  <SocialChip label="X / Twitter" href={company.twitterUrl} />
                  <SocialChip label="GitHub" href={company.githubUrl} />
                  <SocialChip label="Facebook" href={company.facebookUrl} />
                  <SocialChip label="Instagram" href={company.instagramUrl} />
                </div>

                {company.techStack.length > 0 && (
                  <div className="mt-3 border-t border-border-light pt-3">
                    <div className="flex items-center gap-2">
                      <ServerCog size={13} className="text-text-muted" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Detected tech stack</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {company.techStack.map((item) => (
                        <span key={item} className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border-light">
                <div className="flex items-center justify-between border-b border-border-light bg-white px-4 py-2 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary">People</span>
                    <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                      {company.relatedContacts?.length ?? 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">Related contacts in your PRM</span>
                </div>
                <div className="divide-y divide-border-light">
                  {company.relatedContacts && company.relatedContacts.length > 0 ? company.relatedContacts.map((contact) => (
                    <div key={contact.id} className="group flex items-center gap-2 border-l-2 border-l-transparent bg-white px-4 py-2.5 transition-all hover:border-l-brand hover:bg-[#F8F9FA] sm:px-6">
                      <AvatarInitial name={`${contact.firstName || ""} ${contact.lastName || ""}`} email={contact.email} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-text-primary">
                            {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email.split("@")[0]}
                          </span>
                          {contact.jobTitle && (
                            <span className="shrink-0 rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                              {contact.jobTitle}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{contact.email}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link
                          href={`/dashboard/compose?emails=${encodeURIComponent(contact.email)}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all hover:bg-[#F0F1F3] hover:text-brand"
                          title="Compose Email"
                        >
                          <Send size={12} />
                        </Link>
                        <button
                          onClick={() => router.push(`/dashboard/prm?search=${encodeURIComponent(contact.email)}`)}
                          className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-text-secondary transition-all hover:bg-[#F0F1F3] hover:text-brand"
                        >
                          Open
                        </button>
                      </div>
                      <ChevronRight size={14} className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  )) : (
                    <div className="px-4 py-8 text-center sm:px-6">
                      <p className="text-xs text-text-muted">No related contacts yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  );
}

function DetailCell({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="bg-white px-4 py-3 sm:px-6">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
        {icon}
        {label}
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="truncate text-sm font-medium text-brand hover:underline">{value}</a>
      ) : (
        <p className={cn("truncate text-sm font-medium", value === "Not found" || value === "Not available" ? "text-text-muted" : "text-text-primary")}>{value}</p>
      )}
    </div>
  );
}

function SocialChip({ label, href }: { label: string; href?: string | null }) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border-light px-2 py-1 text-[11px] text-text-muted">
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border-light bg-white px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-[#F8F9FA] hover:text-brand"
    >
      {label}
      <ExternalLink size={10} />
    </a>
  );
}
