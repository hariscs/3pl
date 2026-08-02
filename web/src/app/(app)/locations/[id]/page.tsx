"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { LocationForm } from "@/components/forms/LocationForm";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function EditLocationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locations, updateLocation, toggleLocationArchive } = useAppData();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const location = locations.find((l) => l.id === id);

  if (!location) {
    return (
      <>
        <TopBar title="Location not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This location doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  const archiving = location.status !== "archived";

  return (
    <>
      <TopBar
        title={`Edit ${location.name}`}
        description="Update the site's details, address, site contact, and operational settings."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title="Location details"
            action={
              <div className="flex items-center gap-3">
                <StampBadge status={location.status} />
                <Button
                  variant={archiving ? "danger" : "secondary"}
                  onClick={() => setConfirmArchive(true)}
                >
                  {archiving ? "Archive" : "Restore"}
                </Button>
              </div>
            }
          >
            <LocationForm
              key={location.status}
              locationRecordId={location.id}
              initial={{
                name: location.name,
                customerId: location.customerId,
                region: location.region,
                code: location.code ?? "",
                group: location.group ?? "",
                addressL1: location.addressL1 ?? "",
                city: location.city ?? "",
                state: location.state ?? "",
                postalCode: location.postalCode ?? "",
                country: location.country ?? "",
                timezone: location.timezone,
                notes: location.notes,
                siteContact: location.siteContact,
                status: location.status,
                shiftStart: location.shiftStart,
                shiftEnd: location.shiftEnd,
              }}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                const ok = await updateLocation(location.id, values);
                if (!ok) return;
                router.push("/locations");
              }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={archiving ? "Archive location" : "Restore location"}
        body={
          archiving
            ? `${location.name} will be hidden from operational selection lists (clock-in, load creation), but its history stays intact.`
            : `${location.name} will reappear in operational selection lists across the app.`
        }
        confirmLabel={archiving ? "Archive" : "Restore"}
        variant={archiving ? "danger" : "primary"}
        onConfirm={() => toggleLocationArchive(location.id)}
      />
    </>
  );
}
