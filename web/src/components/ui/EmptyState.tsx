import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./Button";

type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper-dim">
        <Icon className="h-5 w-5 text-steel" />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-steel">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex items-center gap-2">
          {action &&
            (action.href ? (
              <Link href={action.href}>
                <Button>{action.label}</Button>
              </Link>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button variant="secondary">{secondaryAction.label}</Button>
              </Link>
            ) : (
              <Button variant="secondary" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
