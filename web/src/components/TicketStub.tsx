import Link from "next/link";
import type { ReactNode } from "react";
import type { LoadStatus } from "@/lib/types";
import { StampBadge } from "./StampBadge";

export function TicketStub({
  ticketNumber,
  status,
  date,
  href,
  eyebrow,
  title,
  fields,
  actions,
}: {
  ticketNumber: number;
  status: LoadStatus;
  date: string;
  href?: string;
  eyebrow: string;
  title: string;
  fields: { label: string; value: ReactNode }[];
  actions?: ReactNode;
}) {
  const Wrapper = href ? Link : "div";
  return (
    <div className="flex overflow-hidden rounded-md border border-manila-dark bg-paper-dim/50">
      <div className="stub-perforation flex w-20 flex-none flex-col items-center justify-center gap-1 border-r-2 border-dashed border-manila-dark bg-manila py-4">
        <span className="font-display text-[10px] uppercase tracking-widest text-steel">
          Ticket
        </span>
        <span className="font-tick text-lg font-semibold text-ink">
          #{ticketNumber}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs uppercase tracking-wider text-steel">
              {eyebrow}
            </span>
            <span className="text-xs text-steel-light">{date}</span>
          </div>
          {href ? (
            <Wrapper
              href={href}
              className="font-display text-base font-semibold text-ink hover:text-rust"
            >
              {title}
            </Wrapper>
          ) : (
            <p className="font-display text-base font-semibold text-ink">
              {title}
            </p>
          )}
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-[11px] uppercase tracking-wide text-steel-light">
                  {f.label}
                </dt>
                <dd className="font-tick text-sm text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-none items-center gap-3">
          <StampBadge status={status} />
          {actions}
        </div>
      </div>
    </div>
  );
}
