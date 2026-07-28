"use client";

import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import {
  MOCK_KNOWLEDGE_ITEMS,
  type KnowledgeItem,
} from "@/lib/mocks/mockKnowledgeItems";
import { AddKnowledgeModal } from "@/components/intelligence/AddKnowledgeModal";

const CATEGORIES = [
  "All",
  "Company",
  "Employees",
  "Operations",
  "Locations",
  "Payroll & Billing",
  "Customer SOPs",
] as const;

const STATUS_CLASSES: Record<string, string> = {
  Published: "bg-freight-soft text-freight-dark",
  Draft: "bg-amber-soft text-amber",
  "Needs Review": "bg-stamp-soft text-stamp",
};

function KnowledgeCard({
  title,
  type,
  status,
  owner,
  lastReviewedAt,
  description,
}: KnowledgeItem) {
  return (
    <div className="rounded-xl border border-manila-dark bg-cream p-5 transition-all duration-150 hover:border-rust/20 hover:shadow-[0_2px_12px_-4px_rgba(37,99,235,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-steel line-clamp-2">
            {description}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[status] ?? "bg-manila text-steel"}`}
        >
          {status}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-steel/80">
        <span>{type}</span>
        <span>·</span>
        <span>{owner}</span>
        <span>·</span>
        <span>Reviewed {lastReviewedAt}</span>
      </div>
    </div>
  );
}

export default function KnowledgeHubPage() {
  const [items, setItems] = useState<KnowledgeItem[]>(MOCK_KNOWLEDGE_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered =
    activeCategory === "All"
      ? items
      : items.filter((item) => item.category === activeCategory);

  function getCategoryCount(category: string): number {
    if (category === "All") return items.length;
    return items.filter((item) => item.category === category).length;
  }

  function handleSave(newItem: KnowledgeItem) {
    setItems((prev) => [newItem, ...prev]);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="intel-page-title">AI Knowledge Hub</h1>
            <p className="mt-1.5 intel-body-secondary">
              Centralize the company information, policies, procedures, and
              reference materials used by 3PL Intelligence.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="intel-button-text flex shrink-0 items-center gap-2 rounded-xl bg-rust px-4 py-2.5 text-cream transition-all duration-200 hover:bg-rust-dark hover:shadow-[0_4px_16px_-4px_var(--color-rust)/0.4] active:scale-[0.99]"
          >
            <Plus size={15} />
            Add Knowledge
          </button>
        </div>

        {/* Category pills with counts */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-150 ${active
                    ? "bg-rust-soft/60 text-rust-dark"
                    : "text-steel hover:bg-manila hover:text-ink"
                  }`}
              >
                {cat}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${active
                      ? "bg-rust-soft text-rust-dark"
                      : "bg-manila-dark/60 text-steel"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Knowledge list */}
        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Sparkles size={28} className="text-steel/30" />
              <p className="mt-3 text-sm text-steel/60">
                No knowledge items in this category yet.
              </p>
            </div>
          ) : (
            filtered.map((item) => <KnowledgeCard key={item.id} {...item} />)
          )}
        </div>
      </div>

      <AddKnowledgeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
