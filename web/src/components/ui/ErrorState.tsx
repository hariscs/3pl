import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "./Button";

export function RetryButton({
  onRetry,
  loading = false,
  label = "Try again",
}: {
  onRetry: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <Button variant="secondary" onClick={onRetry} loading={loading}>
      {!loading && <RefreshCw className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retrying = false,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stamp-soft">
        <TriangleAlert className="h-5 w-5 text-stamp" />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-steel">{message}</p>
      </div>
      {onRetry && (
        <div className="mt-1">
          <RetryButton onRetry={onRetry} loading={retrying} />
        </div>
      )}
    </div>
  );
}
