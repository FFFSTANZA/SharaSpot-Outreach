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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add to List</h2>
                        <p className="text-sm text-gray-500">{selectedContactIds.length} contacts selected</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Folder or List</h3>

                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-4" />
                                <p className="text-sm text-gray-400 font-medium">Loading lists...</p>
                            </div>
                        ) : lists.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <Folder className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium mb-3">No lists found</p>
                                <button
                                    onClick={onClose}
                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase"
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
                                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group text-left",
                                        selectedListId === list.id
                                            ? "bg-amber-50 border-amber-400 shadow-sm"
                                            : "bg-white border-gray-50 hover:border-gray-100 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                            selectedListId === list.id ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                        )}>
                                            <Folder size={20} />
                                        </div>
                                        <div>
                                            <div className={cn("text-sm font-bold", selectedListId === list.id ? "text-amber-900" : "text-gray-700")}>
                                                {list.name}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">{list._count?.contacts || 0} contacts</div>
                                        </div>
                                    </div>
                                    {selectedListId === list.id && (
                                        <div className="h-6 w-6 bg-amber-500 rounded-full flex items-center justify-center text-white animate-in zoom-in duration-300">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-50 sticky bottom-0 bg-white">
                    <button
                        onClick={handleAdd}
                        disabled={isSubmitting || !selectedListId || isLoading}
                        className="w-full h-12 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
