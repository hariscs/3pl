"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Edit3,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { LoadForm } from "@/components/forms/LoadForm";
import { LoadAttachmentsPanel } from "@/components/loads/LoadAttachmentsPanel";
import { LoadCrewPanel } from "@/components/loads/LoadCrewPanel";
import { LoadStatusPill } from "@/components/loads/LoadStatusPill";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Textarea } from "@/components/ui/Field";
import { useAuth } from "@/lib/auth";
import { getEmployeeDisplayName } from "@/lib/crew";
import { getLoadReadiness } from "@/lib/load-readiness";
import { getAssignmentLiveElapsedMinutes, nowHHMM } from "@/lib/load-time";
import { formatLoadNumber } from "@/lib/loads";
import { useAppData } from "@/lib/store";
import {
  EDITABLE_LOAD_STATUSES,
  type Employee,
  type Load,
  type LoadNote,
  type LoadStatus,
  type SystemUser,
  UNIT_OF_MEASURE_LABELS,
  WORK_TYPE_PAY_TYPE_LABELS,
} from "@/lib/types";
import { getUserDisplayName } from "@/lib/users";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTimeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Activity timeline — derived from real assignment/break/status
// timestamps, not per-loadId hardcoded demo data, so it works for every
// load. clockIn/clockOut/breakStart/breakEnd are "HH:MM" local to the
// load's own date; lifecycle fields are already full ISO timestamps.

type ActivityEntry = { time: string; label: string };

function buildLoadActivity(
  load: Load,
  employees: Employee[],
  users: SystemUser[],
): ActivityEntry[] {
  const employeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? getEmployeeDisplayName(employee) : "Unknown crew member";
  };
  const userName = (userId: string | null) => {
    if (!userId) return "system";
    const found = users.find((u) => u.id === userId);
    return found ? getUserDisplayName(found) : "an unknown user";
  };
  const at = (hhmm: string) => `${load.date}T${hhmm}:00`;

  const entries: ActivityEntry[] = [
    {
      time: load.createdAt,
      label: `Load created by ${userName(load.createdByUserId)}`,
    },
  ];

  for (const a of load.assignments) {
    const name = employeeName(a.employeeId);
    entries.push({
      time: a.assignedAt,
      label: `${name} assigned by ${userName(a.assignedByUserId)}`,
    });
    if (a.clockIn)
      entries.push({ time: at(a.clockIn), label: `${name} clocked in` });
    for (const b of a.breaks) {
      entries.push({
        time: at(b.breakStart),
        label: `${name} started a break`,
      });
      if (b.breakEnd) {
        entries.push({
          time: at(b.breakEnd),
          label: `${name} ended their break`,
        });
      }
    }
    if (a.clockOut) {
      entries.push({ time: at(a.clockOut), label: `${name} clocked out` });
    }
    if (a.status === "removed" && a.removedAt) {
      entries.push({
        time: a.removedAt,
        label: `${name} removed from load${a.removalReason ? ` — ${a.removalReason}` : ""}`,
      });
    }
  }

  if (load.startedAt)
    entries.push({ time: load.startedAt, label: "Load started" });
  if (load.pausedAt)
    entries.push({ time: load.pausedAt, label: "Load paused" });
  if (load.completedAt) {
    entries.push({ time: load.completedAt, label: "Load marked complete" });
  }
  if (load.closedAt) {
    entries.push({
      time: load.closedAt,
      label: `Load closed by ${userName(load.closedByUserId)}`,
    });
  }
  if (load.cancelledAt) {
    entries.push({ time: load.cancelledAt, label: "Load cancelled" });
  }

  return entries.sort((x, y) => x.time.localeCompare(y.time));
}

// ── Header lifecycle actions — explicit allow-list per status, never a
// 2-way ternary (this is a 7-state machine; a ternary would silently
// misrepresent 5 of the 7 states). ──

type HeaderAction =
  | "pause"
  | "resume"
  | "complete"
  | "reopen"
  | "close"
  | "cancel";

const HEADER_ACTIONS: Record<LoadStatus, HeaderAction[]> = {
  draft: ["cancel"],
  scheduled: ["cancel"],
  in_progress: ["pause", "complete", "cancel"],
  paused: ["resume", "complete", "cancel"],
  completed: ["reopen", "close", "cancel"],
  closed: [],
  cancelled: [],
};

