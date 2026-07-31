"use client";

import { useRouter } from "next/navigation";
import { LoadForm } from "@/components/forms/LoadForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function NewLoadPage() {
  const { addLoad } = useAppData();
  const router = useRouter();

  return (
    <>
      <TopBar
        title="New Load"
        description="Customer, Location, and Work Type first — pay and billing configuration follow automatically."
      />
      <main className="flex-1 p-6">
        <Card title="Load details">
          <LoadForm
            submitLabel="Create load"
            onSubmit={async (values) => {
              const created = await addLoad(values);
              if (!created) return;
              router.push(`/loads/${created.id}`);
            }}
          />
        </Card>
      </main>
    </>
  );
}
