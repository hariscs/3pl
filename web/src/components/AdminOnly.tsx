"use client";

import type { ReactNode } from "react";
import { PermissionDenied } from "@/components/ui/PermissionDenied";
import { useAppData } from "@/lib/store";

export function AdminOnly({ children }: { children: ReactNode }) {
  const { role } = useAppData();

  if (role !== "admin") {
    return (
      <PermissionDenied
        title="Admin only"
        description="Leads only have access to Load Entry and Loads. Sign in with an admin account to see this screen."
        backHref="/loads"
        backLabel="Go to Loads"
      />
    );
  }

  return <>{children}</>;
}
