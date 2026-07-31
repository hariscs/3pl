"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
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
  const { customers, locations, updateCustomer, toggleCustomerArchive } =
    useAppData();
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

  const archiving = customer.status !== "archived";
  const linkedLocations = locations.filter((l) => l.customerId === customer.id);

  return (
    <>
      <TopBar
        title={`Edit ${customer.displayName}`}
        description="Update any field below — the same fields captured at registration."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title="Customer details"
            action={
              <div className="flex items-center gap-3">
                <StampBadge status={customer.status} />
                <Button
                  variant={archiving ? "danger" : "secondary"}
                  onClick={() => setConfirmArchive(true)}
                >
                  {archiving ? "Archive" : "Restore"}
                </Button>
              </div>
            }
          >
            <CustomerForm
              key={customer.status}
              customerRecordId={customer.id}
              initial={{
                displayName: customer.displayName,
                code: customer.code,
                legalCompanyName: customer.legalCompanyName,
                status: customer.status,
                industry: customer.industry,
                website: customer.website,
                taxId: customer.taxId,
                contactName: customer.contactName,
                contactTitle: customer.contactTitle,
                email: customer.email,
                phone: customer.phone,
                billingEmail: customer.billingEmail,
                paymentTerms: customer.paymentTerms,
                notes: customer.notes,
              }}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                await updateCustomer(customer.id, values);
                router.push("/customers");
              }}
            />
          </Card>

          <Card title="Locations">
            {linkedLocations.length > 0 ? (
              <ul className="divide-y divide-manila-dark">
                {linkedLocations.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/locations/${l.id}`}
                        className="text-sm font-medium text-ink hover:text-rust"
                      >
                        {l.name}
                      </Link>
                      <p className="truncate text-xs text-steel">
                        {[l.city, l.state].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                    <StampBadge status={l.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-steel">
                No locations linked to this customer yet.
              </p>
            )}
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={archiving ? "Archive customer" : "Restore customer"}
        body={
          archiving
            ? `${customer.displayName} will be hidden from active pickers, but every past load and invoice stays in your reports.`
            : `${customer.displayName} will reappear in customer pickers across the app.`
        }
        confirmLabel={archiving ? "Archive" : "Restore"}
        variant={archiving ? "danger" : "primary"}
        onConfirm={() => toggleCustomerArchive(customer.id)}
      />
    </>
  );
}
