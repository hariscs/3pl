"use client";

import { X, FileText, BarChart3, Image, Package } from "lucide-react";

type Props = {
  onClose: () => void;
};

const SLOTS = [
  { icon: FileText, label: "Records" },
  { icon: BarChart3, label: "Charts" },
  { icon: Image, label: "Documents" },
  { icon: Package, label: "Data" },
] as const;

export function ContextPanel({ onClose }: Props) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <h3 className="intel-overline">Evidence</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Placeholder slots — communicates what will appear */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-12">
        <div className="mb-8 grid w-full grid-cols-2 gap-3">
          {SLOTS.map((slot) => {
            const Icon = slot.icon;
            return (
              <div
                key={slot.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-manila-dark/70 bg-cream/50 px-4 py-5 transition-all duration-200 hover:border-rust/20 hover:bg-cream"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-manila/50">
                  <Icon size={18} className="text-steel-light" />
                </div>
                <p className="text-xs font-medium text-steel">{slot.label}</p>
              </div>
            );
          })}
        </div>

        <p className="max-w-50 text-center text-[13px] leading-relaxed text-steel/60">
          Warehouse records, charts, and operational data will appear here while
          you work.
        </p>
      </div>
    </div>
  );
}
