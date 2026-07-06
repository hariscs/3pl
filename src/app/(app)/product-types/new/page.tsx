"use client";

import { useRouter } from "next/navigation";
import { ProductTypeForm } from "@/components/forms/ProductTypeForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function NewProductTypePage() {
  const { addProductType } = useAppData();
  const router = useRouter();

  return (
    <>
      <TopBar
        title="New product type"
        description="Choose the customer first, then the location — the product name only makes sense in that context."
      />
      <main className="flex-1 p-6">
        <Card title="Product type details">
          <ProductTypeForm
            submitLabel="Create product type"
            onSubmit={(values) => {
              addProductType(values);
              router.push("/product-types");
            }}
          />
        </Card>
      </main>
    </>
  );
}
