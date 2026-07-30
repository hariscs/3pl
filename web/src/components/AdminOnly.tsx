"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { useAppData } from "@/lib/store";

export function AdminOnly({ children }: { children: ReactNode }) {
  const { role } = useAppData();

  if (role !== "admin") {
    return (
      <main className="flex-1 p-6">
        <Card>
          <div className="py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-steel">
              Admin only
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-steel">
              Leads only have access to Load Entry and Loads. Sign in with an
              admin account to see this screen.
            </p>
          </div>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
