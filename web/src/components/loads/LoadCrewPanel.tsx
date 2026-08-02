"use client";

import { Loader2, Search, User as UserIcon, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { getEmployeeDisplayName } from "@/lib/crew";
import {
  formatDuration,
  getAssignmentLiveElapsedMinutes,
  nowHHMM,
} from "@/lib/load-time";
import { useAppData } from "@/lib/store";
import {
  CREW_CATEGORY_LABELS,
  type Load,
  type LoadCrewAssignment,
  type LoadCrewAssignmentStatus,
} from "@/lib/types";

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

const ASSIGNMENT_TONE: Record<
  LoadCrewAssignmentStatus,
  "success" | "muted" | "warning" | "danger" | "info"
> = {
  assigned: "muted",
  clocked_in: "success",
  on_break: "warning",
  clocked_out: "info",
  removed: "danger",
};

const ASSIGNMENT_LABEL: Record<LoadCrewAssignmentStatus, string> = {
  assigned: "Assigned",
  clocked_in: "Working",
  on_break: "On Break",
  clocked_out: "Clocked Out",
  removed: "Removed",
};

/** Assign/clock-in/break/clock-out/remove crew for a Load — mounted
 * verbatim on both the Admin detail page and the field view, so both
 * surfaces read and write the exact same assignment records. */
export function LoadCrewPanel({
  load,
  editable,
}: {
  load: Load;
  editable: boolean;
}) {
  const {
    employees,
    assignCrewMember,
    clockInCrewMember,
    startCrewBreak,
    endCrewBreak,
    clockOutCrewMember,
    removeCrewMember,
  } = useAppData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => nowHHMM());
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(
    null,
  );
  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<LoadCrewAssignment | null>(
    null,
  );

  async function runAssignmentAction(
    assignmentId: string,
    action: () => Promise<void>,
  ) {
    setPendingAssignmentId(assignmentId);
    try {
      await action();
    } finally {
      setPendingAssignmentId(null);
    }
  }

  // Keep "Working for Xh Ym" fresh while anyone is actively clocked in.
  useEffect(() => {
    const hasActive = load.assignments.some(
      (a) => a.status === "clocked_in" || a.status === "on_break",
    );
    if (!hasActive) return;
    const interval = setInterval(() => setNow(nowHHMM()), 30_000);
    return () => clearInterval(interval);
  }, [load.assignments]);

  const activeAssignments = load.assignments.filter(
    (a) => a.status !== "removed",
  );
  const removedAssignments = load.assignments.filter(
    (a) => a.status === "removed",
  );
  const workingCount = load.assignments.filter(
    (a) => a.status === "clocked_in" || a.status === "on_break",
  ).length;

  const assignedEmployeeIds = new Set(
    activeAssignments.map((a) => a.employeeId),
  );
  const eligible = employees.filter(
    (e) => e.employmentStatus === "active" && !assignedEmployeeIds.has(e.id),
  );
  const query = search.trim().toLowerCase();
  const filtered = query
    ? eligible.filter(
        (e) =>
          getEmployeeDisplayName(e).toLowerCase().includes(query) ||
          e.employeeId.toLowerCase().includes(query),
      )
    : eligible;

  function employeeFor(assignment: LoadCrewAssignment) {
    return employees.find((e) => e.id === assignment.employeeId);
  }

  const removeTargetEmployee = removeTarget ? employeeFor(removeTarget) : null;
  const removeTargetName = removeTargetEmployee
    ? getEmployeeDisplayName(removeTargetEmployee)
    : "This crew member";

  function renderAssignmentRow(a: LoadCrewAssignment) {
    const employee = employeeFor(a);
    const minutes = getAssignmentLiveElapsedMinutes(a, now);
    return (
      <div
        key={a.id}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-manila-dark bg-cream px-4 py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <CrewAvatar photoUrl={employee?.profilePhotoUrl} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {employee ? getEmployeeDisplayName(employee) : "Unknown"}
            </p>
            <p className="truncate text-xs text-steel">
              {employee?.employeeId}
              {employee?.category
                ? ` · ${CREW_CATEGORY_LABELS[employee.category]}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(a.status === "clocked_in" || a.status === "on_break") && (
            <div className="hidden text-right text-xs text-steel sm:block">
              <p>Clocked In {a.clockIn}</p>
              <p>Working for {formatDuration(minutes)}</p>
            </div>
          )}
          {a.status === "clocked_out" && a.clockIn && a.clockOut && (
            <p className="hidden text-right text-xs text-steel sm:block">
              {a.clockIn} – {a.clockOut} ({formatDuration(minutes)})
            </p>
          )}
          <StatusPill tone={ASSIGNMENT_TONE[a.status]}>
            {ASSIGNMENT_LABEL[a.status]}
          </StatusPill>

          {editable && (
            <div className="flex items-center gap-2">
              {a.status === "assigned" && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    runAssignmentAction(a.id, () =>
                      clockInCrewMember(load.id, a.id),
                    )
                  }
                  loading={pendingAssignmentId === a.id}
                  disabled={pendingAssignmentId !== null}
                >
                  Clock In
                </Button>
              )}
              {a.status === "clocked_in" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      runAssignmentAction(a.id, () =>
                        startCrewBreak(load.id, a.id),
                      )
                    }
                    loading={pendingAssignmentId === a.id}
                    disabled={pendingAssignmentId !== null}
                  >
                    Start Break
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      runAssignmentAction(a.id, () =>
                        clockOutCrewMember(load.id, a.id),
                      )
                    }
                    loading={pendingAssignmentId === a.id}
                    disabled={pendingAssignmentId !== null}
                  >
                    Clock Out
                  </Button>
                </>
              )}
              {a.status === "on_break" && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    runAssignmentAction(a.id, () => endCrewBreak(load.id, a.id))
                  }
                  loading={pendingAssignmentId === a.id}
                  disabled={pendingAssignmentId !== null}
                >
                  End Break
                </Button>
              )}
              <Button variant="danger" onClick={() => setRemoveTarget(a)}>
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-steel">
          <span className="font-medium text-ink">{workingCount}</span> crew
          member{workingCount === 1 ? "" : "s"} working
        </p>
        {editable && (
          <Button onClick={() => setPickerOpen(true)}>+ Add Crew</Button>
        )}
      </div>

      {activeAssignments.length === 0 ? (
        <div className="rounded-xl border border-manila-dark bg-paper-dim">
          <EmptyState
            icon={Users}
            title="No crew assigned yet"
            description="Add crew members so they can clock in and get paid for this load."
            action={
              editable
                ? { label: "Add Crew", onClick: () => setPickerOpen(true) }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {activeAssignments.map(renderAssignmentRow)}
        </div>
      )}

      {removedAssignments.length > 0 && (
        <details className="rounded-xl border border-manila-dark">
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-steel">
            {removedAssignments.length} removed
          </summary>
          <div className="space-y-2 border-t border-manila-dark p-3">
            {removedAssignments.map(renderAssignmentRow)}
          </div>
        </details>
      )}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Add Crew"
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
                disabled={pendingAddId !== null}
                onClick={async () => {
                  setPendingAddId(e.id);
                  try {
                    await assignCrewMember(load.id, e.id);
                    setSearch("");
                  } finally {
                    setPendingAddId(null);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-manila-dark px-3 py-2.5 text-left transition-colors hover:border-rust/30 hover:bg-rust-soft/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                {pendingAddId === e.id && (
                  <Loader2 className="h-4 w-4 flex-none animate-spin text-steel" />
                )}
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

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title="Remove crew member"
        body={`${removeTargetName} will be removed from this load. Their worked time up to now is kept for payroll.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() =>
          removeTarget ? removeCrewMember(load.id, removeTarget.id) : undefined
        }
      />
    </div>
  );
}
