"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Button } from "./ui/Button";

export type Column<T> = {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  filter?: "text" | "select";
  filterOptions?: string[];
  align?: "left" | "right";
};

export function FilterableTable<T>({
  columns,
  rows,
  getRowKey,
  onExport,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onExport?: (rows: T[]) => void;
}) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    null,
  );

  const filtered = useMemo(() => {
    const result = rows.filter((row) =>
      columns.every((col) => {
        const filterValue = filters[col.key];
        if (!filterValue) return true;
        const cell = String(col.accessor(row)).toLowerCase();
        if (col.filter === "select") return cell === filterValue.toLowerCase();
        return cell.includes(filterValue.toLowerCase());
      }),
    );
    if (!sort) return result;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return result;
    const sorted = [...result].sort((a, b) => {
      const av = col.accessor(a);
      const bv = col.accessor(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, columns, filters, sort]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const anyFilterActive = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-steel">
          {anyFilterActive ? (
            <>
              Showing{" "}
              <span className="font-medium text-ink">{filtered.length}</span> of{" "}
              {rows.length} rows —{" "}
              <button
                type="button"
                onClick={() => setFilters({})}
                className="underline hover:text-rust"
              >
                clear filters
              </button>
            </>
          ) : (
            <>{rows.length} rows — filter any column below, Excel-style</>
          )}
        </p>
        {onExport && (
          <Button variant="secondary" onClick={() => onExport(filtered)}>
            Export to Excel
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-md border border-manila-dark">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-manila">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`border-b border-manila-dark px-3 py-2 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-rust"
                  >
                    {col.header}
                    <span className="text-[10px] text-steel-light">
                      {sort?.key === col.key
                        ? sort.dir === "asc"
                          ? "▲"
                          : "▼"
                        : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
            <tr className="bg-paper-dim">
              {columns.map((col) => (
                <th key={col.key} className="border-b border-manila-dark p-1.5">
                  {col.filter === "select" ? (
                    <select
                      value={filters[col.key] ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, [col.key]: e.target.value }))
                      }
                      className="w-full rounded-sm border border-manila-dark bg-cream px-1.5 py-1 text-xs text-ink focus:border-rust focus:outline-none"
                    >
                      <option value="">All</option>
                      {col.filterOptions?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={filters[col.key] ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, [col.key]: e.target.value }))
                      }
                      placeholder="Filter…"
                      className="w-full rounded-sm border border-manila-dark bg-cream px-1.5 py-1 text-xs text-ink placeholder:text-steel-light focus:border-rust focus:outline-none"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-sm text-steel"
                >
                  No rows match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="odd:bg-paper even:bg-paper-dim/40 hover:bg-manila/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`border-b border-manila-dark/60 px-3 py-2 text-ink ${
                        col.align === "right" ? "text-right font-tick" : ""
                      }`}
                    >
                      {col.render ? col.render(row) : col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
