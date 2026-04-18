"use client";

import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CancelConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaignSubject: string;
  pendingCount: number;
  isLoading: boolean;
}

export default function CancelConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  campaignSubject,
  pendingCount,
  isLoading,
}: CancelConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8 text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-[1.5rem] bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight uppercase">
          Cancel campaign?
        </h3>
        <p className="text-sm font-bold text-gray-900 mb-2 tracking-tight line-clamp-1">
          &ldquo;{campaignSubject}&rdquo;
        </p>
        <p className="text-xs font-medium text-gray-400 mb-8 uppercase tracking-widest leading-relaxed">
          {pendingCount} unsent communication{pendingCount !== 1 ? "s" : ""} will be
          terminated. This action is irreversible.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Active
          </Button>
          <Button
            variant="danger"
            className="flex-1 gap-2"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Processing..." : "Terminate Campaign"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
