import type { ReactNode } from "react";

type Tone = "success" | "muted" | "warning" | "danger" | "info";

const tones: Record<Tone, { dot: string; text: string; bg: string }> = {
  success: { dot: "bg-freight", text: "text-freight", bg: "bg-freight-soft" },
  muted: { dot: "bg-steel", text: "text-steel", bg: "bg-paper-dim" },
  warning: { dot: "bg-amber", text: "text-amber", bg: "bg-amber-soft" },
  danger: { dot: "bg-stamp", text: "text-stamp", bg: "bg-stamp-soft" },
  info: { dot: "bg-rust", text: "text-rust", bg: "bg-rust-soft" },
};

export function StatusPill({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${t.bg} ${t.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  );
}
