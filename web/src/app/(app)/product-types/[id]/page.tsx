"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminOnly } from "@/components/AdminOnly";
import { ProductTypeForm } from "@/components/forms/ProductTypeForm";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAppData } from "@/lib/store";

export default function EditWorkTypePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { productTypes, updateProductType, toggleProductTypeArchive } =
    useAppData();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const productType = productTypes.find((p) => p.id === id);

  if (!productType) {
    return (
      <>
        <TopBar title="Work type not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This work type doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  const archiving = productType.status !== "archived";

  return (
    <>
      <TopBar
        title={`Edit ${productType.name}`}
        description="Adjust the pay and billing configuration without touching any past loads billed under it."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title="Work type details"
            action={
              <div className="flex items-center gap-3">
                <StampBadge status={productType.status} />
                <Button
                  variant={archiving ? "danger" : "secondary"}
                  onClick={() => setConfirmArchive(true)}
                >
                  {archiving ? "Archive" : "Restore"}
                </Button>
              </div>
            }
          >
            <ProductTypeForm
              key={productType.status}
              workTypeRecordId={productType.id}
              initial={{
                customerId: productType.customerId,
                name: productType.name,
                code: productType.code,
                status: productType.status,
                unitOfMeasure: productType.unitOfMeasure,
                notes: productType.notes,
                employeePayType: productType.employeePayType,
                employeePayRate: productType.employeePayRate,
                customerBillingType: productType.customerBillingType,
                customerBillingRate: productType.customerBillingRate,
              }}
              submitLabel="Save changes"
              onSubmit={async (values) => {
                const ok = await updateProductType(productType.id, values);
                if (!ok) return;
                router.push("/product-types");
              }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={archiving ? "Archive work type" : "Restore work type"}
        body={
          archiving
            ? `${productType.name} will drop off the load entry picker immediately, but past loads keep their billing and pay history.`
            : `${productType.name} will reappear in the load entry picker.`
        }
        confirmLabel={archiving ? "Archive" : "Restore"}
        variant={archiving ? "danger" : "primary"}
        onConfirm={() => toggleProductTypeArchive(productType.id)}
      />
    </>
  );
}
