import type {
  CustomerStatus,
  EmploymentStatus,
  LocationStatus,
  ProductTypeStatus,
  RecordStatus,
} from "@/lib/types";

type Stampable =
  | RecordStatus
  | EmploymentStatus
  | LocationStatus
  | CustomerStatus
  | ProductTypeStatus;

const config: Record<Stampable, { label: string; color: string }> = {
  active: { label: "Active", color: "text-rust" },
  inactive: { label: "Inactive", color: "text-amber" },
  archived: { label: "Archived", color: "text-steel" },
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
