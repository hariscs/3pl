"use client";

import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  type LucideIcon,
  Search,
  SearchX,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AddFilterChip, type FilterableColumn, FilterChip } from "./FilterChip";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { ErrorState } from "./ui/ErrorState";
import { SkeletonTable } from "./ui/SkeletonTable";

const DEFAULT_PAGE_SIZE = 10;

export type Column<T> = {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  filter?: "text" | "select";
  filterOptions?: string[];
  align?: "left" | "right";
  /** Set false for columns with no meaningful text value, e.g. an Actions column. Defaults true. */
  filterable?: boolean;
  /** Set false for columns with no meaningful order, e.g. an Actions column. Defaults true. */
  sortable?: boolean;
};

type ActiveFilter = { id: string; key: string; openOnMount: boolean };

let chipCounter = 0;

export function FilterableTable<T>({
  columns,
  rows,
  getRowKey,
  onExport,
  defaultFilterKeys,
  initialFilterValues,
  onRowClick,
  onFilteredRowsChange,
  searchFn,
  defaultSort,
  emptyMessage = "No records yet.",
  pageSize = DEFAULT_PAGE_SIZE,
  isLoading = false,
  isError = false,
  onRetry,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onExport?: (rows: T[]) => void;
  /** Columns whose filter chip should be shown by default, with no value set. */
  defaultFilterKeys?: string[];
  /** Columns whose filter chip should be shown by default, pre-set to a
   * value (keyed by column key). Lets a caller deep-link into a pre-filtered
   * table, e.g. from a Dashboard tile. Applied once, on mount. */
  initialFilterValues?: Record<string, string>;
  /** Called when a row is clicked. The row data is passed. */
  onRowClick?: (row: T) => void;
  /** Called with the currently filtered/sorted rows (across all pages) whenever they change. */
  onFilteredRowsChange?: (rows: T[]) => void;
  /** Custom search predicate. When provided, replaces the default column-accessor search. */
  searchFn?: (row: T, query: string) => boolean;
  /** Initial sort configuration. */
  defaultSort?: { key: string; dir: "asc" | "desc" };
  /** Title shown when `rows` itself is empty (no filters applied). Superseded by `emptyTitle` when set. */
  emptyMessage?: string;
  /** Rows rendered per page. Defaults to 10. */
  pageSize?: number;
  /** Shows a skeleton instead of the table while the underlying data is still loading. */
  isLoading?: boolean;
  /** Shows an error state with a Retry action instead of the table. */
  isError?: boolean;
  onRetry?: () => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; href?: string; onClick?: () => void };
}) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(() => {
    const keys = new Set<string>([
      ...(defaultFilterKeys ?? []),
      ...Object.keys(initialFilterValues ?? {}),
    ]);
    return [...keys].map((key) => ({
      id: `initial-${key}`,
      key,
      openOnMount: false,
    }));
  });
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => {
      const values: Record<string, string> = {};
      for (const [key, value] of Object.entries(initialFilterValues ?? {})) {
        values[`initial-${key}`] = value;
      }
      return values;
    },
  );
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    defaultSort ?? null,
  );

  const filterableColumns: FilterableColumn[] = columns
    .filter((col) => col.filterable !== false)
    .map((col) => ({
      key: col.key,
      label: col.header,
      type: col.filter === "select" ? "select" : "text",
      options: col.filterOptions,
    }));

  const availableColumns = filterableColumns.filter(
    (col) => !activeFilters.some((f) => f.key === col.key),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = rows;

    if (query) {
      if (searchFn) {
        result = result.filter((row) => searchFn(row, query));
      } else {
        result = result.filter((row) =>
          columns.some(
            (col) =>
              col.filterable !== false &&
              String(col.accessor(row)).toLowerCase().includes(query),
          ),
        );
      }
    }

    result = result.filter((row) =>
      activeFilters.every((f) => {
        const value = filterValues[f.id];
        if (!value) return true;
        const col = columns.find((c) => c.key === f.key);
        if (!col) return true;
        const cell = String(col.accessor(row)).toLowerCase();
        if (col.filter === "select") return cell === value.toLowerCase();
        return cell.includes(value.toLowerCase());
      }),
    );

    if (!sort) return result;
    const sortCol = columns.find((c) => c.key === sort.key);
    if (!sortCol) return result;
    return [...result].sort((a, b) => {
      const av = sortCol.accessor(a);
      const bv = sortCol.accessor(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, columns, search, searchFn, activeFilters, filterValues, sort]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function addFilter(col: FilterableColumn) {
    chipCounter += 1;
    const id = `chip-${chipCounter}`;
    setActiveFilters((prev) => [
      ...prev,
      { id, key: col.key, openOnMount: true },
    ]);
  }

  function removeFilter(id: string) {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function resetFilters() {
    setActiveFilters([]);
    setFilterValues({});
    setSearch("");
  }

  const anyFilterActive =
    activeFilters.some((f) => filterValues[f.id]) || !!search;

  useEffect(() => {
    onFilteredRowsChange?.(filtered);
  }, [filtered, onFilteredRowsChange]);

  const [page, setPage] = useState(1);

  // A new search/filter/sort can shrink the result set out from under the
  // page the user was on — always land back on page 1 when any of them change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed off these inputs to reset pagination, not to read their values.
  useEffect(() => {
    setPage(1);
  }, [search, activeFilters, filterValues, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-manila-dark">
        <SkeletonTable />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="overflow-hidden rounded-xl border border-manila-dark">
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-light" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search everything…"
              className="w-56 rounded-full border border-manila-dark bg-cream py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-steel-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20"
            />
          </div>

          <AddFilterChip columns={availableColumns} onAdd={addFilter} />

          <div className="ml-auto flex items-center gap-3">
            <p className="text-xs text-steel">
              {anyFilterActive ? (
                <>
                  <span className="font-medium text-ink">
                    {filtered.length}
                  </span>{" "}
                  of {rows.length} rows
                </>
              ) : (
                <>{rows.length} rows</>
              )}
            </p>
            {onExport && (
              <Button variant="secondary" onClick={() => onExport(filtered)}>
                Export to Excel
              </Button>
            )}
          </div>
        </div>

        {(activeFilters.length > 0 || anyFilterActive) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => {
              const col = filterableColumns.find((c) => c.key === f.key);
              if (!col) return null;
              return (
                <FilterChip
                  key={f.id}
                  column={col}
                  value={filterValues[f.id] ?? ""}
                  onChange={(value) =>
                    setFilterValues((prev) => ({ ...prev, [f.id]: value }))
                  }
                  onRemove={() => removeFilter(f.id)}
                  defaultOpen={f.openOnMount}
                />
              );
            })}

            {anyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-steel underline hover:text-rust"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-manila-dark">
        {rows.length === 0 ? (
          <EmptyState
            icon={EmptyIcon}
            title={emptyTitle ?? emptyMessage}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No results match your search."
            description="Try a different search term or clear your filters."
            action={{ label: "Clear filters", onClick: resetFilters }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-manila">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`border-b border-manila-dark px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wide text-ink ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {col.sortable === false ? (
                        col.header
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-rust"
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
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className={`odd:bg-paper even:bg-paper-dim/40 transition-colors ${onRowClick ? "cursor-pointer hover:bg-manila/40" : ""}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`break-words border-b border-manila-dark/60 px-3 py-2.5 text-ink ${
                          col.align === "right" ? "text-right font-tick" : ""
                        }`}
                      >
                        {col.render ? col.render(row) : col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-manila-dark bg-paper px-3 py-2.5">
            <p className="text-xs text-steel">
              Showing{" "}
              <span className="font-medium text-ink">
                {(currentPage - 1) * pageSize + 1}
              </span>
              –
              <span className="font-medium text-ink">
                {Math.min(currentPage * pageSize, filtered.length)}
              </span>{" "}
              of <span className="font-medium text-ink">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-steel">
                Page <span className="font-medium text-ink">{currentPage}</span>{" "}
                of {totalPages}
              </span>
              <Button
                variant="secondary"
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
