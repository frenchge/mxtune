"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSuggestions?: number;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function AutocompleteInput({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
  maxSuggestions = 8,
}: AutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const filteredOptions = useMemo(() => {
    const query = normalize(value.trim());
    const list = query
      ? options.filter((option) => normalize(option).includes(query))
      : options;
    return list.slice(0, maxSuggestions);
  }, [maxSuggestions, options, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, filteredOptions.length]);

  useEffect(() => {
    if (!isOpen) return;

    const dialogContent = containerRef.current?.closest(
      '[data-slot="dialog-content"]'
    ) as HTMLElement | null;
    setPortalTarget(dialogContent || document.body);

    const updateDropdownPosition = () => {
      const input = containerRef.current?.querySelector("input");
      if (!input) return;
      const rect = input.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen]);

  const selectOption = (option: string) => {
    onValueChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to let mousedown option selection complete before closing
          setTimeout(() => setIsOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (!isOpen || filteredOptions.length === 0) return;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) =>
              prev === 0 ? filteredOptions.length - 1 : prev - 1
            );
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            selectOption(filteredOptions[activeIndex] || filteredOptions[0]);
            return;
          }

          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {isOpen &&
        filteredOptions.length > 0 &&
        dropdownPosition &&
        portalTarget &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="z-[90] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl"
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <ul className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.map((option, index) => (
                <li key={option}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectOption(option);
                    }}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      index === activeIndex
                        ? "bg-purple-500/20 text-white"
                        : "text-zinc-200 hover:bg-zinc-800"
                    )}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          portalTarget
        )}
    </div>
  );
}
