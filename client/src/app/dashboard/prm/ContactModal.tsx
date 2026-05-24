"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { Contact, Tag } from "@/types";
import { createContact, updateContact } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/Button";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  tags: Tag[];
  onSuccess: () => void;
}

export function ContactModal({ isOpen, onClose, contact, tags, onSuccess }: ContactModalProps) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    phone: "",
    stage: "COLD",
    selectedTags: [] as string[],
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        email: contact.email,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        company: contact.company || "",
        jobTitle: contact.jobTitle || "",
        phone: contact.phone || "",
        stage: contact.stage,
        selectedTags: contact.tags?.map(t => t.id) || [],
      });
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        jobTitle: "",
        phone: "",
        stage: "COLD",
        selectedTags: [],
      });
    }
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (contact) {
        await updateContact(contact.id, {
          ...formData,
          tags: formData.selectedTags,
        } as any);
        addToast("success", "Contact updated successfully");
      } else {
        await createContact({
          ...formData,
          tags: formData.selectedTags,
        } as any);
        addToast("success", "Contact created successfully");
      }
      onSuccess();
    } catch (error) {
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
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-text-primary uppercase">
            {contact ? "Edit Contact" : "Add New Contact"}
          </h2>
          <p className="text-sm text-text-muted mt-1 font-semibold">
            {contact ? "Update the details for this relationship." : "Create a new contact in your pipeline."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">First Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-background border border-border-light rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="e.g. John"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Last Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-background border border-border-light rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Email Address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-background border border-border-light rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="john.doe@company.com"
                  disabled={!!contact}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Company</label>
                <div className="relative group">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-background border border-border-light rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="e.g. Acme Inc"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Job Title</label>
                <div className="relative group">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full bg-background border border-border-light rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="e.g. CTO"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Phone Number</label>
              <div className="relative group">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-background border border-border-light rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Pipeline Stage</label>
              <div className="relative">
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full bg-background border border-border-light rounded-xl py-2.5 px-4 text-sm font-bold appearance-none focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                >
                  <option value="COLD">COLD</option>
                  <option value="WARM">WARM</option>
                  <option value="HOT">HOT</option>
                  <option value="REPLIED">REPLIED</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="BOUNCED">BOUNCED</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border-2 uppercase tracking-wider",
                      formData.selectedTags.includes(tag.id)
                        ? "bg-brand/10 border-brand text-brand"
                        : "bg-white border-border-light text-text-muted hover:border-brand/30"
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && <span className="text-xs text-text-muted italic px-1">No tags available</span>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isSubmitting} className="font-bold min-w-[140px] h-11">
              {isSubmitting ? "Saving..." : contact ? "Update Contact" : "Add Contact"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
