import Link from "next/link";

export function SectionHeader({
  title,
  actionLabel,
  href,
  onAction,
  className = "",
}: {
  title: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
}) {
  const actionClass =
    "inline-flex items-center gap-0.5 text-sm font-semibold text-rust transition-colors hover:text-rust-dark";
  return (
    <div className={`mb-3 flex items-center justify-between ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-steel">
        {title}
      </p>
      {actionLabel && href ? (
        <Link href={href} className={actionClass}>
          {actionLabel}
          <span aria-hidden>›</span>
        </Link>
      ) : actionLabel ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
          <span aria-hidden>›</span>
        </button>
      ) : null}
    </div>
  );
}
