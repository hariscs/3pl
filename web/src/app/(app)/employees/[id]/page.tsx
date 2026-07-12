"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { employees, updateEmployee, toggleEmployeeArchive } = useAppData();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    return (
      <>
        <TopBar title="Employee not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This employee doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={`Edit ${employee.name}`}
        description="Update contact info, pay rate, or reassign their home location."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title="Employee details"
            action={
              <div className="flex items-center gap-3">
                <StampBadge status={employee.status} />
                <Button
                  variant={
                    employee.status === "active" ? "danger" : "secondary"
                  }
                  onClick={() => setConfirmArchive(true)}
                >
                  {employee.status === "active" ? "Archive" : "Restore"}
                </Button>
              </div>
            }
          >
            <EmployeeForm
              initial={{
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                address: employee.address,
                hourlyRate: employee.hourlyRate,
                locationId: employee.locationId,
              }}
              submitLabel="Save changes"
              onSubmit={(values) => {
                updateEmployee(employee.id, values);
                router.push("/employees");
              }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={
          employee.status === "active" ? "Archive employee" : "Restore employee"
        }
        body={
          employee.status === "active"
            ? `${employee.name} will drop out of the load employee picker, but past payout records stay intact.`
            : `${employee.name} will reappear in the load employee picker.`
        }
        confirmLabel={employee.status === "active" ? "Archive" : "Restore"}
        variant={employee.status === "active" ? "danger" : "primary"}
        onConfirm={() => toggleEmployeeArchive(employee.id)}
      />
    </>
  );
}
