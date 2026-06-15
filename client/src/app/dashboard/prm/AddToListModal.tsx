"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    X,
    Folder,
    Check,
    Loader2,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getContactLists, addContactsToList, ContactList } from "@/lib/apis";
import { useToast } from "@/context/ToastContext";

interface AddToListModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedContactIds: string[];
    onSuccess: () => void;
}

export default function AddToListModal({
    isOpen,
    onClose,
    selectedContactIds,
    onSuccess
}: AddToListModalProps) {
    const { addToast } = useToast();
    const [lists, setLists] = useState<ContactList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

    const fetchLists = useCallback(async () => {
        try {
            const data = await getContactLists();
            setLists(data);
        } catch {
            addToast("error", "Failed to load lists");
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setSelectedListId(null);
            fetchLists();
        }
    }, [isOpen, fetchLists]);

    const handleAdd = async () => {
        if (!selectedListId) return;
        setIsSubmitting(true);
        try {
            await addContactsToList(selectedListId, selectedContactIds);
            addToast("success", `Added ${selectedContactIds.length} contacts to the list`);
            onSuccess();
            onClose();
        } catch {
            addToast("error", "Failed to add contacts to list");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-text-primary/10 backdrop-blur-sm p-4">
            <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-premium-lg">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-light bg-white px-6 py-5">
                    <div>
                        <h2 className="text-xl font-semibold text-text-primary">Add to list</h2>
                        <p className="text-sm text-text-muted">{selectedContactIds.length} contacts selected</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-secondary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    <h3 className="text-xs font-medium uppercase tracking-widest text-text-muted">Select a list</h3>

                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="mb-4 h-8 w-8 animate-spin text-brand" />
                                <p className="text-sm text-text-muted font-medium">Loading lists...</p>
                            </div>
                        ) : lists.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border-light bg-white py-12 text-center">
                                <Folder className="h-8 w-8 text-text-muted mx-auto mb-3" />
                                <p className="text-sm text-text-muted font-medium mb-3">No lists found</p>
                                <button
                                    onClick={onClose}
                                    className="text-xs font-medium uppercase text-brand hover:text-brand/80"
                                >
                                    Create one first in the sidebar
                                </button>
                            </div>
                        ) : (
                            lists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedListId(list.id)}
                                    className={cn(
                                        "group flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all",
                                        selectedListId === list.id
                                            ? "border-brand/20 bg-brand/5 shadow-premium-sm"
                                            : "border-border-light bg-white hover:bg-[#F0F1F3]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                            selectedListId === list.id ? "bg-brand text-white" : "bg-[#F8F9FA] text-text-muted"
                                        )}>
                                            <Folder size={20} />
                                        </div>
                                        <div>
                                            <div className={cn("text-sm font-medium", selectedListId === list.id ? "text-text-primary" : "text-text-secondary")}>
                                                {list.name}
                                            </div>
                                            <div className="text-[10px] font-medium uppercase text-text-muted">{list._count?.contacts || 0} contacts</div>
                                        </div>
                                    </div>
                                    {selectedListId === list.id && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white animate-in zoom-in duration-300">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 border-t border-border-light bg-white p-6">
                    <button
                        onClick={handleAdd}
                        disabled={isSubmitting || !selectedListId || isLoading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-white transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span>Add Contacts</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
