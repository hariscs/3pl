import { StatusPill } from "@/components/ui/StatusPill";
import { LOAD_STATUS_LABELS, type LoadStatus } from "@/lib/types";

type Tone = "success" | "muted" | "warning" | "danger" | "info";

const LOAD_STATUS_TONE: Record<LoadStatus, Tone> = {
  draft: "muted",
  scheduled: "info",
  in_progress: "info",
  paused: "warning",
  completed: "success",
  closed: "success",
  cancelled: "danger",
};

/** Load's 7-state lifecycle doesn't fit StampBadge's fixed 2-tone-per-key
 * config — StatusPill's arbitrary label+tone design does. */
export function LoadStatusPill({ status }: { status: LoadStatus }) {
  return (
    <StatusPill tone={LOAD_STATUS_TONE[status]}>
      {LOAD_STATUS_LABELS[status]}
    </StatusPill>
  );
}
