"use client";

import Link from "next/link";
import { useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function EmployeesPage() {
  const { employees, locations, toggleEmployeeArchive } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  return (
    <>
      <TopBar
        title="Employees"
        description="Archive an employee to remove them from load pickers without losing their payout history."
      />
      <main className="flex-1 p-6">
        <Card
          title={`${employees.length} employees`}
          action={
            <Link href="/employees/new">
              <Button>New employee</Button>
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-manila-dark text-left font-display text-xs uppercase tracking-wide text-steel">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Address</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4 text-right">Hourly rate</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-manila-dark/60">
                    <td className="py-2 pr-4 font-medium text-ink">{e.name}</td>
                    <td className="py-2 pr-4 text-ink">
                      {e.email}
                      <br />
                      <span className="text-xs text-steel">{e.phone}</span>
                    </td>
                    <td className="py-2 pr-4 text-steel">{e.address || "—"}</td>
                    <td className="py-2 pr-4 text-ink">
                      {locationName(e.locationId)}
                    </td>
                    <td className="py-2 pr-4 text-right font-tick text-ink">
                      ${e.hourlyRate.toFixed(2)}
                    </td>
                    <td className="py-2 pr-4">
                      <StampBadge status={e.status} />
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/employees/${e.id}`}>
                          <Button variant="secondary">Edit</Button>
                        </Link>
                        <Button
                          variant={
                            e.status === "active" ? "danger" : "secondary"
                          }
                          onClick={() =>
                            setPending({
                              id: e.id,
                              name: e.name,
                              archiving: e.status === "active",
                            })
                          }
                        >
                          {e.status === "active" ? "Archive" : "Restore"}
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
        title={pending?.archiving ? "Archive employee" : "Restore employee"}
        body={
          pending?.archiving
            ? `${pending?.name} will drop out of the load employee picker, but past payout records stay intact.`
            : `${pending?.name} will reappear in the load employee picker.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => pending && toggleEmployeeArchive(pending.id)}
      />
    </>
  );
}
