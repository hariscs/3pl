import type { LoadStatus, RecordStatus } from "@/lib/types";

type Stampable = RecordStatus | LoadStatus;

const config: Record<Stampable, { label: string; color: string }> = {
  active: { label: "Active", color: "text-rust" },
  archived: { label: "Archived", color: "text-steel" },
  complete: { label: "Complete", color: "text-freight" },
  void: { label: "Void", color: "text-stamp" },
};

export function StampBadge({ status }: { status: Stampable }) {
  const { label, color } = config[status];
  return (
    <span
      className={`ink-stamp inline-block px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${color}`}
    >
      {label}
    </span>
  );
}
