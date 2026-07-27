"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: "sm" | "md" | "lg";
  children: ReactNode;
};

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-xl",
} as const;

export function SidekickPanel({
  open,
  onClose,
  title,
  width = "md",
  children,
}: Props) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40 w-full bg-ink/30 transition-opacity"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        aria-label="Close panel"
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full ${widthClasses[width]} flex-col border-l border-manila-dark bg-cream shadow-xl transition-transform`}
      >
        {/* Header */}
        <div className="flex flex-none items-center justify-between border-b border-manila-dark px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}
