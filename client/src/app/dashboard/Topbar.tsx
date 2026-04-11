"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, RefreshCw, Search, Bell, X, SlidersHorizontal } from "lucide-react";
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
    <header className="flex items-center gap-3 px-4 md:px-6 py-3 bg-white border-b border-[#E8EAED]">
      {/* Hamburger — mobile sidebar toggle */}
      <button
        onClick={toggle}
        className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#5F6368] hover:text-[#1A1D21] hover:bg-[#F1F3F4] transition-all"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search — Gmail style pill search */}
      <div className="relative flex-1 lg:max-w-2xl mx-auto">
        <div className="flex items-center bg-[#F1F3F4] rounded-full border border-transparent hover:border-[#DADCE0] hover:bg-white hover:shadow-sm transition-all duration-200">
          <div className="pl-4">
            <Search className="h-4 w-4 text-[#9AA0A6]" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-h-[40px] bg-transparent py-2.5 px-3 text-sm text-[#1A1D21] outline-none placeholder:text-[#9AA0A6]"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); onSearch?.(""); }}
              className="pr-4 text-[#9AA0A6] hover:text-[#5F6368]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Filter slot */}
        {filterSlot}

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 w-9 flex items-center justify-center rounded-full text-[#5F6368] hover:text-[#1A1D21] hover:bg-[#F1F3F4] transition-all duration-150 disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        {/* Notifications dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-9 w-9 flex items-center justify-center rounded-full text-[#5F6368] hover:text-[#1A1D21] hover:bg-[#F1F3F4] transition-all duration-150"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#00A63E] ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-lg bg-white border border-[#E8EAED] shadow-lg">
              <div className="px-4 py-3 border-b border-[#E8EAED]">
                <p className="text-sm font-semibold text-[#1A1D21]">Notifications</p>
              </div>
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-[#DADCE0] mx-auto mb-2" />
                <p className="text-sm text-[#9AA0A6]">No new notifications</p>
                <p className="text-xs text-[#9AA0A6] mt-1">Campaign updates will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {rightActions}
    </header>
  );
}