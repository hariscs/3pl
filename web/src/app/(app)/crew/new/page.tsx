"use client";

import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/AdminOnly";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
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
        description="Crew members only appear in load pickers for the location they're assigned to."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card title="Crew details">
            <EmployeeForm
              submitLabel="Create crew member"
              onSubmit={(values) => {
                addEmployee(values);
                router.push("/crew");
              }}
            />
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
