"use client";

import type { ReactNode } from "react";
import { useAppData } from "@/lib/store";

export function AdminOnly({ children }: { children: ReactNode }) {
  const { role } = useAppData();

  if (role !== "admin") {
    return (
      <main className="flex-1 p-6">
        <div className="rounded-md border border-manila-dark bg-manila/40 p-8 text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-steel">
            Admin only
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-steel">
            Leads only have access to Load Entry and Loads. Sign in with an
            admin account to see this screen.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
