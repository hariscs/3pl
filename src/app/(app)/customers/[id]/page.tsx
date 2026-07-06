"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { customers, updateCustomer, toggleCustomerArchive } = useAppData();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <>
        <TopBar title="Customer not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This customer doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={`Edit ${customer.displayName}`}
        description="Update any field below — the same fields captured at registration."
      />
      <main className="flex-1 space-y-6 p-6">
        <Card
          title="Customer details"
          action={
            <div className="flex items-center gap-3">
              <StampBadge status={customer.status} />
              <Button
                variant={customer.status === "active" ? "danger" : "secondary"}
                onClick={() => setConfirmArchive(true)}
              >
                {customer.status === "active" ? "Archive" : "Restore"}
              </Button>
            </div>
          }
        >
          <CustomerForm
            initial={{
              contactName: customer.contactName,
              email: customer.email,
              phone: customer.phone,
              displayName: customer.displayName,
              legalCompanyName: customer.legalCompanyName,
              locationIds: customer.locationIds,
            }}
            submitLabel="Save changes"
            onSubmit={(values) => {
              updateCustomer(customer.id, values);
              router.push("/customers");
            }}
          />
        </Card>
      </main>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={
          customer.status === "active" ? "Archive customer" : "Restore customer"
        }
        body={
          customer.status === "active"
            ? `${customer.displayName} will be hidden from active pickers, but every past load and invoice stays in your reports.`
            : `${customer.displayName} will reappear in customer pickers across the app.`
        }
        confirmLabel={customer.status === "active" ? "Archive" : "Restore"}
        variant={customer.status === "active" ? "danger" : "primary"}
        onConfirm={() => toggleCustomerArchive(customer.id)}
      />
    </>
  );
}
