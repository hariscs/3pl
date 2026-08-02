"use client";

import { Users } from "lucide-react";
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
import { StatusPill } from "@/components/ui/StatusPill";
import { formatMoney } from "@/lib/billing";
import { getEmployeeDisplayName } from "@/lib/crew";
import { useAppData } from "@/lib/store";
import {
  CREW_CATEGORY_KEYS,
  CREW_CATEGORY_LABELS,
  type Employee,
} from "@/lib/types";

export default function EmployeesPage() {
  const router = useRouter();
  const { employees, toggleEmployeeArchive, isLoading, isError, retry } =
    useAppData();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (e) => getEmployeeDisplayName(e),
    },
    {
      key: "employeeId",
      header: "Employee ID",
      accessor: (e) => e.employeeId,
    },
    {
      key: "contact",
      header: "Contact",
      accessor: (e) => `${e.email ?? ""} ${e.phone}`,
      render: (e) => (
        <>
          {e.email ?? <span className="text-steel-light">—</span>}
          <br />
          <span className="text-xs text-steel">{e.phone}</span>
        </>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (e) => (e.category ? CREW_CATEGORY_LABELS[e.category] : "—"),
      filter: "select",
      filterOptions: CREW_CATEGORY_KEYS.map((k) => CREW_CATEGORY_LABELS[k]),
      render: (e) =>
        e.category ? (
          <StatusPill tone="muted">
            {CREW_CATEGORY_LABELS[e.category]}
          </StatusPill>
        ) : (
          <span className="text-steel-light">—</span>
        ),
    },
    {
      key: "hourlyRate",
      header: "Hourly Rate",
      accessor: (e) => e.hourlyRate,
      align: "right",
      render: (e) => formatMoney(e.hourlyRate),
    },
    {
      key: "employmentStatus",
      header: "Status",
      accessor: (e) => e.employmentStatus,
      filter: "select",
      filterOptions: ["active", "inactive", "archived"],
      render: (e) => <StampBadge status={e.employmentStatus} />,
    },
    {
      key: "actions",
      header: "",
      accessor: () => "",
      filterable: false,
      sortable: false,
      render: (e) => {
        const isArchived = e.employmentStatus === "archived";
        return (
          <ActionsMenu
            label={`${getEmployeeDisplayName(e)} actions`}
            actions={[
              { label: "Edit", onSelect: () => router.push(`/crew/${e.id}`) },
              {
                label: isArchived ? "Restore" : "Archive",
                danger: !isArchived,
                onSelect: () =>
                  setPending({
                    id: e.id,
                    name: getEmployeeDisplayName(e),
                    archiving: !isArchived,
                  }),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <TopBar
        title="Crew"
        description="Archive a crew member to remove them from load pickers without losing their payout history."
      />
      <AdminOnly>
        <main className="flex-1 space-y-4 p-6">
          <div className="flex justify-end">
            <Link href="/crew/new">
              <Button>New crew member</Button>
            </Link>
          </div>
          <Card>
            <FilterableTable
              columns={columns}
              rows={employees}
              getRowKey={(e) => e.id}
              defaultFilterKeys={["employmentStatus"]}
              isLoading={isLoading}
              isError={isError}
              onRetry={retry}
              emptyIcon={Users}
              emptyTitle="No crew members yet"
              emptyDescription="Add crew members so they can be assigned to loads and clocked in."
              emptyAction={{ label: "New crew member", href: "/crew/new" }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={
          pending?.archiving ? "Archive crew member" : "Restore crew member"
        }
        body={
          pending?.archiving
            ? `${pending?.name} will drop out of the load crew picker, but past payout records stay intact.`
            : `${pending?.name} will reappear in the load crew picker.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() =>
          pending ? toggleEmployeeArchive(pending.id) : undefined
        }
      />
    </>
  );
}
