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
  placeholder = "Search workspace",
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
    <header className="relative z-20 flex min-h-[68px] flex-wrap items-center gap-3 border-b border-border-light bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 md:flex-nowrap">
      <button
        onClick={toggle}
        aria-label="Open sidebar"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-[#F0F1F3] lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="order-3 relative min-w-0 w-full flex-1 md:order-none md:w-auto lg:max-w-2xl">
        <div className="group flex h-10 items-center rounded-lg border border-border-light bg-[#F8FAFC] px-3 transition-all focus-within:border-brand/50 focus-within:bg-white focus-within:shadow-premium-sm sm:px-4">
          <Search size={16} className="text-text-muted group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); onSearch?.(""); }}
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-[#F0F1F3] hover:text-text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:order-none md:ml-0">
        {filterSlot}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-[#F0F1F3] disabled:opacity-50"
        >
          <RefreshCw size={18} className={cn(isRefreshing && "animate-spin text-brand")} />
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Open system events"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-[#F0F1F3]"
          >
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border-light bg-white shadow-premium-lg">
              <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
                <span className="text-xs font-medium text-text-secondary">Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-[#F0F1F3]"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F1F3]">
                  <Bell size={14} className="text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary">All clear</p>
                <p className="mt-1 text-xs text-text-muted">No pending infrastructure alerts.</p>
              </div>
            </div>
          )}
        </div>

        {rightActions}
      </div>
    </header>
  );
}
