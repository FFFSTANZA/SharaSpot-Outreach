"use client";

import { useState, useEffect } from "react";
import { X, Plus, Loader2, Check } from "lucide-react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { getTags, createContact, updateContact } from "@/lib/apis";
import type { Tag, ContactStage, Contact } from "@/types";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact?: Contact | null;
}

const STAGES: ContactStage[] = ["LEAD", "CONTACTED", "REPLIED", "BOUNCED", "UNSUBSCRIBED", "CHURNED"];

export default function ContactModal({ isOpen, onClose, onSuccess, contact }: ContactModalProps) {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    stage: "LEAD" as ContactStage,
  });

  useEffect(() => {
    if (isOpen) {
      getTags().then(setTags).catch(() => {});
      
      if (contact) {
        setFormData({
          email: contact.email,
          firstName: contact.firstName || "",
          lastName: contact.lastName || "",
          company: contact.company || "",
          jobTitle: contact.jobTitle || "",
          stage: contact.stage,
        });
        setSelectedTags(contact.tags?.map(t => t.id) || []);
      } else {
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          company: "",
          jobTitle: "",
          stage: "LEAD",
        });
        setSelectedTags([]);
      }
    }
  }, [isOpen, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      addToast("error", "Email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (contact) {
        await updateContact(contact.id, {
          ...formData,
          tags: selectedTags,
        });
        addToast("success", "Contact updated successfully");
      } else {
        await createContact({
          ...formData,
          tags: selectedTags,
        });
        addToast("success", "Contact created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save contact", error);
      addToast("error", "Failed to save contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-0 max-w-lg w-full overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {contact ? "Edit Contact" : "Add New Contact"}
            </h3>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              {contact ? "Update relationship record" : "Create a new relationship record"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address *</label>
            <input
              type="email"
              required
              disabled={!!contact}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="recipient@example.com"
              className={cn(
                "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium",
                contact && "bg-gray-50 cursor-not-allowed opacity-70"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc."
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Job Title</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Recruiter"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Stage</label>
            <div className="grid grid-cols-3 gap-2">
              {STAGES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: s })}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-bold border transition-all",
                    formData.stage === s 
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                      : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tags</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5",
                    selectedTags.includes(tag.id)
                      ? "text-white"
                      : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:border-gray-200"
                  )}
                  style={{ 
                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
                    borderColor: selectedTags.includes(tag.id) ? tag.color : undefined
                  }}
                >
                  {selectedTags.includes(tag.id) && <Check className="h-3 w-3" />}
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-gray-400 italic">No tags available</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 h-11 font-bold"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 h-11 font-bold shadow-lg shadow-blue-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {contact ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {contact ? "Save Changes" : "Create Contact"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
