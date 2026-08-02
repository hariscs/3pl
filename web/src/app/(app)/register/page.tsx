"use client";

import { UserCog } from "lucide-react";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { type Column, FilterableTable } from "@/components/FilterableTable";
import { UserForm, type UserFormValues } from "@/components/forms/UserForm";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";
import type { SystemUser } from "@/lib/types";
import {
  describeUserAccess,
  getUserDisplayName,
  ROLE_KEYS,
  ROLE_LABELS,
} from "@/lib/users";

function toFormValues(user: SystemUser): UserFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    locationIds: user.locationIds,
    customerId: user.customerId,
    linkedCrewMemberId: user.linkedCrewMemberId,
    password: "",
  };
}

export default function RegisterUserPage() {
  const {
    locations,
    customers,
    users,
    addUser,
    updateUser,
    toggleUserArchive,
    isLoading,
    isError,
    retry,
  } = useAppData();
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    archiving: boolean;
  } | null>(null);

  function customerName(id: string): string {
    return customers.find((c) => c.id === id)?.displayName ?? "—";
  }

  async function handleSubmit(values: UserFormValues) {
    const displayName = `${values.firstName} ${values.lastName}`.trim();
    const ok = editingUser
      ? await updateUser(editingUser.id, values)
      : await addUser(values);
    if (!ok) return;
    setJustSaved(displayName);
    setEditingUser(null);
  }

  const userColumns: Column<SystemUser>[] = [
    { key: "name", header: "Name", accessor: (u) => getUserDisplayName(u) },
    { key: "email", header: "Email", accessor: (u) => u.email },
    {
      key: "role",
      header: "Role",
      accessor: (u) => ROLE_LABELS[u.role],
      filter: "select",
      filterOptions: ROLE_KEYS.map((k) => ROLE_LABELS[k]),
    },
    {
      key: "access",
      header: "Access",
      accessor: (u) =>
        describeUserAccess(u, locations, customerName(u.customerId ?? "")),
      render: (u) => (
        <span className="block max-w-72">
          {describeUserAccess(u, locations, customerName(u.customerId ?? ""))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (u) => u.status,
      filter: "select",
      filterOptions: ["active", "archived"],
      render: (u) => <StampBadge status={u.status} />,
    },
    {
      key: "actions",
      header: "",
      accessor: () => "",
      filterable: false,
      sortable: false,
      render: (u) => (
        <ActionsMenu
          label={`${getUserDisplayName(u)} actions`}
          actions={[
            { label: "Edit", onSelect: () => setEditingUser(u) },
            {
              label: u.status === "active" ? "Archive" : "Restore",
              danger: u.status === "active",
              onSelect: () =>
                setPending({
                  id: u.id,
                  name: getUserDisplayName(u),
                  archiving: u.status === "active",
                }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <TopBar
        title="Register User"
        description="Access is scoped by role — admin/finance see every location, manager/lead are scoped to the locations you assign, customer accounts are scoped to their customer, and employee accounts have no location at all (that comes from clock-in later)."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title={
              editingUser
                ? `Edit ${getUserDisplayName(editingUser)}`
                : "New user"
            }
            action={
              editingUser && (
                <Button variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancel edit
                </Button>
              )
            }
          >
            <UserForm
              key={editingUser?.id ?? "new"}
              mode={editingUser ? "edit" : "create"}
              userRecordId={editingUser?.id}
              initial={editingUser ? toFormValues(editingUser) : undefined}
              submitLabel={editingUser ? "Save changes" : "Create user"}
              onSubmit={handleSubmit}
            />
          </Card>

          {justSaved && (
            <output
              aria-live="polite"
              className="block rounded-lg border border-freight bg-freight-soft px-4 py-3 text-sm text-freight-dark"
            >
              <span className="font-semibold">{justSaved}</span> was saved.
            </output>
          )}

          <Card title="Existing users">
            <FilterableTable
              columns={userColumns}
              rows={users}
              getRowKey={(u) => u.id}
              defaultFilterKeys={["role"]}
              isLoading={isLoading}
              isError={isError}
              onRetry={retry}
              emptyIcon={UserCog}
              emptyTitle="No users yet"
              emptyDescription="Use the form above to register the first dashboard login."
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.archiving ? "Archive user" : "Restore user"}
        body={
          pending?.archiving
            ? `${pending?.name} will no longer be able to sign in.`
            : `${pending?.name} will be able to sign in again.`
        }
        confirmLabel={pending?.archiving ? "Archive" : "Restore"}
        variant={pending?.archiving ? "danger" : "primary"}
        onConfirm={() => (pending ? toggleUserArchive(pending.id) : undefined)}
      />
    </>
  );
}
