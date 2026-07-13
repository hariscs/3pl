"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AppDataProvider } from "./store";

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session (created lazily in state so it is
  // stable across re-renders).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The dashboard's data changes rarely; don't refetch on every mount.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppDataProvider>{children}</AppDataProvider>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
