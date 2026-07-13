"use client";

import { useEffect, useRef, useState } from "react";

export type FilterableColumn = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
};

export function FilterChip({
  column,
  value,
  onChange,
  onRemove,
  defaultOpen = false,
}: {
  column: FilterableColumn;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown, true);
    return () =>
      document.removeEventListener("mousedown", handleMouseDown, true);
  }, [open]);

  useEffect(() => {
    if (open && column.type === "text") {
      inputRef.current?.focus();
    }
  }, [open, column.type]);

  const hasValue = Boolean(value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex max-w-56 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
          hasValue
            ? "border-rust bg-rust-soft text-rust-dark"
            : "border-manila-dark bg-cream text-steel hover:text-ink"
        }`}
      >
        <span className="truncate font-medium">
          {column.label}
          {hasValue && <span className="font-normal">: {value}</span>}
        </span>
        <span className="shrink-0 text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-64 rounded-md border border-manila-dark bg-paper shadow-lg">
          <div className="flex items-center justify-between border-b border-manila-dark px-3 py-2">
            <span className="truncate text-sm font-medium text-ink">
              {column.label}
            </span>
            <button
              type="button"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="rounded-sm p-1 text-steel hover:bg-manila hover:text-stamp"
              aria-label={`Remove ${column.label} filter`}
            >
              ✕
            </button>
          </div>
          <div className="p-3">
            {column.type === "select" ? (
              <div className="flex flex-col gap-0.5">
                {column.options?.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                      value === opt
                        ? "bg-rust-soft font-medium text-rust-dark"
                        : "text-ink hover:bg-manila"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                {value && (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="mt-1 rounded-sm px-2 py-1.5 text-left text-xs text-steel hover:bg-manila"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            ) : (
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type a value…"
                className="w-full rounded-sm border border-manila-dark bg-cream px-2.5 py-1.5 text-sm text-ink placeholder:text-steel-light focus:border-rust focus:outline-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AddFilterChip({
  columns,
  onAdd,
}: {
  columns: FilterableColumn[];
  onAdd: (column: FilterableColumn) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleMouseDown, true);
    return () =>
      document.removeEventListener("mousedown", handleMouseDown, true);
  }, [open]);

  if (columns.length === 0) return null;

  const filtered = columns.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-manila-dark px-2.5 py-1 text-xs text-steel transition-colors hover:border-rust hover:text-rust"
      >
        + Filter
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-56 rounded-md border border-manila-dark bg-paper shadow-lg">
          <div className="border-b border-manila-dark p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fields…"
              className="w-full rounded-sm border border-manila-dark bg-cream px-2 py-1 text-xs text-ink placeholder:text-steel-light focus:border-rust focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-steel-light">No fields</p>
            ) : (
              filtered.map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => {
                    onAdd(col);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-manila"
                >
                  {col.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
