"use client";

import {
  CheckCircle,
  ChevronDown,
  Circle,
  FileSearch,
  FileText,
  Image,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Evidence } from "@/lib/intelligence";

function EvidenceSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-manila-dark/50 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-rust-soft/25"
      >
        <span className="flex items-center gap-2">
          <h4 className="text-[13px] font-semibold text-ink">{title}</h4>
          <span className="rounded-full bg-rust-soft px-1.5 py-0.5 text-[10px] font-semibold text-rust-dark">
            {count}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`text-steel transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rust-soft/70">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink/85">{title}</p>
        {subtitle && <p className="truncate text-xs text-steel">{subtitle}</p>}
      </div>
    </div>
  );
}

type Props = {
  evidence: Evidence | null;
  onClose: () => void;
  originatingQuestion?: string;
};

export function EvidencePanel({
  evidence,
  onClose,
  originatingQuestion,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-col gap-1.5 border-b border-manila-dark/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-rust-dark">
            Evidence
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close evidence panel"
            className="rounded-lg p-1.5 text-steel transition-colors hover:bg-manila hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
        {originatingQuestion && (
          <p className="line-clamp-2 text-[13px] leading-snug text-steel">
            For &ldquo;
            <span className="text-ink">{originatingQuestion}</span>
            &rdquo;
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {evidence ? (
          <>
            {evidence.sources.length > 0 && (
              <EvidenceSection
                title="Evidence Sources"
                count={evidence.sources.length}
              >
                <div className="space-y-0.5">
                  {evidence.sources.map((s) => {
                    const Icon =
                      s.status === "available" ? CheckCircle : Circle;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2.5 py-1.5"
                      >
                        <Icon
                          size={14}
                          className={
                            s.status === "available"
                              ? "text-freight-dark"
                              : "text-steel/40"
                          }
                        />
                        <span className="text-[13px] font-medium text-ink/85">
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </EvidenceSection>
            )}

            {evidence.records.length > 0 && (
              <EvidenceSection
                title="Related Records"
                count={evidence.records.length}
                defaultOpen={false}
              >
                <div className="space-y-0.5">
                  {evidence.records.map((r) => (
                    <InfoRow
                      key={r.id}
                      icon={<FileText size={12} className="text-rust-dark" />}
                      title={r.title}
                      subtitle={r.subtitle}
                    />
                  ))}
                </div>
              </EvidenceSection>
            )}

            {evidence.documents.length > 0 && (
              <EvidenceSection
                title="Documents"
                count={evidence.documents.length}
                defaultOpen={false}
              >
                <div className="space-y-0.5">
                  {evidence.documents.map((d) => (
                    <InfoRow
                      key={d.id}
                      icon={<FileText size={12} className="text-rust-dark" />}
                      title={d.name}
                    />
                  ))}
                </div>
              </EvidenceSection>
            )}

            {evidence.attachments.length > 0 && (
              <EvidenceSection
                title="Attachments"
                count={evidence.attachments.length}
                defaultOpen={false}
              >
                <div className="space-y-0.5">
                  {evidence.attachments.map((a) => {
                    const isImage =
                      a.fileType === "jpg" || a.fileType === "png";
                    return (
                      <InfoRow
                        key={a.id}
                        icon={
                          isImage ? (
                            <Image size={12} className="text-rust-dark" />
                          ) : (
                            <FileText size={12} className="text-rust-dark" />
                          )
                        }
                        title={a.name}
                      />
                    );
                  })}
                </div>
              </EvidenceSection>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rust-soft">
              <FileSearch size={18} className="text-rust" />
            </div>
            <p className="text-sm leading-relaxed text-steel">
              Select a response to view its evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
