"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api/client";
import type { Invoice } from "./invoices";

// Invoices are Dashboard-only consumption today (the Invoice pages fetch
// them independently, with their own retry/error handling) — this mirrors
// use-load-attachments.ts's per-need-fetch pattern rather than widening
// AppDataProvider's core app-boot contract.
export function useInvoices() {
  const query = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get<Invoice[]>("/invoices"),
  });
  return { invoices: query.data ?? [], isLoading: query.isLoading };
}
