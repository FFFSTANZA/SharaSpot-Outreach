"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Folder,
    Edit3,
    Trash2,
    Check,
    Search,
    Hash,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    getContactLists,
    createContactList,
    updateContactList,
    deleteContactList,
    ContactList
} from "@/lib/apis";
import { useToast } from "@/context/ToastContext";

interface ContactListsSidebarProps {
    selectedListId: string | null;
    onSelectList: (id: string | null) => void;
    refreshKey?: number;
}

export default function ContactListsSidebar({
    selectedListId,
    onSelectList,
    refreshKey
}: ContactListsSidebarProps) {
    const { addToast } = useToast();
    const [lists, setLists] = useState<ContactList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newListName, setNewListName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

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
        fetchLists();
    }, [fetchLists]);

    const prevRefreshKey = useRef(refreshKey);
    useEffect(() => {
        if (refreshKey !== undefined && refreshKey !== prevRefreshKey.current) {
            prevRefreshKey.current = refreshKey;
            fetchLists();
        }
    }, [fetchLists, refreshKey]);

    const handleCreate = async () => {
        const name = newListName.trim();
        if (!name) return;
        try {
            await createContactList(name);
            setNewListName("");
            fetchLists();
            addToast("success", "List created");
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to create list";
            addToast("error", message);
        }
    };

    const handleRename = async (id: string) => {
        if (!editName.trim()) {
            setEditingId(null);
            return;
        }
        try {
            await updateContactList(id, editName.trim());
            setEditingId(null);
            fetchLists();
            addToast("success", "List renamed");
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to rename list";
            addToast("error", message);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete the list "${name}"? Contacts won't be deleted.`)) return;
        try {
            await deleteContactList(id);
            if (selectedListId === id) onSelectList(null);
            fetchLists();
            addToast("success", "List deleted");
        } catch {
            addToast("error", "Failed to delete list");
        }
    };

    const filteredLists = lists.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const createForm = searchQuery.trim() === "" && (
        <div className="flex items-center gap-0.5 border-t border-border-light px-1 py-1">
            <Plus size={12} className="shrink-0 text-text-muted" />
            <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="New list..."
                className="min-w-0 flex-1 border-none bg-transparent px-1 py-1 text-[11px] font-medium text-text-primary outline-none placeholder:text-text-muted"
            />
            {newListName.trim() && (
                <button
                    onClick={handleCreate}
                    className="rounded-md p-1 text-brand hover:bg-brand/5"
                >
                    <Check size={12} />
                </button>
            )}
        </div>
    );

    return (
        <div className="flex h-full w-full flex-col bg-white animate-in fade-in duration-500">
            <div className="border-b border-border-light px-2 py-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                    <input
                        type="text"
                        placeholder="Filter lists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search lists"
                        className="w-full rounded-lg border border-border-light bg-white py-1.5 pl-7 pr-2.5 text-[11px] outline-none transition-all focus:border-brand/30 focus:ring-1 focus:ring-brand/10"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1 py-1 space-y-px">
                <button
                    onClick={() => onSelectList(null)}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                        selectedListId === null
                            ? "bg-brand/5 text-brand"
                            : "text-text-secondary hover:bg-[#F8F9FA] hover:text-text-primary"
                    )}
                >
                    <Hash size={12} className={cn(selectedListId === null ? "text-brand" : "text-text-muted")} />
                    <span>All Contacts</span>
                </button>

                {isLoading ? null : filteredLists.length === 0 && searchQuery ? (
                    <div className="px-2.5 py-6 text-center">
                        <p className="text-[10px] text-text-muted">No matching lists</p>
                    </div>
                ) : (
                    filteredLists.map((list) => (
                        <div key={list.id} className="group">
                            {editingId === list.id ? (
                                <div className="flex items-center gap-1 rounded-md border border-border-light bg-white px-2 py-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleRename(list.id)}
                                        className="min-w-0 flex-1 border-none bg-transparent text-[11px] font-medium text-text-primary outline-none"
                                    />
                                    <button onClick={() => handleRename(list.id)} className="rounded p-0.5 text-brand hover:bg-brand/5">
                                        <Check size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onSelectList(list.id)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                                        selectedListId === list.id
                                            ? "bg-brand/5 text-brand"
                                            : "text-text-secondary hover:bg-[#F8F9FA] hover:text-text-primary"
                                    )}
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Folder size={12} className={cn("shrink-0", selectedListId === list.id ? "text-brand" : "text-text-muted")} />
                                        <span className="truncate">{list.name}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className={cn(
                                            "rounded px-1.5 py-px text-[9px] font-medium",
                                            selectedListId === list.id ? "bg-brand/10 text-brand" : "bg-[#F8F9FA] text-text-muted group-hover:bg-[#F0F1F3]"
                                        )}>
                                            {list._count?.contacts || 0}
                                        </span>

                                        <div className="flex items-center gap-px opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditName(list.name); }}
                                                className="rounded p-0.5 text-text-muted transition-colors hover:text-brand"
                                            >
                                                <Edit3 size={11} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(list.id, list.name); }}
                                                className="rounded p-0.5 text-text-muted transition-colors hover:text-error-text"
                                            >
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {createForm}
        </div>
    );
}
