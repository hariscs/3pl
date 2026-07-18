"use client";

import { useParams, useRouter } from "next/navigation";
import { AdminOnly } from "@/components/AdminOnly";
import { LocationForm } from "@/components/forms/LocationForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function EditLocationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locations, updateLocation } = useAppData();

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

  return (
    <>
      <TopBar
        title={`Edit ${location.name}`}
        description="Update the site's details, address, and shift window."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card title="Location details">
            <LocationForm
              initial={{
                name: location.name,
                region: location.region,
                code: location.code ?? "",
                group: location.group ?? "",
                addressL1: location.addressL1 ?? "",
                city: location.city ?? "",
                state: location.state ?? "",
                postalCode: location.postalCode ?? "",
                timezone: location.timezone,
                status: location.status,
                shiftStart: location.shiftStart,
                shiftEnd: location.shiftEnd,
              }}
              submitLabel="Save changes"
              onSubmit={(values) => {
                updateLocation(location.id, values);
                router.push("/locations");
              }}
            />
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
