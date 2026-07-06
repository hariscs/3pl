"use client";

import { useRouter } from "next/navigation";
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
        title="New employee"
        description="Employees only appear in load pickers for the location they're assigned to."
      />
      <main className="flex-1 p-6">
        <Card title="Employee details">
          <EmployeeForm
            submitLabel="Create employee"
            onSubmit={(values) => {
              addEmployee(values);
              router.push("/employees");
            }}
          />
        </Card>
      </main>
    </>
  );
}
