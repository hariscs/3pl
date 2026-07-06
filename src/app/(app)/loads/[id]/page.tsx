"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { calculateLoadAmounts } from "@/lib/billing";
import { useAppData } from "@/lib/store";

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  } = useAppData();

  const load = loads.find((l) => l.id === id);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [quantities, setQuantities] = useState(() => ({
    sorts: load?.sorts ?? 0,
    cases: load?.cases ?? 0,
    weight: load?.weight ?? 0,
  }));

  const productType = productTypes.find((p) => p.id === load?.productTypeId);
  const customer = customers.find((c) => c.id === load?.customerId);
  const locationName =
    locations.find((l) => l.id === load?.locationId)?.name ?? "";

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

  if (!load) {
    return (
      <>
        <TopBar title="Load not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This load doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  const preview = productType
    ? calculateLoadAmounts(productType.rateLines, quantities)
    : { billed: 0, payout: 0 };

  function saveChanges() {
    if (!load) return;
    const allClockedOut =
      load.assignments.length > 0 &&
      load.assignments.every((a) => a.clockOut !== null);
    updateLoad(load.id, {
      ...quantities,
      billedAmount: preview.billed,
      payoutAmount: preview.payout,
      status: allClockedOut
        ? "complete"
        : load.status === "void" || load.status === "archived"
          ? load.status
          : "active",
    });
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

  const canManage = role === "admin";

  return (
    <>
      <TopBar
        title={`Ticket #${load.ticketNumber}`}
        description={`${customer?.displayName ?? "—"} · ${productType?.name ?? "—"} · ${locationName}`}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <StampBadge status={load.status} />
          {canManage ? (
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => setConfirmVoid(true)}>
                Void load
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmArchive(true)}
              >
                Archive load
              </Button>
            </div>
          ) : (
            <p className="text-xs text-steel-light">
              Only an admin can void or archive a load.
            </p>
          )}
        </div>

        <Card title="Load details">
          <div className="mb-4 grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-light">
                Door
              </p>
              <p className="text-ink">{load.doorNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-light">
                Container / trailer
              </p>
              <p className="text-ink">{load.containerNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-light">
                Vendor
              </p>
              <p className="text-ink">{load.vendor || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-light">
                PO numbers
              </p>
              <p className="text-ink">{load.poNumbers.join(", ") || "—"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Number of sorts">
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
            <Field label="Number of cases">
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

          <div className="mt-4 flex items-center justify-between rounded-md border border-manila-dark bg-manila/40 px-4 py-3">
            <div className="flex gap-6 text-sm">
              <span>
                Billing:{" "}
                <span className="font-tick font-semibold text-rust">
                  ${preview.billed.toFixed(2)}
                </span>
              </span>
              <span>
                Payout:{" "}
                <span className="font-tick font-semibold text-freight">
                  ${preview.payout.toFixed(2)}
                </span>
              </span>
            </div>
            <Button onClick={saveChanges}>Save changes</Button>
          </div>
        </Card>

        <Card title="Employees on this load">
          <div className="mb-4 flex flex-col gap-2">
            {load.assignments.length === 0 && (
              <p className="text-sm text-steel">No employees assigned yet.</p>
            )}
            {load.assignments.map((a) => {
              const emp = employees.find((e) => e.id === a.employeeId);
              return (
                <div
                  key={a.employeeId}
                  className="flex items-center justify-between rounded-sm border border-manila-dark bg-cream px-3 py-2 text-sm"
                >
                  <span className="text-ink">{emp?.name ?? "Unknown"}</span>
                  <span className="font-tick text-steel">
                    In {a.clockIn} —{" "}
                    {a.clockOut ? `Out ${a.clockOut}` : "still clocked in"}
                  </span>
                  {!a.clockOut && (
                    <Button
                      variant="secondary"
                      onClick={() => clockOut(a.employeeId)}
                    >
                      Clock out
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="max-w-xs"
            >
              <option value="">
                {availableEmployees.length
                  ? "Choose an employee…"
                  : "No active employees at this location"}
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
              Add
            </Button>
          </div>
          <p className="mt-2 text-xs text-steel-light">
            Only active employees assigned to {locationName} show up here — no
            scrolling past employees from other sites.
          </p>
        </Card>
      </main>

      <ConfirmDialog
        open={confirmVoid}
        onClose={() => setConfirmVoid(false)}
        title="Void load"
        body={`Ticket #${load.ticketNumber} will be pulled out of billing and payout entirely, as if it never happened.`}
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
        body={`Ticket #${load.ticketNumber} will be hidden from active lists but its history stays in reports.`}
        confirmLabel="Archive load"
        variant="danger"
        onConfirm={() => {
          archiveLoad(load.id);
          router.push("/loads");
        }}
      />
    </>
  );
}
