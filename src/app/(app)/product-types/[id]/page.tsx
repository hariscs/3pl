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

export default function EditProductTypePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { productTypes, updateProductType, toggleProductTypeArchive } =
    useAppData();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const productType = productTypes.find((p) => p.id === id);

  if (!productType) {
    return (
      <>
        <TopBar title="Product type not found" />
        <main className="flex-1 p-6">
          <p className="text-sm text-steel">
            This product type doesn&apos;t exist or was removed.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={`Edit ${productType.name}`}
        description="Adjust the rate card without touching any past loads billed under it."
      />
      <AdminOnly>
        <main className="flex-1 space-y-6 p-6">
          <Card
            title="Product type details"
            action={
              <div className="flex items-center gap-3">
                <StampBadge status={productType.status} />
                <Button
                  variant={
                    productType.status === "active" ? "danger" : "secondary"
                  }
                  onClick={() => setConfirmArchive(true)}
                >
                  {productType.status === "active" ? "Archive" : "Restore"}
                </Button>
              </div>
            }
          >
            <ProductTypeForm
              initial={{
                customerId: productType.customerId,
                locationId: productType.locationId,
                name: productType.name,
                rateLines: productType.rateLines,
              }}
              submitLabel="Save changes"
              onSubmit={(values) => {
                updateProductType(productType.id, values);
                router.push("/product-types");
              }}
            />
          </Card>
        </main>
      </AdminOnly>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title={
          productType.status === "active"
            ? "Archive product type"
            : "Restore product type"
        }
        body={
          productType.status === "active"
            ? `${productType.name} will drop off the load entry picker immediately.`
            : `${productType.name} will reappear in the load entry picker.`
        }
        confirmLabel={productType.status === "active" ? "Archive" : "Restore"}
        variant={productType.status === "active" ? "danger" : "primary"}
        onConfirm={() => toggleProductTypeArchive(productType.id)}
      />
    </>
  );
}
