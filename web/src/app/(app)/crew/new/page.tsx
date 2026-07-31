"use client";

import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/AdminOnly";
import { CrewMemberForm } from "@/components/forms/CrewMemberForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function NewEmployeePage() {
  const { addEmployee } = useAppData();
  const router = useRouter();

  return (
    <>
      <TopBar
        title="New crew member"
        description="Add a crew member's profile, employment, pay, skills, certifications, and training records."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card title="Crew details">
            <CrewMemberForm
              mode="create"
              submitLabel="Create crew member"
              onSubmit={async (values) => {
                await addEmployee(values);
                router.push("/crew");
              }}
            />
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
