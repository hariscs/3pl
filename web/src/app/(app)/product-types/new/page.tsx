"use client";

import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/AdminOnly";
import { ProductTypeForm } from "@/components/forms/ProductTypeForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function NewWorkTypePage() {
  const { addProductType } = useAppData();
  const router = useRouter();

  return (
    <>
      <TopBar
        title="New work type"
        description="Choose the customer first — the work type's pay and billing rates only make sense in that context."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card title="Work type details">
            <ProductTypeForm
              submitLabel="Create work type"
              onSubmit={async (values) => {
                await addProductType(values);
                router.push("/product-types");
              }}
            />
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