// ── Page ──

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    loads,
    customers,
    productTypes,
    locations,
    employees,
    users,
    role,
    isLoading,
    updateLoad,
    pauseLoad,
    resumeLoad,
    completeLoad,
    reopenLoad,
    closeLoad,
    cancelLoad,
  } = useAppData();

  const load = loads.find((l) => l.id === id);

  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  const productType = useMemo(
    () => productTypes.find((p) => p.id === load?.productTypeId),
    [productTypes, load],
  );
  const customer = useMemo(
    () => customers.find((c) => c.id === load?.customerId),
    [customers, load],
  );
  const location = useMemo(
    () => locations.find((l) => l.id === load?.locationId),
    [locations, load],
  );
  const supervisor = useMemo(
    () => users.find((u) => u.id === load?.supervisorUserId),
    [users, load],
  );
  const creator = useMemo(
    () => users.find((u) => u.id === load?.createdByUserId),
    [users, load],
  );
  const closer = useMemo(
    () => users.find((u) => u.id === load?.closedByUserId),
    [users, load],
  );

  const readiness = useMemo(
    () => (load ? getLoadReadiness(load, employees, productType) : null),
    [load, employees, productType],
  );
  const activity = useMemo(
    () => (load ? buildLoadActivity(load, employees, users) : []),
    [load, employees, users],
  );

  const totalCrewHours = useMemo(() => {
    if (!load) return 0;
    const now = nowHHMM();
    return (
      load.assignments
        .filter((a) => a.status !== "removed")
        .reduce((sum, a) => sum + getAssignmentLiveElapsedMinutes(a, now), 0) /
      60
    );
  }, [load]);

  const activeCrewCount =
    load?.assignments.filter((a) => a.status !== "removed").length ?? 0;

  if (isLoading) {
    return (
      <>
        <TopBar title="Load" />
        <main className="flex flex-1 items-center justify-center p-6">
          <output aria-live="polite" className="text-sm text-steel">
            Loading load data…
          </output>
        </main>
      </>
    );
  }

  if (!load) {
    return (
      <>
        <TopBar title="Load not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This load doesn't exist or was removed.
          </p>
        </main>
      </>
    );
  }

  const canOperate = role === "admin" || role === "manager" || role === "lead";
  const canClose = role === "admin" || role === "finance";
  const canCancelOrReopen = role === "admin";
  const isEditableStatus = EDITABLE_LOAD_STATUSES.includes(load.status);
  const formEditable = canOperate && isEditableStatus;
  const crewAndAttachmentsEditable = canOperate && isEditableStatus;
  const notesEditable = canOperate && isEditableStatus;

  const headerActions = HEADER_ACTIONS[load.status].filter((action) => {
    if (action === "close") return canClose;
    if (action === "cancel" || action === "reopen") return canCancelOrReopen;
    return canOperate;
  });

  function addNote() {
    if (!load || !user || !newNote.trim()) return;
    const note: LoadNote = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      authorUserId: user.id,
      createdAt: new Date().toISOString(),
    };
    updateLoad(load.id, { notes: [...load.notes, note] });
    setNewNote("");
  }

  function saveNoteEdit(noteId: string) {
    if (!load) return;
    updateLoad(load.id, {
      notes: load.notes.map((n) =>
        n.id === noteId ? { ...n, text: editNoteText } : n,
      ),
    });
    setEditingNoteId(null);
    setEditNoteText("");
  }

  function deleteNote(noteId: string) {
    if (!load) return;
    updateLoad(load.id, { notes: load.notes.filter((n) => n.id !== noteId) });
  }

  return (
    <>
      <TopBar
        title={formatLoadNumber(load.ticketNumber)}
        description={`${customer?.displayName ?? "—"} · ${productType?.name ?? "—"} · ${location?.name ?? "—"}`}
      />

      <main className="flex-1 space-y-4 p-6">
        <Link
          href="/loads"
          className="inline-flex items-center gap-1.5 py-1 text-sm text-steel transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to loads
        </Link>

        {/* ── Status banners ── */}
        {load.status === "cancelled" && (
          <div className="flex items-center gap-2 rounded-lg border border-stamp/30 bg-stamp-soft px-4 py-3 text-sm">
            <XCircle className="h-4 w-4 text-stamp" />
            <span className="text-stamp">
              This load has been cancelled and is excluded from Payroll,
              Billing, and Invoices.
            </span>
          </div>
        )}
        {load.status === "closed" && (
          <div className="flex items-center gap-2 rounded-lg border border-manila-dark bg-paper-dim px-4 py-3 text-sm">
            <Lock className="h-4 w-4 text-steel" />
            <span className="text-steel">
              This load is closed and read-only — it has been finalized for
              Payroll, Billing, and Invoices.
            </span>
          </div>
        )}
        {readiness?.status === "review" && (
          <div className="space-y-1.5 rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-amber">
              <AlertTriangle className="h-4 w-4" />
              This load isn't ready to complete yet
            </p>
            <ul className="ml-6 list-disc space-y-0.5 text-xs">
              {readiness.issues.map((issue) => (
                <li
                  key={issue.label}
                  className={
                    issue.severity === "blocker" ? "text-stamp" : "text-amber"
                  }
                >
                  {issue.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Header card ── */}
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center rounded-lg border border-manila-dark bg-paper-dim px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-steel">
                  Load Number
                </span>
                <span className="mt-0.5 font-tick text-xl font-semibold text-ink">
                  {formatLoadNumber(load.ticketNumber)}
                </span>
              </div>
              <div>
                <LoadStatusPill status={load.status} />
                <p className="mt-1 text-lg font-semibold text-ink">
                  {customer?.displayName ?? "—"}
                </p>
                <p className="text-sm text-steel">
                  {productType?.name ?? "—"} · {location?.name ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-none flex-wrap items-center gap-2">
              {headerActions.includes("pause") && (
                <Button variant="secondary" onClick={() => pauseLoad(load.id)}>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </Button>
              )}
              {headerActions.includes("resume") && (
                <Button variant="secondary" onClick={() => resumeLoad(load.id)}>
                  <Play className="h-3.5 w-3.5" /> Resume
                </Button>
              )}
              {headerActions.includes("complete") && (
                <Button onClick={() => setConfirmComplete(true)}>
                  <CheckCircle className="h-3.5 w-3.5" /> Complete
                </Button>
              )}
              {headerActions.includes("reopen") && (
                <Button variant="secondary" onClick={() => reopenLoad(load.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reopen
                </Button>
              )}
              {headerActions.includes("close") && (
                <Button onClick={() => setConfirmClose(true)}>
                  <Lock className="h-3.5 w-3.5" /> Close Load
                </Button>
              )}
              {headerActions.includes("cancel") && (
                <ActionsMenu
                  label="More"
                  actions={[
                    {
                      label: "Cancel load",
                      onSelect: () => setConfirmCancel(true),
                      danger: true,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </Card>

        {/* ── Load details: editable form, or a read-only summary once
            the load is locked (or the viewer can't operate it) ── */}
        <Card title="Load Details">
          {formEditable ? (
            <LoadForm
              key={load.status}
              initial={{
                date: load.date,
                locationId: load.locationId,
                customerId: load.customerId,
                productTypeId: load.productTypeId,
                doorNumber: load.doorNumber,
                containerNumber: load.containerNumber,
                trailerNumber: load.trailerNumber,
                sealNumber: load.sealNumber,
                vendor: load.vendor,
                poNumbers: load.poNumbers,
                sorts: load.sorts,
                cases: load.cases,
                weight: load.weight,
                palletCount: load.palletCount,
                pieceCount: load.pieceCount,
                supervisorUserId: load.supervisorUserId,
                operationalNotes: load.operationalNotes,
                scheduledDate: load.scheduledDate,
                scheduledStartTime: load.scheduledStartTime,
              }}
              submitLabel="Save changes"
              onSubmit={(values) => updateLoad(load.id, values)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              <Meta label="Customer" value={customer?.displayName} />
              <Meta label="Work Type" value={productType?.name} />
              <Meta label="Location" value={location?.name} />
              <Meta
                label="Supervisor"
                value={supervisor ? getUserDisplayName(supervisor) : "—"}
              />
              <Meta label="Door" value={load.doorNumber || "—"} />
              <Meta
                label="Container"
                value={load.containerNumber || "—"}
                mono
              />
              <Meta label="Trailer" value={load.trailerNumber || "—"} mono />
              <Meta label="Seal" value={load.sealNumber || "—"} mono />
              <Meta label="Vendor / Carrier" value={load.vendor || "—"} />
              <Meta
                label="PO Numbers"
                value={load.poNumbers.filter(Boolean).join(", ") || "—"}
                full
              />
              {load.scheduledDate && (
                <Meta
                  label="Scheduled"
                  value={`${load.scheduledDate}${load.scheduledStartTime ? ` at ${load.scheduledStartTime}` : ""}`}
                />
              )}
              {load.operationalNotes && (
                <Meta
                  label="Operational Notes"
                  value={load.operationalNotes}
                  full
                />
              )}
              {load.completionNotes && (
                <Meta
                  label="Completion Notes"
                  value={load.completionNotes}
                  full
                />
              )}
            </div>
          )}
        </Card>

        {/* ── Production & Financials ── */}
        <Card title="Production & Financials">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCell label="Cases" value={load.cases.toLocaleString()} />
            <StatCell label="Sorts" value={load.sorts.toLocaleString()} />
            <StatCell
              label="Weight"
              value={`${load.weight.toLocaleString()} lbs`}
            />
            {load.palletCount != null && (
              <StatCell
                label="Pallets"
                value={load.palletCount.toLocaleString()}
              />
            )}
            {load.pieceCount != null && (
              <StatCell
                label="Pieces"
                value={load.pieceCount.toLocaleString()}
              />
            )}
            <StatCell label="Crew Members" value={`${activeCrewCount}`} />
            <StatCell
              label="Total Crew Hours"
              value={totalCrewHours > 0 ? `${totalCrewHours.toFixed(1)}h` : "—"}
            />
            <StatCell
              label="Billed Amount"
              value={`$${load.billedAmount.toFixed(2)}`}
            />
            <StatCell
              label="Payout Amount"
              value={`$${load.payoutAmount.toFixed(2)}`}
            />
          </div>

          <div className="mt-4 rounded-xl border border-manila-dark bg-paper-dim p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
              Pay & Billing Snapshot — captured{" "}
              {new Date(load.paySnapshot.snapshottedAt).toLocaleDateString()}
            </p>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-steel-light">Unit of Measure</p>
                <p className="text-ink">
                  {UNIT_OF_MEASURE_LABELS[load.paySnapshot.unitOfMeasure]}
                </p>
              </div>
              <div>
                <p className="text-xs text-steel-light">Employee Pay</p>
                <p className="text-ink">
                  {WORK_TYPE_PAY_TYPE_LABELS[load.paySnapshot.employeePayType]}{" "}
                  · ${load.paySnapshot.employeePayRate.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-steel-light">Customer Billing</p>
                <p className="text-ink">
                  {
                    WORK_TYPE_PAY_TYPE_LABELS[
                      load.billingSnapshot.customerBillingType
                    ]
                  }{" "}
                  · ${load.billingSnapshot.customerBillingRate.toFixed(2)}
                </p>
              </div>
            </div>
            {(load.status === "closed" || load.status === "cancelled") && (
              <p className="mt-2 text-xs text-steel-light">
                Frozen — these amounts will not change even if this Work Type's
                live rates are updated later.
              </p>
            )}
          </div>
        </Card>

        {/* ── Crew ── */}
        <Card title="Crew">
          <LoadCrewPanel load={load} editable={crewAndAttachmentsEditable} />
        </Card>

        {/* ── Attachments ── */}
        <Card title="Attachments">
          <LoadAttachmentsPanel
            loadId={load.id}
            editable={crewAndAttachmentsEditable}
            source="admin"
          />
        </Card>

        {/* ── Notes ── */}
        <Card
          title="Notes"
          action={
            <span className="text-xs text-steel-light">
              {load.notes.length} {load.notes.length === 1 ? "note" : "notes"}
            </span>
          }
        >
          {load.notes.length > 0 && (
            <div className="mb-4 space-y-3">
              {load.notes.map((note) => {
                const author = users.find((u) => u.id === note.authorUserId);
                return (
                  <div
                    key={note.id}
                    className="rounded-lg border border-manila-dark bg-cream p-3"
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => saveNoteEdit(note.id)}>
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditNoteText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-ink">{note.text}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-steel">
                            {author ? getUserDisplayName(author) : "Unknown"} ·{" "}
                            {fmtTimeAgo(note.createdAt)}
                          </span>
                          {notesEditable && (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditNoteText(note.text);
                                }}
                                aria-label="Edit note"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-colors hover:bg-paper-dim hover:text-ink"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteNote(note.id)}
                                aria-label="Delete note"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-colors hover:bg-stamp-soft hover:text-stamp"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {load.notes.length === 0 && (
            <p className="mb-3 text-sm text-steel">No notes yet.</p>
          )}

          {notesEditable && (
            <div className="flex gap-2 border-t border-manila-dark pt-3">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note…"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNote();
                }}
              />
              <Button onClick={addNote} disabled={!newNote.trim()}>
                Add
              </Button>
            </div>
          )}
        </Card>

        {/* ── Activity Timeline ── */}
        <Card title="Activity Timeline">
          {activity.length === 0 ? (
            <p className="text-sm text-steel">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {activity.map((entry) => (
                <div
                  key={`${entry.time}-${entry.label}`}
                  className="flex items-baseline gap-3 text-sm"
                >
                  <span className="w-32 flex-none font-tick text-xs text-steel">
                    {fmtDateTime(entry.time)}
                  </span>
                  <span className="text-ink">{entry.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Audit Information ── */}
        <Card title="Audit Information">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <Meta
              label="Created By"
              value={creator ? getUserDisplayName(creator) : "—"}
            />
            <Meta label="Created At" value={fmtDateTime(load.createdAt)} />
            <Meta
              label="Supervisor"
              value={supervisor ? getUserDisplayName(supervisor) : "—"}
            />
            <Meta label="Started At" value={fmtDateTime(load.startedAt)} />
            <Meta label="Paused At" value={fmtDateTime(load.pausedAt)} />
            <Meta label="Completed At" value={fmtDateTime(load.completedAt)} />
            <Meta
              label="Closed By"
              value={closer ? getUserDisplayName(closer) : "—"}
            />
            <Meta label="Closed At" value={fmtDateTime(load.closedAt)} />
            <Meta label="Cancelled At" value={fmtDateTime(load.cancelledAt)} />
            <Meta label="Last Updated" value={fmtTimeAgo(load.lastUpdatedAt)} />
          </div>
        </Card>
      </main>

      {/* ── Confirm dialogs ── */}
      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Complete load"
        body={`Mark ${formatLoadNumber(load.ticketNumber)} as complete? Crew clock times and financials will be finalized for review before closing.`}
        confirmLabel="Complete"
        variant="primary"
        onConfirm={() => completeLoad(load.id)}
      />
      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Close load"
        body={`Closing ${formatLoadNumber(load.ticketNumber)} locks it permanently for Payroll, Billing, and Invoices. This cannot be undone from here.`}
        confirmLabel="Close load"
        variant="primary"
        onConfirm={() => closeLoad(load.id)}
      />
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel load"
        body={`${formatLoadNumber(load.ticketNumber)} will be excluded from Payroll and Billing. This cannot be undone.`}
        confirmLabel="Cancel load"
        variant="danger"
        onConfirm={() => cancelLoad(load.id)}
      />
    </>
  );
}

// ── Sub-components ──

function Meta({
  label,
  value,
  mono,
  full,
  children,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  full?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={full ? "col-span-2 sm:col-span-3 lg:col-span-4" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-steel">
        {label}
      </p>
      <div className={`mt-0.5 text-sm text-ink ${mono ? "font-tick" : ""}`}>
        {children ?? (value || "—")}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-manila-dark bg-cream p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-steel">
        {label}
      </p>
      <div className="mt-1">
        {children ?? (
          <p className="text-lg font-semibold text-ink">{value ?? "—"}</p>
        )}
      </div>
    </div>
  );
}
