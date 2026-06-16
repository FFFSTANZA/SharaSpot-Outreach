"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { Contact, OrgMember, Tag } from "@/types";
import { createContact, updateContact } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/Button";
import {
  User,
  Mail,
  Phone,
  Globe,
  Building2,
  Briefcase,
  CalendarDays,
  UserCheck,
  ChevronDown
} from "lucide-react";
import { cn, sanitizeUrl } from "@/lib/utils";
import { NEXT_ACTIONS, RELATIONSHIP_STAGES } from "./prmFields";

type ContactPayload = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  website: string;
  jobTitle: string;
  phone: string;
  stage: string;
  tags: string[];
  nextAction: string | null;
  nextActionDueAt: string | null;
  assignedToId: string | null;
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  tags: Tag[];
  members?: OrgMember[];
  onSuccess: () => void;
}

export function ContactModal({ isOpen, onClose, contact, tags, members = [], onSuccess }: ContactModalProps) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    website: "",
    jobTitle: "",
    phone: "",
    stage: "NEW",
    nextAction: "",
    nextActionDueAt: "",
    assignedToId: "",
    selectedTags: [] as string[],
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        email: contact.email,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        company: contact.company || "",
        website: sanitizeUrl(contact.website) || "",
        jobTitle: contact.jobTitle || "",
        phone: contact.phone || "",
        stage: contact.stage || "NEW",
        nextAction: contact.nextAction || "",
        nextActionDueAt: contact.nextActionDueAt ? contact.nextActionDueAt.slice(0, 10) : "",
        assignedToId: contact.assignedToId || "",
        selectedTags: contact.tags?.map(t => t.id) || [],
      });
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        website: "",
        jobTitle: "",
        phone: "",
        stage: "NEW",
        nextAction: "",
        nextActionDueAt: "",
        assignedToId: "",
        selectedTags: [],
      });
    }
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: ContactPayload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        website: formData.website,
        jobTitle: formData.jobTitle,
        phone: formData.phone,
        stage: formData.stage,
        tags: formData.selectedTags,
        nextAction: formData.nextAction || null,
        nextActionDueAt: formData.nextActionDueAt || null,
        assignedToId: formData.assignedToId || null,
      };

      if (contact) {
        await updateContact(contact.id, payload);
        addToast("success", "Contact updated successfully");
      } else {
        await createContact(payload);
        addToast("success", "Contact created successfully");
      }
      onSuccess();
    } catch {
      addToast("error", "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white">
        <div className="border-b border-border-light px-6 py-4">
          <h2 className="text-sm font-semibold text-text-primary">
            {contact ? "Edit contact" : "New contact"}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {contact ? "Update the details for this relationship." : "Create a new contact in your pipeline."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">First name</label>
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="e.g. John"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Last name</label>
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                  placeholder="john.doe@company.com"
                  disabled={!!contact}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Company</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="e.g. Acme Inc"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="https://company.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Role</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="e.g. CTO"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted">Stage</label>
              <div className="relative">
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-border-light bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                >
                  {RELATIONSHIP_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Next action</label>
                <div className="relative">
                  <select
                    value={formData.nextAction}
                    onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                  >
                    <option value="">No action</option>
                    {NEXT_ACTIONS.map((action) => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                  <CalendarDays size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-text-muted">Due date</label>
                <input
                  type="date"
                  value={formData.nextActionDueAt}
                  onChange={(e) => setFormData({ ...formData, nextActionDueAt: e.target.value })}
                  className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted">Owner</label>
              <div className="relative">
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-border-light bg-white py-2 pl-8 pr-3 text-sm outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
                <UserCheck size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted">Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "rounded border px-2 py-0.5 text-[10px] font-medium tracking-wider transition-all",
                      formData.selectedTags.includes(tag.id)
                        ? "border-brand/20 bg-brand/10 text-brand"
                        : "border-border-light bg-white text-text-muted hover:border-brand/20"
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && <span className="text-xs text-text-muted italic">No tags available</span>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border-light pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : contact ? "Update Contact" : "Add Contact"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
