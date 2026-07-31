"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SelectMenuOption = { value: string; label: string };

/** A custom-styled dropdown matching the app's own card/border language,
 * for places where the browser's native <select> popup (unstyleable across
 * browsers) doesn't fit the rest of the UI. Reuses ActionsMenu's
 * click-outside/Escape pattern. */
export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = "Select…",
  invalid,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus:ring-2 ${
          invalid
            ? "border-stamp bg-cream focus:border-stamp focus:ring-stamp/20"
            : "border-manila-dark bg-cream focus:border-rust focus:ring-rust/20"
        }`}
      >
        <span className={selected ? "text-ink" : "text-steel-light"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`ml-2 shrink-0 text-steel transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="animate-global-drop-in absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-manila-dark bg-cream py-1.5 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-manila ${
                opt.value === value
                  ? "bg-rust-soft/60 font-medium text-rust-dark"
                  : "text-ink"
              }`}
            >
              {opt.label}
              {opt.value === value && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
