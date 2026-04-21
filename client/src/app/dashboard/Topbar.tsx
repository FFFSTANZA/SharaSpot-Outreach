"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, RefreshCw, Search, Bell, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

interface TopBarProps {
  placeholder?: string;
  initialValue?: string;
  rightActions?: React.ReactNode;
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  filterOptions?: string[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  filterSlot?: React.ReactNode;
}

export function TopBar({
  placeholder = "Search emails, campaigns...",
  initialValue = "",
  rightActions,
  onSearch,
  onRefresh,
  isRefreshing = false,
  filterSlot,
}: TopBarProps) {
  const { toggle } = useSidebar();
  const [searchValue, setSearchValue] = useState(initialValue);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  return (
    <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-border-light relative z-10">
      <button
        onClick={toggle}
        className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-interactive-hover transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-2xl relative">
        <div className="flex items-center bg-background rounded-full border border-border-light focus-within:border-brand focus-within:bg-white focus-within:shadow-sm transition-all px-4 group">
          <Search size={16} className="text-text-muted group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 h-10 bg-transparent py-2.5 px-3 text-sm text-text-primary outline-none placeholder:text-text-muted font-medium"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); onSearch?.(""); }}
              className="p-1 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {filterSlot}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-full text-text-secondary hover:bg-interactive-hover disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={18} className={cn(isRefreshing && "animate-spin text-brand")} />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full text-text-secondary hover:bg-interactive-hover transition-colors relative"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white border border-border-light shadow-elevated animate-up">
              <div className="px-5 py-4 border-b border-border-light">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">System Events</p>
              </div>
              <div className="px-5 py-10 text-center">
                <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={20} className="text-text-muted" />
                </div>
                <p className="text-sm font-bold text-text-primary">All clear</p>
                <p className="text-xs text-text-muted mt-1">No pending infrastucture alerts.</p>
              </div>
            </div>
          )}
        </div>

        {rightActions}
      </div>
    </header>
  );
}