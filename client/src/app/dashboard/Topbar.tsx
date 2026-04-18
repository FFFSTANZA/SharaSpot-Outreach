"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, RefreshCw, Search, Bell, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";

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
    <header className="flex items-center gap-3 px-4 md:px-6 py-4 bg-white border-b border-gray-100">
      {/* Hamburger — mobile sidebar toggle */}
      <button
        onClick={toggle}
        className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search — Professional pill search */}
      <div className="relative flex-1 lg:max-w-2xl mx-auto">
        <div className="flex items-center bg-gray-50 rounded-xl border border-transparent focus-within:border-brand/20 focus-within:bg-white transition-all duration-200">
          <div className="pl-4">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-h-[40px] bg-transparent py-2 px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 font-medium"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); onSearch?.(""); }}
              className="pr-4 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Filter slot */}
        {filterSlot}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-brand hover:bg-brand-light transition-all duration-200 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        {/* Notifications dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-10 w-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-brand hover:bg-brand-light transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-xl bg-white border border-gray-100 shadow-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Notifications</p>
              </div>
              <div className="px-5 py-10 text-center">
                <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Bell className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900">No new notifications</p>
                <p className="text-xs text-gray-500 mt-1">Campaign updates will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {rightActions}
    </header>
  );
}
