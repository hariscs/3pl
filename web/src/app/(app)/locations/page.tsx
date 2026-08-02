"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";
import type { Location } from "@/lib/types";

export default function LocationsPage() {
  const router = useRouter();
  const {
    locations,
    customers,
    toggleLocationArchive,
    isLoading,
    isError,
    retry,
  } = useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.displayName ?? "—";

  const stateOptions = [
    ...new Set(locations.map((l) => l.state).filter((s): s is string => !!s)),
  ].sort();

  const columns: Column<Location>[] = [
    { key: "name", header: "Location Name", accessor: (l) => l.name },
    {
      key: "customer",
      header: "Customer",
      accessor: (l) => customerName(l.customerId),
      filter: "select",
      filterOptions: customers.map((c) => c.displayName),
    },
    { key: "city", header: "City", accessor: (l) => l.city ?? "—" },
    {
      key: "state",
      header: "State",
      accessor: (l) => l.state ?? "—",
      filter: "select",
      filterOptions: stateOptions,
    },
    {
      key: "siteContact",
      header: "Site Contact",
      accessor: (l) => l.siteContact?.name ?? "—",
      render: (l) =>
        l.siteContact?.name ? (
          <>
            {l.siteContact.name}
            {l.siteContact.phone && (
              <>
                <br />
                <span className="text-xs text-steel">
                  {l.siteContact.phone}
                </span>
              </>
            )}
          </>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (l) => l.status,
      filter: "select",
      filterOptions: ["active", "inactive", "archived"],
      render: (l) => <StampBadge status={l.status} />,
    },
    {
      key: "actions",
      header: "",
      accessor: () => "",
      filterable: false,
      sortable: false,
      render: (l) => (
        <ActionsMenu
          label={`${l.name} actions`}
          actions={[
            {
              label: "Edit",
              onSelect: () => router.push(`/locations/${l.id}`),
            },
            {
              label: l.status !== "archived" ? "Archive" : "Restore",
              danger: l.status !== "archived",
              onSelect: () =>
                setPending({
                  id: l.id,
                  name: l.name,
                  archiving: l.status !== "archived",
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Locations"
        description="Operational work sites your crews check into. Create and edit sites here."
      />
      <AdminOnly>
        <main className="flex-1 space-y-4 p-6">
          <div className="flex justify-end">
            <Link href="/locations/new">
              <Button>New location</Button>
            </Link>
          </div>
          <Card>
            <FilterableTable
              columns={columns}
              rows={locations}
              getRowKey={(l) => l.id}
              defaultFilterKeys={["status"]}
              isLoading={isLoading}
              isError={isError}
              onRetry={retry}
              emptyIcon={MapPin}
              emptyTitle="No locations yet"
              emptyDescription="Add the sites your crews check into — loads and clock-ins are tied to a location."
              emptyAction={{ label: "New location", href: "/locations/new" }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.archiving ? "Archive location" : "Restore location"}
        body={
          pending?.archiving
            ? `${pending?.name} will be hidden from operational selection lists (clock-in, load creation), but its history stays intact.`
            : `${pending?.name} will reappear in operational selection lists across the app.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() =>
          pending ? toggleLocationArchive(pending.id) : undefined
        }
      />
    </>
  );
}
