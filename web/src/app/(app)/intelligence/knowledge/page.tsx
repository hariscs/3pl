"use client";

import { ArrowLeft, Plus, Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { AddKnowledgeModal } from "@/components/intelligence/AddKnowledgeModal";
import { KnowledgeCard } from "@/components/intelligence/KnowledgeCard";
import { KnowledgeDetailPanel } from "@/components/intelligence/KnowledgeDetailPanel";
import {
  type KnowledgeItem,
  MOCK_KNOWLEDGE_ITEMS,
} from "@/lib/mocks/mockKnowledgeItems";

const CATEGORIES = [
  "All",
  "Company",
  "Employees",
  "Operations",
  "Locations",
  "Payroll & Billing",
  "Customer SOPs",
] as const;

export default function KnowledgeHubPage() {
  const [items, setItems] = useState<KnowledgeItem[]>(MOCK_KNOWLEDGE_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const filtered = items.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.owner.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  function getCategoryCount(category: string): number {
    if (category === "All") return items.length;
    return items.filter((item) => item.category === category).length;
  }

  function handleSave(newItem: KnowledgeItem) {
    setItems((prev) => [newItem, ...prev]);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <Link
          href="/"
          className="-ml-2 mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-steel transition-colors duration-150 hover:bg-manila hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to Portal
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="intel-page-title">AI Knowledge Hub</h1>
            <p className="mt-2 intel-body-secondary mr-32">
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

        {/* Search */}
        <div className="relative mt-6 max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel-light"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full rounded-xl border border-manila-dark bg-cream py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-steel-light outline-none transition-all duration-200 focus:border-rust/30 focus:ring-2 focus:ring-rust/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-steel-light transition-colors hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category pills with counts */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? "bg-rust-soft/60 text-rust-dark"
                    : "text-steel hover:bg-manila hover:text-ink"
                }`}
              >
                {cat}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    active
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

        {/* Knowledge grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles size={28} className="text-steel/30" />
            <p className="mt-3 text-sm text-steel/60">
              {search.trim()
                ? `No knowledge items match "${search}".`
                : "No knowledge items in this category yet."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="h-full"
                >
                  <KnowledgeCard item={item} onClick={setSelectedItem} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AddKnowledgeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <KnowledgeDetailPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
