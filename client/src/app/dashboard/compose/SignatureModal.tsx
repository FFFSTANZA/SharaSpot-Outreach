"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatures: Signature[];
  editingSignature: Signature | null;
  onEdit: (sig: Signature) => void;
  onSave: (sig: Signature) => void;
  onCancelEdit: () => void;
  onSetDefault: (id: string) => void;
  onCreateNew: () => void;
}

export function SignatureModal({
  isOpen,
  onClose,
  signatures,
  editingSignature,
  onEdit,
  onSave,
  onCancelEdit,
  onSetDefault,
  onCreateNew,
}: SignatureModalProps) {
  const handleNameChange = (name: string) => {
    if (editingSignature) {
      onEdit({ ...editingSignature, name });
    }
  };

  const handleContentChange = (content: string) => {
    if (editingSignature) {
      onEdit({ ...editingSignature, content });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/10 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-lg bg-white shadow-premium-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Email Signatures</h3>
            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Manage your professional sign-offs</p>
          </div>
        </div>

        <div className="p-6">
          {editingSignature ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Signature Name</label>
                <input
                  type="text"
                  value={editingSignature.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Professional, Informal, Sales"
                  className="w-full rounded-md border border-border-light bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Content (HTML supported)</label>
                <textarea
                  value={editingSignature.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Best regards,&#10;John Doe"
                  rows={6}
                  className="w-full rounded-md border border-border-light bg-white px-4 py-3 text-sm text-text-primary outline-none transition-all focus:border-brand/30 focus:ring-2 focus:ring-brand/10 font-medium resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onCancelEdit} className="flex flex-1 h-11 items-center justify-center rounded-md border border-border-light bg-white px-5 text-xs font-bold text-text-secondary transition-colors hover:bg-[#F0F1F3]">Cancel</button>
                <button onClick={() => onSave(editingSignature)} className="flex flex-1 h-11 items-center justify-center rounded-md bg-brand px-5 text-xs font-bold text-white transition-all hover:bg-brand/90">Save Signature</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-1 gap-3">
                {signatures.map(sig => (
                  <div
                    key={sig.id}
                    className={cn(
                      "group flex items-start justify-between p-4 rounded-lg border transition-all",
                      sig.isDefault ? "bg-brand/[0.04] border-brand/10 shadow-sm" : "bg-white border-border-light hover:border-border-light hover:bg-[#F8F9FA]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-text-primary truncate">{sig.name}</p>
                        {sig.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-tighter">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted line-clamp-1 italic">{sig.content || "No content"}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(sig)}
                        className="h-8 rounded-md px-3 text-xs font-bold text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                      >
                        Edit
                      </button>
                      {!sig.isDefault && (
                        <button
                          onClick={() => onSetDefault(sig.id)}
                          className="h-8 rounded-md px-3 text-xs font-bold text-text-muted hover:text-brand hover:bg-brand/10 transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {signatures.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-border-light rounded-lg">
                    <p className="text-sm text-text-muted font-medium">No signatures created yet</p>
                  </div>
                )}
              </div>

              <button
                onClick={onCreateNew}
                className="flex w-full h-12 items-center justify-center rounded-lg border-2 border-dashed border-border-light text-text-muted transition-all hover:border-brand hover:bg-brand/10 hover:text-brand font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Brand New Signature
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
