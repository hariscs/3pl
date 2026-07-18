"use client";

import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/AdminOnly";
import { LocationForm } from "@/components/forms/LocationForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function NewLocationPage() {
  const { addLocation } = useAppData();
  const router = useRouter();

  return (
    <>
      <TopBar
        title="New location"
        description="Add a warehouse site your crews can check into."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card title="Location details">
            <LocationForm
              submitLabel="Create location"
              onSubmit={(values) => {
                addLocation(values);
                router.push("/locations");
              }}
            />
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
