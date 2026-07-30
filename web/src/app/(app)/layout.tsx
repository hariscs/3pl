"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";
import { AppDataProvider } from "@/lib/store";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status } = useAuth();

  // Bounce unauthenticated visitors to the login screen.
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <output
        aria-live="polite"
        className="flex h-dvh items-center justify-center bg-paper text-sm text-steel"
      >
        Loading…
      </output>
    );
  }

  return (
    <AppDataProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </AppDataProvider>
  );
}
