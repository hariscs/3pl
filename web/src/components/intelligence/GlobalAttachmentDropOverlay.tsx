"use client";

import { Paperclip } from "lucide-react";

type Props = {
  active: boolean;
};

export function GlobalAttachmentDropOverlay({ active }: Props) {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/65 backdrop-blur-[2px] transition-all duration-200"
      aria-live="polite"
    >
      <div className="animate-global-drop-in flex flex-col items-center gap-5 text-center px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rust shadow-lg shadow-rust/25">
          <Paperclip size={28} className="text-cream" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-cream">
            Add to this conversation
          </h2>
          <p className="text-sm text-cream/70">
            Drop files anywhere to attach them
          </p>
        </div>
      </div>
    </div>
  );
}
