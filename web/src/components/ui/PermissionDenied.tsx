import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "./Button";

export function PermissionDenied({
  title = "You don't have access to this page",
  description,
  backHref = "/loads",
  backLabel = "Go to Loads",
}: {
  title?: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper-dim">
          <ShieldAlert className="h-5 w-5 text-steel" />
        </div>
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm text-steel">{description}</p>
        </div>
        <div className="mt-1">
          <Link href={backHref}>
            <Button variant="secondary">{backLabel}</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
