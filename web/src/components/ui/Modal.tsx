"use client";

import type { ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
};

export function Modal({
  open,
  onClose,
  title,
  size = "sm",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: Size;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        className={`animate-global-drop-in relative z-10 flex max-h-[90vh] w-full ${SIZE_CLASSES[size]} flex-col overflow-hidden rounded-2xl border border-manila-dark bg-paper shadow-xl`}
      >
        <div className="flex flex-none items-center justify-between border-b border-manila-dark px-5 py-3.5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-colors hover:bg-paper-dim hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex-none border-t border-manila-dark px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
