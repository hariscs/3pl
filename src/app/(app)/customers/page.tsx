"use client";

import Link from "next/link";
import { useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function CustomersPage() {
  const { customers, locations, toggleCustomerArchive } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const locationNames = (ids: string[]) =>
    ids
      .map((id) => locations.find((l) => l.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  return (
    <>
      <TopBar
        title="Customers"
        description="Archive a customer instead of deleting it — their load and billing history stays in reports."
      />
      <main className="flex-1 p-6">
        <Card
          title={`${customers.length} customers`}
          action={
            <Link href="/customers/new">
              <Button>New customer</Button>
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-manila-dark text-left font-display text-xs uppercase tracking-wide text-steel">
                  <th className="py-2 pr-4">Display name</th>
                  <th className="py-2 pr-4">Legal name</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Locations</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-manila-dark/60">
                    <td className="py-2 pr-4 font-medium text-ink">
                      {c.displayName}
                    </td>
                    <td className="py-2 pr-4 text-steel">
                      {c.legalCompanyName}
                    </td>
                    <td className="py-2 pr-4 text-ink">
                      {c.contactName}
                      <br />
                      <span className="text-xs text-steel">{c.email}</span>
                    </td>
                    <td className="py-2 pr-4 text-ink">
                      {locationNames(c.locationIds) || "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <StampBadge status={c.status} />
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="secondary">Edit</Button>
                        </Link>
                        <Button
                          variant={
                            c.status === "active" ? "danger" : "secondary"
                          }
                          onClick={() =>
                            setPending({
                              id: c.id,
                              name: c.displayName,
                              archiving: c.status === "active",
                            })
                          }
                        >
                          {c.status === "active" ? "Archive" : "Restore"}
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
        title={pending?.archiving ? "Archive customer" : "Restore customer"}
        body={
          pending?.archiving
            ? `${pending?.name} will be hidden from active pickers, but every past load and invoice stays in your reports.`
            : `${pending?.name} will reappear in customer pickers across the app.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleCustomerArchive(pending.id)}
      />
    </>
  );
}
