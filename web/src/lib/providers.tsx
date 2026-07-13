"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth";

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

  // AppDataProvider (which fetches the protected datasets) lives inside the
  // authenticated app shell, so public pages like /login don't trigger it.
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
