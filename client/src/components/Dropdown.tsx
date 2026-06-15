"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  disabled = false,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  const toggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => {
        if (!prev) setHighlightedIndex(-1);
        return !prev;
      });
    }
  }, [disabled]);

  const select = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(0);
          } else {
            setHighlightedIndex((prev) =>
              prev < options.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : options.length - 1
            );
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            select(options[highlightedIndex].value);
          } else {
            setIsOpen(true);
            setHighlightedIndex(0);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [disabled, isOpen, highlightedIndex, options, select]
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="mb-2 block text-[10px] font-black text-text-muted uppercase tracking-widest px-1">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between rounded-lg bg-[#F8F9FA] px-4 py-3 text-sm font-bold tracking-tight transition-all duration-300 border border-border-light shadow-card",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-white hover:border-brand/20",
          isOpen && "ring-4 ring-brand/10 border-brand bg-white"
        )}
      >
        <span className={selectedOption ? "text-text-primary" : "text-text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform duration-300",
            isOpen && "rotate-180 text-brand"
          )}
        />
      </button>

      {/* Options list */}
      <div
        className={cn(
          "absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-border-light bg-white shadow-2xl",
          "origin-top transition-all duration-300 ease-out",
          isOpen
            ? "scale-y-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-y-95 opacity-0 -translate-y-2"
        )}
      >
        {options.length === 0 ? (
          <div className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-widest text-center">
            No active records
          </div>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto py-2"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => select(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "cursor-pointer px-5 py-2.5 text-sm font-bold transition-all duration-200",
                  option.value === value
                    ? "bg-brand-light text-brand"
                    : "text-text-secondary hover:bg-[#F0F1F3]",
                  highlightedIndex === index &&
                  option.value !== value &&
                  "bg-[#F0F1F3]/80"
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
