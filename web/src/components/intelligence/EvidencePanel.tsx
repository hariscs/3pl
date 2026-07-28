"use client";

import { useState } from "react";
import {
  X,
  ChevronDown,
  FileText,
  Image,
  CheckCircle,
  Circle,
} from "lucide-react";
import type { Evidence } from "@/lib/intelligence";

function EvidenceSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-manila-dark/50 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-manila/30"
      >
        <h4 className="text-[13px] font-semibold text-ink/80">{title}</h4>
        <ChevronDown
          size={14}
          className={`text-steel transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="px-5 pb-3">{children}</div>}
    </div>
  );
}

type Props = {
  evidence: Evidence | null;
  onClose: () => void;
};

export function EvidencePanel({ evidence, onClose }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-3.5">
        <h3 className="intel-overline">Evidence</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-steel transition-colors hover:bg-manila hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {evidence ? (
          <>
            {evidence.sources.length > 0 && (
              <EvidenceSection title="Evidence Sources">
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
                        <span className="text-[13px] text-steel">
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </EvidenceSection>
            )}

            {evidence.records.length > 0 && (
              <EvidenceSection title="Related Records" defaultOpen={false}>
                <div className="space-y-0.5">
                  {evidence.records.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2.5 py-1.5"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-manila-dark/60">
                        <FileText size={11} className="text-steel" />
                      </div>
                      <div>
                        <p className="text-[13px] text-steel">{r.title}</p>
                        <p className="text-xs text-steel-light">{r.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </EvidenceSection>
            )}

            {evidence.documents.length > 0 && (
              <EvidenceSection title="Documents" defaultOpen={false}>
                <div className="space-y-0.5">
                  {evidence.documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2.5 py-1.5"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-manila-dark/60">
                        <FileText size={11} className="text-steel" />
                      </div>
                      <span className="text-[13px] text-steel underline decoration-steel/30 underline-offset-2">
                        {d.name}
                      </span>
                    </div>
                  ))}
                </div>
              </EvidenceSection>
            )}

            {evidence.attachments.length > 0 && (
              <EvidenceSection title="Attachments" defaultOpen={false}>
                <div className="space-y-0.5">
                  {evidence.attachments.map((a) => {
                    const isImage =
                      a.fileType === "jpg" || a.fileType === "png";
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-2.5 py-1.5"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-manila-dark/60">
                          {isImage ? (
                            <Image size={11} className="text-steel" />
                          ) : (
                            <FileText size={11} className="text-steel" />
                          )}
                        </div>
                        <span className="text-[13px] text-steel underline decoration-steel/30 underline-offset-2">
                          {a.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </EvidenceSection>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
            <p className="text-sm leading-relaxed text-steel/60">
              Select a response to view its evidence.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-manila-dark/50 px-5 py-3">
        <p className="text-xs text-steel/50">
          {evidence ? "Evidence loaded" : "No evidence to display"}
        </p>
      </div>
    </div>
  );
}
