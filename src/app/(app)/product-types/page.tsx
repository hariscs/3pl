"use client";

import Link from "next/link";
import { useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function ProductTypesPage() {
  const { productTypes, customers, locations, toggleProductTypeArchive } =
    useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.displayName ?? "—";
  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  return (
    <>
      <TopBar
        title="Product Types"
        description="Each product type belongs to one customer and one location, so load entry only shows what's relevant."
      />
      <main className="flex-1 p-6">
        <Card
          title={`${productTypes.length} product types`}
          action={
            <Link href="/product-types/new">
              <Button>New product type</Button>
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-manila-dark text-left font-display text-xs uppercase tracking-wide text-steel">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Units billed</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productTypes.map((p) => (
                  <tr key={p.id} className="border-b border-manila-dark/60">
                    <td className="py-2 pr-4 font-medium text-ink">{p.name}</td>
                    <td className="py-2 pr-4 text-ink">
                      {customerName(p.customerId)}
                    </td>
                    <td className="py-2 pr-4 text-ink">
                      {locationName(p.locationId)}
                    </td>
                    <td className="py-2 pr-4 text-steel">
                      {p.rateLines.map((l) => l.unit).join(", ")}
                    </td>
                    <td className="py-2 pr-4">
                      <StampBadge status={p.status} />
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/product-types/${p.id}`}>
                          <Button variant="secondary">Edit</Button>
                        </Link>
                        <Button
                          variant={
                            p.status === "active" ? "danger" : "secondary"
                          }
                          onClick={() =>
                            setPending({
                              id: p.id,
                              name: p.name,
                              archiving: p.status === "active",
                            })
                          }
                        >
                          {p.status === "active" ? "Archive" : "Restore"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={
          pending?.archiving ? "Archive product type" : "Restore product type"
        }
        body={
          pending?.archiving
            ? `${pending?.name} will drop off the load entry picker immediately.`
            : `${pending?.name} will reappear in the load entry picker.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleProductTypeArchive(pending.id)}
      />
    </>
  );
}
