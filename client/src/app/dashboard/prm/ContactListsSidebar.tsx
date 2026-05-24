"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Folder,
    FolderPlus,
    Edit3,
    Trash2,
    Check,
    X,
    Search,
    Hash
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
    const [isCreating, setIsCreating] = useState(false);
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        try {
            await createContactList(newListName.trim());
            setNewListName("");
            setIsCreating(false);
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
        if (!confirm(`Are you sure you want to delete the list "${name}"? Contacts will not be deleted.`)) return;
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

    return (
        <div className="w-full flex flex-col h-full bg-white animate-in fade-in duration-500">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Folder className="h-3 w-3" /> Folders & Lists
                    </h3>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-brand transition-all"
                        title="Create New List"
                    >
                        <FolderPlus className="h-4 w-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input
                        type="text"
                        placeholder="Search lists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search lists"
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-transparent rounded-lg text-xs font-medium focus:bg-white focus:border-brand-muted outline-none transition-all"
                    />
                </div>

                {/* Create Input */}
                {isCreating && (
                    <form onSubmit={handleCreate} className="animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-1 bg-brand-light p-1.5 rounded-xl border border-brand-muted">
                            <input
                                autoFocus
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="List name..."
                                className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-gray-800 placeholder:text-brand-muted"
                            />
                            <button
                                type="submit"
                                className="p-1 text-brand hover:bg-brand-muted rounded-lg"
                                disabled={!newListName.trim()}
                            >
                                <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="p-1 text-gray-400 hover:bg-brand-muted rounded-lg"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
                <button
                    onClick={() => onSelectList(null)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group",
                        selectedListId === null
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        <Hash className={cn("h-4 w-4", selectedListId === null ? "text-gray-900" : "text-gray-300")} />
                        <span>All Contacts</span>
                    </div>
                </button>

                <div className="pt-2">
                    {!isLoading && filteredLists.length === 0 ? (
                        <div className="px-3 py-8 text-center bg-gray-50 rounded-2xl mx-1 border border-dashed border-gray-100">
                            <Folder className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No lists found</p>
                        </div>
                    ) : (
                        filteredLists.map((list) => (
                            <div key={list.id} className="group relative">
                                {editingId === list.id ? (
                                    <div className="flex items-center gap-1 bg-brand-light p-1 rounded-xl border border-brand-muted mx-1">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleRename(list.id)}
                                            className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-gray-800"
                                        />
                                        <button onClick={() => handleRename(list.id)} className="p-1 text-brand hover:bg-brand-muted rounded-lg">
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => onSelectList(list.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                                            selectedListId === list.id
                                                ? "bg-brand-light text-brand shadow-sm border border-brand-muted"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Folder className={cn("h-4 w-4", selectedListId === list.id ? "text-brand" : "text-gray-300")} />
                                            <span className="truncate max-w-[120px]">{list.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors",
                                                selectedListId === list.id ? "bg-brand-muted text-brand" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500"
                                            )}>
                                                {list._count?.contacts || 0}
                                            </span>

                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditName(list.name); }}
                                                    className="p-1 hover:bg-brand-muted rounded-md text-brand hover:text-brand transition-colors"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(list.id, list.name); }}
                                                    className="p-1 hover:bg-red-50 rounded-md text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
