"use client";

import Link from "next/link";
import { AdminOnly } from "@/components/AdminOnly";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAppData } from "@/lib/store";
import type { Location } from "@/lib/types";

function WarehouseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
      <path d="M6 18h12" />
      <path d="M6 14h12" />
      <rect width="12" height="12" x="6" y="10" />
    </svg>
  );
}

function addressLine(l: Location) {
  return [
    l.addressL1,
    [l.city, l.state].filter(Boolean).join(", "),
    l.postalCode,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function LocationsPage() {
  const { locations } = useAppData();

  return (
    <>
      <TopBar
        title="Locations"
        description="Warehouses your crews check into. Create and edit sites here."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <div className="mb-4 flex justify-end">
            <Link href="/locations/new">
              <Button>New location</Button>
            </Link>
          </div>
          {locations.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {locations.map((l) => (
                <Link
                  key={l.id}
                  href={`/locations/${l.id}`}
                  className="flex items-start gap-4 rounded-2xl border border-manila-dark bg-cream p-4 shadow-card transition-colors hover:border-rust/40"
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-rust-soft text-rust">
                    <WarehouseIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-ink">
                        {l.name}
                      </p>
                      <StatusPill
                        tone={l.status === "active" ? "success" : "muted"}
                      >
                        {l.status}
                      </StatusPill>
                    </div>
                    <p className="mt-0.5 text-sm text-steel">
                      {[l.code, l.region].filter(Boolean).join(" · ")}
                    </p>
                    {addressLine(l) ? (
                      <p className="mt-1 truncate text-xs text-steel-light">
                        {addressLine(l)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-steel-light">
                      Shift {l.shiftStart}–{l.shiftEnd}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-steel">
                No locations yet. Create your first one.
              </p>
            </Card>
          )}
        </main>
      </AdminOnly>
    </>
  );
}
