import Link from "next/link";
import type { ActivityEntry } from "@/lib/dashboard";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-steel">No recent activity yet.</p>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const row = (
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-paper-dim">
            <span className="w-14 flex-none text-xs text-steel-light">
              {formatRelativeTime(entry.time)}
            </span>
            <span className="flex-1 truncate text-ink">{entry.label}</span>
          </div>
        );
        return entry.href ? (
          <Link key={entry.id} href={entry.href}>
            {row}
          </Link>
        ) : (
          <div key={entry.id}>{row}</div>
        );
      })}
    </div>
  );
}
