"use client";

import { STATUS_TONE } from "@/components/intelligence/KnowledgeCard";
import { SidekickPanel } from "@/components/ui/SidekickPanel";
import { StatusPill } from "@/components/ui/StatusPill";
import type { KnowledgeItem } from "@/lib/mocks/mockKnowledgeItems";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="intel-overline">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}

export function KnowledgeDetailPanel({
  item,
  onClose,
}: {
  item: KnowledgeItem | null;
  onClose: () => void;
}) {
  return (
    <SidekickPanel
      open={item !== null}
      onClose={onClose}
      title={item?.title ?? "Knowledge item"}
      width="md"
    >
      {item && (
        <div className="space-y-6">
          <StatusPill tone={STATUS_TONE[item.status]}>{item.status}</StatusPill>

          <div>
            <p className="intel-overline">Description</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink/85">
              {item.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-manila-dark bg-paper p-4">
            <DetailField label="Type" value={item.type} />
            <DetailField label="Category" value={item.category} />
            <DetailField label="Owner" value={item.owner} />
            <DetailField label="Effective Date" value={item.effectiveDate} />
            <DetailField label="Last Reviewed" value={item.lastReviewedAt} />
          </div>
        </div>
      )}
    </SidekickPanel>
  );
}
