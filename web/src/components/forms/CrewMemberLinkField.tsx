"use client";

import { Search, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { Modal } from "@/components/ui/Modal";
import { getEmployeeDisplayName } from "@/lib/crew";
import { useAppData } from "@/lib/store";
import { CREW_CATEGORY_LABELS } from "@/lib/types";

function CrewAvatar({ photoUrl, size }: { photoUrl?: string; size: number }) {
  if (photoUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: data-URL preview, not eligible for next/image
      <img
        src={photoUrl}
        alt=""
        style={{ height: size, width: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ height: size, width: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-manila text-steel-light"
    >
      <UserIcon size={size * 0.55} />
    </div>
  );
}

/** Search-and-link picker for attaching an Employee-role User account to an
 * existing Crew Member. Never creates a Crew Member — it only links to one
 * that already exists. Excludes archived crew and crew already linked to
 * another active Employee account. */
export function CrewMemberLinkField({
  value,
  onChange,
  excludeUserId,
  invalid,
}: {
  value?: string;
  onChange: (crewMemberId: string | undefined) => void;
  /** The user record being edited, if any — excluded from the "already
   * linked elsewhere" check so editing an existing link doesn't self-block. */
  excludeUserId?: string;
  invalid?: boolean;
}) {
  const { employees, users } = useAppData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const linkedElsewhere = new Set(
    users
      .filter(
        (u) =>
          u.role === "employee" &&
          u.status === "active" &&
          u.linkedCrewMemberId &&
          u.id !== excludeUserId,
      )
      .map((u) => u.linkedCrewMemberId as string),
  );

  const eligible = employees.filter(
    (e) => e.employmentStatus !== "archived" && !linkedElsewhere.has(e.id),
  );

  const query = search.trim().toLowerCase();
  const filtered = query
    ? eligible.filter(
        (e) =>
          getEmployeeDisplayName(e).toLowerCase().includes(query) ||
          e.employeeId.toLowerCase().includes(query),
      )
    : eligible;

  const selected = employees.find((e) => e.id === value);

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 ${
          invalid ? "border-stamp" : "border-manila-dark"
        } bg-cream`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {selected ? (
            <>
              <CrewAvatar photoUrl={selected.profilePhotoUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {getEmployeeDisplayName(selected)}
                </p>
                <p className="truncate text-xs text-steel">
                  {selected.employeeId}
                  {selected.category
                    ? ` · ${CREW_CATEGORY_LABELS[selected.category]}`
                    : ""}
                </p>
              </div>
            </>
          ) : (
            <span className="text-sm text-steel-light">
              Select a crew member…
            </span>
          )}
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remove crew member link"
            className="shrink-0 rounded p-1 text-steel-light transition-colors hover:text-stamp"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Link Crew Member"
        size="md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-light"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or employee ID…"
              className="w-full rounded-xl border border-manila-dark bg-cream py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-rust focus:ring-2 focus:ring-rust/20"
            />
          </div>
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onChange(e.id);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-manila-dark px-3 py-2.5 text-left transition-colors hover:border-rust/30 hover:bg-rust-soft/20"
              >
                <CrewAvatar photoUrl={e.profilePhotoUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {getEmployeeDisplayName(e)}
                  </p>
                  <p className="truncate text-xs text-steel">
                    {e.employeeId}
                    {e.category ? ` · ${CREW_CATEGORY_LABELS[e.category]}` : ""}
                  </p>
                </div>
                <StampBadge status={e.employmentStatus} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-steel-light">
                {eligible.length === 0
                  ? "No eligible crew members available."
                  : "No matches."}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
