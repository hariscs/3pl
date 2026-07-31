import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "default" | "warning" | "danger";

const TONE_ICON_CLASSES: Record<Tone, string> = {
  default: "bg-rust-soft text-rust",
  warning: "bg-amber-soft text-amber",
  danger: "bg-stamp-soft text-stamp",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** When set, renders a tone-colored icon chip and switches to a
   * left-aligned layout. Omit to keep the original centered tile. */
  icon?: LucideIcon;
  /** When set, the whole card becomes a link (used for Dashboard tiles that
   * deep-link into a filtered list). */
  href?: string;
  tone?: Tone;
}) {
  const content = Icon ? (
    <div className="flex items-start gap-3 rounded-2xl border border-manila-dark bg-cream p-4 shadow-card transition-colors">
      <div
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${TONE_ICON_CLASSES[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-steel">
          {label}
        </p>
        {hint ? <p className="mt-1 text-xs text-steel-light">{hint}</p> : null}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center rounded-2xl border border-manila-dark bg-cream p-5 text-center shadow-card">
      <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-steel">
        {label}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-steel-light">{hint}</p> : null}
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
