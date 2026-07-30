"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit3,
  FileText,
  Image,
  Paperclip,
  RotateCcw,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAppData } from "@/lib/store";

// ── helpers ──

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtTimeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function calcHours(clockIn: string, clockOut: string | null): string {
  if (!clockOut) return "—";
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const mins = outH * 60 + outM - (inH * 60 + inM);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// ── Activity timeline (static per load, realistic) ──

type ActivityEntry = {
  time: string;
  description: string;
  detail?: string;
};

function getActivityForLoad(
  loadId: string,
  loadDate: string,
  assignments: {
    employeeId: string;
    clockIn: string;
    clockOut: string | null;
  }[],
): ActivityEntry[] {
  const baseDate = loadDate;
  const emps = assignments;
  // Generate a plausible timeline per load based on data
  if (loadId === "load-208") {
    return [
      {
        time: `${baseDate}T09:00:00`,
        description: "Load created",
        detail: "Ticket #208 opened",
      },
      { time: `${baseDate}T09:02:00`, description: "Ana Ortiz clocked in" },
    ];
  }
  if (loadId === "load-211") {
    return [
      {
        time: `${baseDate}T06:30:00`,
        description: "Load created",
        detail: "Ticket #211 opened",
      },
      { time: `${baseDate}T06:30:00`, description: "Trevon Hicks clocked in" },
      {
        time: `${baseDate}T08:15:00`,
        description: "Cases updated",
        detail: "0 → 1120",
      },
      {
        time: `${baseDate}T09:10:00`,
        description: "Sorts updated",
        detail: "0 → 2",
      },
      { time: `${baseDate}T11:10:00`, description: "Trevon Hicks clocked out" },
      {
        time: `${baseDate}T11:10:00`,
        description: "Load voided",
        detail: "Ticket #211 voided",
      },
    ];
  }
  if (loadId === "load-206") {
    return [
      {
        time: `${baseDate}T06:00:00`,
        description: "Load created",
        detail: "Ticket #206 opened",
      },
      { time: `${baseDate}T06:00:00`, description: "Marcus Bell clocked in" },
      {
        time: `${baseDate}T07:30:00`,
        description: "Cases updated",
        detail: "0 → 1800",
      },
      {
        time: `${baseDate}T09:45:00`,
        description: "Cases updated",
        detail: "1800 → 2650",
      },
      {
        time: `${baseDate}T10:00:00`,
        description: "Sorts updated",
        detail: "0 → 5",
      },
      {
        time: `${baseDate}T10:30:00`,
        description: "Container number updated",
        detail: "— → OLCU 990011",
      },
      { time: `${baseDate}T12:30:00`, description: "Marcus Bell clocked out" },
      { time: `${baseDate}T12:31:00`, description: "Load completed" },
      { time: `${baseDate}T14:00:00`, description: "Load archived" },
    ];
  }
  // Default for completed loads (195, 200, 204, 212)
  const employeeLines = emps.flatMap((e) => [
    {
      time: `${baseDate}T${e.clockIn}:00`,
      description: `${e.employeeId === "emp-1" ? "Marcus Bell" : e.employeeId === "emp-2" ? "Ana Ortiz" : e.employeeId === "emp-3" ? "Trevon Hicks" : e.employeeId === "emp-4" ? "Grace Lin" : e.employeeId === "emp-5" ? "Devon Marsh" : "Priya Nair"} clocked in`,
    },
    ...(e.clockOut
      ? [
          {
            time: `${baseDate}T${e.clockOut}:00`,
            description: `${e.employeeId === "emp-1" ? "Marcus Bell" : e.employeeId === "emp-2" ? "Ana Ortiz" : e.employeeId === "emp-3" ? "Trevon Hicks" : e.employeeId === "emp-4" ? "Grace Lin" : e.employeeId === "emp-5" ? "Devon Marsh" : "Priya Nair"} clocked out`,
          },
        ]
      : []),
  ]);
  return [
    {
      time: `${baseDate}T${emps[0]?.clockIn ?? "07:00"}:00`,
      description: "Load created",
    },
    ...employeeLines,
    {
      time: `${baseDate}T${emps[emps.length - 1]?.clockOut ?? "16:00"}:00`,
      description: "Load completed",
    },
  ];
}

// ── Attachments (by load) ──

type Attachment = { name: string; type: string; size: string };

const ATTACHMENTS: Record<string, Attachment[]> = {
  "load-195": [
    { name: "BOL-195.pdf", type: "Bill of Lading", size: "245 KB" },
    {
      name: "container-TCLU884321.jpg",
      type: "Container Photo",
      size: "1.2 MB",
    },
    { name: "seal-SL88213.jpg", type: "Seal Photo", size: "890 KB" },
  ],
  "load-200": [
    { name: "BOL-200.pdf", type: "Bill of Lading", size: "198 KB" },
    { name: "damage-pallet-3.jpg", type: "Damage Photo", size: "2.1 MB" },
    { name: "delivery-receipt.pdf", type: "Delivery Receipt", size: "312 KB" },
  ],
  "load-212": [
    { name: "BOL-212.pdf", type: "Bill of Lading", size: "267 KB" },
    {
      name: "container-MSCU782193.jpg",
      type: "Container Photo",
      size: "1.5 MB",
    },
    {
      name: "container-MSCU782193-2.jpg",
      type: "Container Photo",
      size: "1.3 MB",
    },
    { name: "damage-carton.jpg", type: "Damage Photo", size: "3.4 MB" },
    { name: "seal-SL472190.jpg", type: "Seal Photo", size: "920 KB" },
    { name: "signed-delivery.pdf", type: "Signed Document", size: "156 KB" },
  ],
  "load-206": [{ name: "BOL-206.pdf", type: "Bill of Lading", size: "234 KB" }],
};

// ── Notes ──

type Note = { id: string; text: string; author: string; createdAt: string };

const INITIAL_NOTES: Record<string, Note[]> = {
  "load-195": [
    {
      id: "n1",
      text: "Frozen goods — unloaded immediately into cold storage.",
      author: "Rick Alvarez",
      createdAt: "2026-07-01T15:00:00Z",
    },
    {
      id: "n2",
      text: "Two damaged cartons found on pallet 4. Photos attached.",
      author: "Marcus Bell",
      createdAt: "2026-07-01T15:30:00Z",
    },
  ],
  "load-212": [
    {
      id: "n1",
      text: "Frozen product. Priority unload. Seal verified at gate before opening.",
      author: "Rick Alvarez",
      createdAt: "2026-07-05T08:00:00Z",
    },
    {
      id: "n2",
      text: "One damaged pallet (pallet #7). Photos attached. Carrier notified.",
      author: "Devon Marsh",
      createdAt: "2026-07-05T10:15:00Z",
    },
    {
      id: "n3",
      text: "All product accounted for. Load closed.",
      author: "Priya Nair",
      createdAt: "2026-07-05T16:10:00Z",
    },
  ],
  "load-200": [
    {
      id: "n1",
      text: "Solar panels — handle with care. All panels inspected and clear.",
      author: "Grace Lin",
      createdAt: "2026-07-02T15:30:00Z",
    },
  ],
};

// ── Page ──

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    loads,
    customers,
    productTypes,
    employees,
    locations,
    role,
    updateLoad,
    voidLoad,
    archiveLoad,
    isLoading,
  } = useAppData();

  const load = loads.find((l) => l.id === id);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [saving, setSaving] = useState(false);

  const [quantities, setQuantities] = useState(() => ({
    sorts: load?.sorts ?? 0,
    cases: load?.cases ?? 0,
    weight: load?.weight ?? 0,
  }));

  const [notes, setNotes] = useState<Note[]>(() =>
    load ? (INITIAL_NOTES[load.id] ?? []) : [],
  );
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

  const availableEmployees = useMemo(() => {
    if (!load) return [];
    const assignedIds = new Set(load.assignments.map((a) => a.employeeId));
    return employees.filter(
      (e) =>
        e.status === "active" &&
        e.locationId === load.locationId &&
        !assignedIds.has(e.id),
    );
  }, [employees, load]);

  const activity = useMemo(
    () =>
      load ? getActivityForLoad(load.id, load.date, load.assignments) : [],
    [load],
  );
  const attachments = useMemo(
    () => (load ? (ATTACHMENTS[load.id] ?? []) : []),
    [load],
  );

  const crewHours = useMemo(() => {
    if (!load) return 0;
    return (
      load.assignments.reduce((sum, a) => {
        if (!a.clockOut) return sum;
        const [inH, inM] = a.clockIn.split(":").map(Number);
        const [outH, outM] = a.clockOut.split(":").map(Number);
        return sum + (outH * 60 + outM - (inH * 60 + inM));
      }, 0) / 60
    );
  }, [load]);

  const crewCount = load?.assignments.length ?? 0;
  const completedCrew = load?.assignments.filter((a) => a.clockOut).length ?? 0;
  const stillWorking = crewCount - completedCrew;

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

  const canManage = role === "admin";
  const isEditable = load.status === "active";

  async function handleSave() {
    if (!load) return;
    setSaving(true);
    await updateLoad(load.id, { ...quantities });
    setSaving(false);
  }

  async function handleComplete() {
    if (!load) return;
    const allClockedOut =
      load.assignments.length > 0 &&
      load.assignments.every((a) => a.clockOut !== null);
    await updateLoad(load.id, {
      ...quantities,
      status: allClockedOut ? "complete" : load.status,
    });
    setConfirmComplete(false);
  }

  function addEmployee() {
    if (!selectedEmployeeId || !load) return;
    updateLoad(load.id, {
      assignments: [
        ...load.assignments,
        { employeeId: selectedEmployeeId, clockIn: nowTime(), clockOut: null },
      ],
    });
    setSelectedEmployeeId("");
  }

  function clockOut(employeeId: string) {
    if (!load) return;
    updateLoad(load.id, {
      assignments: load.assignments.map((a) =>
        a.employeeId === employeeId ? { ...a, clockOut: nowTime() } : a,
      ),
    });
  }

  function addNote() {
    if (!newNote.trim()) return;
    setNotes((prev) => [
      ...prev,
      {
        id: `n${Date.now()}`,
        text: newNote.trim(),
        author: "You",
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewNote("");
  }

  function saveNoteEdit(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: editNoteText } : n)),
    );
    setEditingNoteId(null);
    setEditNoteText("");
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  // ── crew completion status ──
  const allCrewDone =
    load.assignments.length > 0 && load.assignments.every((a) => a.clockOut);
  const avgCasesPerEmployee =
    crewCount > 0 ? Math.round(load.cases / crewCount) : 0;
  const avgCasesPerHour =
    crewHours > 0 ? Math.round(load.cases / crewHours) : 0;

  return (
    <>
      <TopBar
        title={`Load #${load.ticketNumber}`}
        description={`${customer?.displayName ?? "—"} · ${productType?.name ?? "—"} · ${location?.name ?? "—"}`}
      />

      <main className="flex-1 space-y-4 p-6">
        {/* ── Back link ── */}
        <Link
          href="/loads"
          className="inline-flex items-center gap-1.5 py-1 text-sm text-steel transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to loads
        </Link>

        {/* ── Operational status banner ── */}
        {load.status === "void" && (
          <div className="flex items-center gap-2 rounded-lg border border-stamp/30 bg-stamp-soft px-4 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-stamp" />
            <span className="text-stamp">
              This load has been voided and is excluded from all downstream
              processing.
            </span>
          </div>
        )}
        {load.status === "active" && !allCrewDone && (
          <div className="flex items-center gap-2 rounded-lg border border-amber/30 bg-amber-soft px-4 py-3 text-sm">
            <Clock className="h-4 w-4 text-amber" />
            <span className="text-amber">
              {stillWorking} of {crewCount} crew{" "}
              {stillWorking === 1 ? "member is" : "members are"} still working.
            </span>
          </div>
        )}
        {load.status === "archived" && (
          <div className="flex items-center gap-2 rounded-lg border border-manila-dark bg-paper-dim px-4 py-3 text-sm">
            <span className="text-steel">This load has been archived.</span>
          </div>
        )}

        {/* ── Page header card ── */}
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center rounded-lg border border-manila-dark bg-paper-dim px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-steel">
                  Ticket
                </span>
                <span className="mt-0.5 font-tick text-xl font-semibold text-ink">
                  #{load.ticketNumber}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <StampBadge status={load.status} />
                </div>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {customer?.displayName ?? "—"}
                </p>
                <p className="text-sm text-steel">
                  {productType?.name ?? "—"} · {location?.name ?? "—"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-none flex-wrap items-center gap-2">
              {isEditable && (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-3.5 w-3.5" />{" "}
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmComplete(true)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Complete
                  </Button>
                </>
              )}
              {load.status === "complete" && (
                <Button
                  variant="secondary"
                  onClick={() => updateLoad(load.id, { status: "active" })}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reopen
                </Button>
              )}
              {canManage && (
                <ActionsMenu
                  label="More"
                  actions={[
                    {
                      label: "Void load",
                      onSelect: () => setConfirmVoid(true),
                      danger: true,
                    },
                    {
                      label: "Archive",
                      onSelect: () => setConfirmArchive(true),
                      danger: true,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        </Card>

        {/* ── Section 1: Load Information ── */}
        <Card title="Load Information">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <Meta label="Customer" value={customer?.displayName} />
            <Meta label="Product Type" value={productType?.name} />
            <Meta label="Location" value={location?.name} />
            <Meta label="Status">
              <StampBadge status={load.status} />
            </Meta>
            <Meta label="Door" value={load.doorNumber || "—"} />
            <Meta label="Container" value={load.containerNumber || "—"} mono />
            <Meta label="Trailer" value={load.trailerNumber || "—"} mono />
            <Meta label="Seal" value={load.sealNumber || "—"} mono />
            <Meta label="Vendor / Carrier" value={load.vendor || "—"} />
            <Meta
              label="PO Numbers"
              value={load.poNumbers.filter(Boolean).join(", ") || "—"}
              full
            />
            <Meta label="Created Date" value={fmtDate(load.date)} />
            <Meta label="Last Updated" value={fmtTimeAgo(load.lastUpdatedAt)} />
            {(load.status === "complete" ||
              load.status === "archived" ||
              load.status === "void") && (
              <Meta
                label="Duration"
                value={
                  load.assignments.length > 0
                    ? `${calcHours(
                        load.assignments.reduce((earliest, a) =>
                          a.clockIn < earliest.clockIn ? a : earliest,
                        ).clockIn,
                        load.assignments.reduce((latest, a) =>
                          a.clockOut &&
                          (!latest.clockOut || a.clockOut > latest.clockOut)
                            ? a
                            : latest,
                        ).clockOut,
                      )}`
                    : "—"
                }
              />
            )}
          </div>
        </Card>

        {/* ── Section 2: Production Summary ── */}
        <Card title="Production Summary">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCell label="Cases" value={load.cases.toLocaleString()} />
            <StatCell label="Sorts" value={load.sorts.toLocaleString()} />
            <StatCell
              label="Weight"
              value={`${load.weight.toLocaleString()} lbs`}
            />
            <StatCell label="Crew Members" value={`${crewCount}`} />
            <StatCell
              label="Total Crew Hours"
              value={crewHours > 0 ? `${crewHours.toFixed(1)}h` : "—"}
            />
            <StatCell
              label="Avg Cases / Hr"
              value={
                avgCasesPerHour > 0 ? avgCasesPerHour.toLocaleString() : "—"
              }
            />
            <StatCell
              label="Avg Cases / Employee"
              value={
                avgCasesPerEmployee > 0
                  ? avgCasesPerEmployee.toLocaleString()
                  : "—"
              }
            />
            <StatCell label="Crew Completion">
              {allCrewDone ? (
                <StatusPill tone="success">All done</StatusPill>
              ) : (
                <StatusPill tone="warning">
                  {completedCrew}/{crewCount}
                </StatusPill>
              )}
            </StatCell>
          </div>

          {/* Quantities edit (active only) */}
          {isEditable && (
            <div className="mt-4 grid gap-3 border-t border-manila-dark pt-4 sm:grid-cols-3">
              <Field label="Sorts">
                <Input
                  type="number"
                  min="0"
                  value={quantities.sorts}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      sorts: Number(e.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Cases">
                <Input
                  type="number"
                  min="0"
                  value={quantities.cases}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      cases: Number(e.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="Weight (lbs)">
                <Input
                  type="number"
                  min="0"
                  value={quantities.weight}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      weight: Number(e.target.value),
                    }))
                  }
                />
              </Field>
            </div>
          )}
        </Card>

        {/* ── Section 3: Crew Summary ── */}
        <Card title="Crew">
          {load.assignments.length === 0 ? (
            <p className="text-sm text-steel">No crew members assigned yet.</p>
          ) : (
            <div className="divide-y divide-manila-dark/60">
              {load.assignments.map((a) => {
                const emp = employees.find((e) => e.id === a.employeeId);
                const hours = calcHours(a.clockIn, a.clockOut);
                const done = !!a.clockOut;
                return (
                  <div
                    key={a.employeeId}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {emp?.name ?? "Unknown"}
                        </p>
                        {emp?.category && (
                          <StatusPill tone="muted">
                            {emp.category.charAt(0).toUpperCase() +
                              emp.category.slice(1)}
                          </StatusPill>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-steel">
                        ID: {emp?.id ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-tick text-steel">
                        {a.clockIn} → {a.clockOut ?? "—"}
                      </span>
                      <span className="font-tick w-14 text-right text-xs text-steel">
                        {hours}
                      </span>
                      {!done && isEditable && (
                        <Button
                          variant="secondary"
                          onClick={() => clockOut(a.employeeId)}
                        >
                          Clock out
                        </Button>
                      )}
                      {done && <StatusPill tone="success">Complete</StatusPill>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isEditable && (
            <div className="mt-4 flex gap-2 border-t border-manila-dark pt-4">
              <Select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="max-w-xs"
              >
                <option value="">
                  {availableEmployees.length
                    ? "Add crew member…"
                    : "No available crew"}
                </option>
                {availableEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                onClick={addEmployee}
                disabled={!selectedEmployeeId}
              >
                <Users className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          )}
        </Card>

        {/* ── Section 4: Activity Timeline ── */}
        <Card title="Activity Timeline">
          {activity.length === 0 ? (
            <p className="text-sm text-steel">No activity recorded yet.</p>
          ) : (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {activity.map((entry, i) => (
                <div
                  key={`${entry.time}-${entry.description}`}
                  className="flex flex-none items-center gap-1"
                >
                  <div className="flex items-center gap-2 rounded-lg border border-manila-dark bg-cream px-3 py-1.5 text-xs">
                    <span className="font-tick text-steel">
                      {fmtTime(entry.time)}
                    </span>
                    <span className="text-ink">{entry.description}</span>
                  </div>
                  {i < activity.length - 1 && (
                    <span
                      aria-hidden
                      className="flex-none text-xs text-steel-light"
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Section 5: Attachments ── */}
        <Card title="Attachments">
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Paperclip className="h-8 w-8 text-steel-light" />
              <p className="text-sm text-steel">
                No attachments for this load.
              </p>
              <p className="text-xs text-steel-light">
                Photos, BOLs, and delivery documents will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-manila-dark bg-cream px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-rust-soft text-rust">
                    {att.type.includes("Photo") ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {att.name}
                    </p>
                    <p className="text-xs text-steel">
                      {att.type} · {att.size}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Section 6: Notes ── */}
        <Card
          title="Notes"
          action={
            <span className="text-xs text-steel-light">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          }
        >
          {notes.length > 0 && (
            <div className="mb-4 space-y-3">
              {notes.map((note) => (
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
                          {note.author} · {fmtTimeAgo(note.createdAt)}
                        </span>
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
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {notes.length === 0 && (
            <p className="mb-3 text-sm text-steel">No notes yet.</p>
          )}

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
        </Card>
      </main>

      {/* ── Confirm dialogs ── */}
      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Complete load"
        body={`Mark Load #${load.ticketNumber} as complete? This locks the load for reporting.`}
        confirmLabel="Complete"
        variant="primary"
        onConfirm={handleComplete}
      />
      <ConfirmDialog
        open={confirmVoid}
        onClose={() => setConfirmVoid(false)}
        title="Void load"
        body={`Load #${load.ticketNumber} will be excluded from all reporting.`}
        confirmLabel="Void load"
        variant="danger"
        onConfirm={() => {
          voidLoad(load.id);
          router.push("/loads");
        }}
      />
      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Archive load"
        body={`Load #${load.ticketNumber} will be archived.`}
        confirmLabel="Archive"
        variant="primary"
        onConfirm={() => {
          archiveLoad(load.id);
          router.push("/loads");
        }}
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
