"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { CrewMemberForm } from "@/components/forms/CrewMemberForm";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getEmployeeDisplayName } from "@/lib/crew";
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
        <TopBar title="Crew member not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This crew member doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  const displayName = getEmployeeDisplayName(employee);
  // Archive/Restore is a dedicated action, kept separate from ordinary field
  // edits — it only ever moves between "active" and "archived". "inactive"
  // is reachable solely through the form's Employment Status field.
  const isArchived = employee.employmentStatus === "archived";

  return (
    <>
      <TopBar
        title={`Edit ${displayName}`}
        description="Update profile, employment, pay, skills, certifications, and training records."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title="Crew details"
            action={
              <div className="flex items-center gap-3">
                <StampBadge status={employee.employmentStatus} />
                <Button
                  variant={isArchived ? "secondary" : "danger"}
                  onClick={() => setConfirmArchive(true)}
                >
                  {isArchived ? "Restore" : "Archive"}
                </Button>
              </div>
            }
          >
            <CrewMemberForm
              mode="edit"
              employeeRecordId={employee.id}
              initial={{
                employeeId: employee.employeeId,
                firstName: employee.firstName,
                lastName: employee.lastName,
                preferredName: employee.preferredName,
                profilePhotoUrl: employee.profilePhotoUrl,
                phone: employee.phone,
                email: employee.email,
                address: employee.address,
                emergencyContact: employee.emergencyContact,
                employmentStatus: employee.employmentStatus,
                hireDate: employee.hireDate,
                employmentType: employee.employmentType,
                category: employee.category,
                notes: employee.notes,
                payType: employee.payType,
                hourlyRate: employee.hourlyRate,
                productionPayEligible: employee.productionPayEligible,
                skillIds: employee.skillIds,
                certifications: employee.certifications,
                trainingRecords: employee.trainingRecords,
              }}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                await updateEmployee(employee.id, values);
                router.push("/crew");
              }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={isArchived ? "Restore crew member" : "Archive crew member"}
        body={
          isArchived
            ? `${displayName} will reappear in the load crew picker.`
            : `${displayName} will drop out of the load crew picker, but past payout records stay intact.`
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        variant={isArchived ? "primary" : "danger"}
        onConfirm={() => toggleEmployeeArchive(employee.id)}
      />
    </>
  );
}
