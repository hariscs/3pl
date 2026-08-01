import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ActivityEntry } from "@/lib/dashboard";

const VISIBLE_COUNT = 6;

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
      <p className="py-6 text-center text-sm text-steel">
        No recent activity yet.
      </p>
    );
  }

  const visible = entries.slice(0, VISIBLE_COUNT);
  const rest = entries.slice(VISIBLE_COUNT);

  return (
    <div className="space-y-1">
      {visible.map((entry) => (
        <ActivityRow key={entry.id} entry={entry} />
      ))}
      {rest.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2 py-2 text-xs font-semibold text-steel">
            <span>{rest.length} more</span>
            <ChevronDown className="h-3.5 w-3.5 text-steel-light transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-1">
            {rest.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const rowClass =
    "flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-paper-dim";
  const content = (
    <>
      <span className="w-14 flex-none text-xs text-steel-light">
        {formatRelativeTime(entry.time)}
      </span>
      <span className="flex-1 truncate text-ink">{entry.label}</span>
    </>
  );
  if (entry.href) {
    return (
      <Link href={entry.href} className={rowClass}>
        {content}
      </Link>
    );
  }
  return <div className={rowClass}>{content}</div>;
}
