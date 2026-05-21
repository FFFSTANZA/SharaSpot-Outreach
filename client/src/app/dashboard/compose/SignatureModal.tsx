"use client";

import { Plus } from "lucide-react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-0 max-w-lg w-full overflow-hidden rounded-xl bg-white border border-gray-200">
        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Email Signatures</h3>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Manage your professional sign-offs</p>
          </div>
        </div>

        <div className="p-6">
          {editingSignature ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Signature Name</label>
                <input
                  type="text"
                  value={editingSignature.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Professional, Informal, Sales"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Content (HTML supported)</label>
                <textarea
                  value={editingSignature.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Best regards,&#10;John Doe"
                  rows={6}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1 h-11 font-bold" onClick={onCancelEdit}>Cancel</Button>
                <Button variant="primary" className="flex-1 h-11 font-bold" onClick={() => onSave(editingSignature)}>Save Signature</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="grid grid-cols-1 gap-3">
                {signatures.map(sig => (
                  <div
                    key={sig.id}
                    className={cn(
                      "group flex items-start justify-between p-4 rounded-2xl border transition-all cursor-default",
                      sig.isDefault ? "bg-green-50/30 border-green-100 shadow-sm" : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900 truncate">{sig.name}</p>
                        {sig.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-tighter">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 italic">{sig.content || "No content"}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(sig)}
                        className="h-8 px-3 rounded-lg text-xs font-bold text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        Edit
                      </button>
                      {!sig.isDefault && (
                        <button
                          onClick={() => onSetDefault(sig.id)}
                          className="h-8 px-3 rounded-lg text-xs font-bold text-gray-500 hover:text-[#00A63E] hover:bg-[#00A63E]/50 transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {signatures.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-sm text-gray-400 font-medium">No signatures created yet</p>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                className="w-full h-12 border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50/30 font-bold transition-all text-gray-500 hover:text-green-600 rounded-2xl"
                onClick={onCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Brand New Signature
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
