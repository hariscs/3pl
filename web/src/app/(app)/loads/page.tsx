"use client";

import Link from "next/link";
import { useState } from "react";
import { TicketStub } from "@/components/TicketStub";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";
import type { Load } from "@/lib/types";

export default function LoadsPage() {
  const {
    loads,
    customers,
    productTypes,
    locations,
    currentLocationId,
    role,
    voidLoad,
    archiveLoad,
  } = useAppData();
  const [confirmVoid, setConfirmVoid] = useState<Load | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Load | null>(null);

  const locationLoads = loads
    .filter((l) => l.locationId === currentLocationId)
    .sort((a, b) => b.ticketNumber - a.ticketNumber);

  const locationName =
    locations.find((l) => l.id === currentLocationId)?.name ?? "";

  return (
    <>
      <TopBar
        title="Loads"
        description={`Active loads at ${locationName}. Every ticket number is visible here — no more screenshotting a load to flag it.`}
      />
      <main className="flex-1 p-6">
        <div className="mb-4 flex justify-end">
          <Link href="/loads/new">
            <Button>Enter a load</Button>
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {locationLoads.length === 0 && (
            <p className="text-sm text-steel">No loads at this location yet.</p>
          )}
          {locationLoads.map((load) => {
            const customer = customers.find((c) => c.id === load.customerId);
            const productType = productTypes.find(
              (p) => p.id === load.productTypeId,
            );
            const canManage = role === "admin";
            return (
              <TicketStub
                key={load.id}
                ticketNumber={load.ticketNumber}
                status={load.status}
                date={load.date}
                href={`/loads/${load.id}`}
                eyebrow={customer?.displayName ?? "Unknown customer"}
                title={productType?.name ?? "Unknown product type"}
                fields={[
                  { label: "Door", value: load.doorNumber || "—" },
                  { label: "Cases", value: load.cases },
                  { label: "Sorts", value: load.sorts },
                  {
                    label: "Billed",
                    value:
                      load.status === "complete"
                        ? `$${load.billedAmount.toFixed(2)}`
                        : "—",
                  },
                ]}
                actions={
                  canManage &&
                  (load.status === "active" || load.status === "complete") ? (
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        onClick={() => setConfirmVoid(load)}
                      >
                        Void
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmArchive(load)}
                      >
                        Archive
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      </main>

      <ConfirmDialog
        open={confirmVoid !== null}
        onClose={() => setConfirmVoid(null)}
        title="Void load"
        body={`Ticket #${confirmVoid?.ticketNumber} will be pulled out of billing and payout entirely, as if it never happened. This is admin-only.`}
        confirmLabel="Void load"
        variant="danger"
        onConfirm={() => confirmVoid && voidLoad(confirmVoid.id)}
      />
      <ConfirmDialog
        open={confirmArchive !== null}
        onClose={() => setConfirmArchive(null)}
        title="Archive load"
        body={`Ticket #${confirmArchive?.ticketNumber} will be hidden from active lists but its billing and payout history stays in reports.`}
        confirmLabel="Archive load"
        variant="danger"
        onConfirm={() => confirmArchive && archiveLoad(confirmArchive.id)}
      />
    </>
  );
}
