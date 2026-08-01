import { AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  ATTENTION_CATEGORY_LABELS,
  type AttentionCategory,
  type AttentionItem,
} from "@/lib/dashboard";

const CATEGORY_ORDER: AttentionCategory[] = [
  "operations",
  "workforce",
  "payroll",
  "billing",
  "compliance",
];

// Categories past this size start collapsed — a 30+ item "Operations" group
// was forcing a lot of scrolling before a user could reach anything below it.
const COLLAPSE_THRESHOLD = 5;

export function AttentionRequiredList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle className="h-6 w-6 text-freight" />
        <p className="text-sm text-ink">
          All caught up — nothing needs attention right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        if (categoryItems.length === 0) return null;
        return (
          <details
            key={category}
            open={categoryItems.length <= COLLAPSE_THRESHOLD}
            className="group rounded-xl border border-manila-dark"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-steel">
              <span>
                {ATTENTION_CATEGORY_LABELS[category]} ({categoryItems.length})
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-steel-light transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-1.5 border-t border-manila-dark p-3">
              {categoryItems.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const tone = item.severity === "blocker" ? "stamp" : "amber";
  const content = (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
        tone === "stamp"
          ? "border-stamp/30 bg-stamp-soft"
          : "border-amber/30 bg-amber-soft"
      }`}
    >
      <AlertTriangle
        className={`mt-0.5 h-3.5 w-3.5 flex-none ${tone === "stamp" ? "text-stamp" : "text-amber"}`}
      />
      <span className={tone === "stamp" ? "text-stamp" : "text-amber"}>
        {item.message}
      </span>
    </div>
  );
  if (!item.href) return content;
  return (
    <Link
      href={item.href}
      className="block transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
}
