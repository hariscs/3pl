"use client";

import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/AdminOnly";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export default function NewCustomerPage() {
  const { addCustomer } = useAppData();
  const router = useRouter();

  return (
    <>
      <TopBar
        title="New customer"
        description="Create the billing entity first — locations and product types attach to it next."
      />
      <AdminOnly>
        <main className="flex-1 p-6">
          <Card title="Customer details">
            <CustomerForm
              submitLabel="Create customer"
              onSubmit={(values) => {
                addCustomer(values);
                router.push("/customers");
              }}
            />
          </Card>
        </main>
      </AdminOnly>
    </>
  );
}
