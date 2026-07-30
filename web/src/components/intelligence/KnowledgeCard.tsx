"use client";

import {
  File,
  FileText,
  ListChecks,
  type LucideIcon,
  ShieldCheck,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { KnowledgeItem } from "@/lib/mocks/mockKnowledgeItems";

export const STATUS_TONE: Record<
  KnowledgeItem["status"],
  "success" | "warning" | "danger"
> = {
  Published: "success",
  Draft: "warning",
  "Needs Review": "danger",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  Document: FileText,
  PDF: File,
  Policy: ShieldCheck,
  Procedure: ListChecks,
  "Plain Text": FileText,
};

export function KnowledgeCard({
  item,
  onClick,
}: {
  item: KnowledgeItem;
  onClick: (item: KnowledgeItem) => void;
}) {
  const Icon = TYPE_ICONS[item.type] ?? FileText;
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="group flex h-full w-full flex-col rounded-xl border border-manila-dark bg-cream p-5 text-left transition-all duration-150 hover:border-rust/25 hover:shadow-[0_4px_20px_-6px_rgba(37,99,235,0.1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-manila text-steel transition-colors duration-150 group-hover:bg-rust-soft/60 group-hover:text-rust-dark">
          <Icon size={16} />
        </div>
        <StatusPill tone={STATUS_TONE[item.status]}>{item.status}</StatusPill>
      </div>
      <h3 className="mt-3.5 text-[15px] font-semibold leading-snug text-ink">
        {item.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-steel">
        {item.description}
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-manila-dark/70 pt-3 text-xs text-steel/80">
        <span className="truncate">{item.type}</span>
        <span className="text-steel-light">·</span>
        <span className="truncate">{item.owner}</span>
        <span className="ml-auto shrink-0 text-steel-light">
          Reviewed {item.lastReviewedAt}
        </span>
      </div>
    </button>
  );
}
