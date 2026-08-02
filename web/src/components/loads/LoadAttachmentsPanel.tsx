"use client";

import { FileText, Paperclip, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useGlobalFileDrop } from "@/components/intelligence/useGlobalFileDrop";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  categorizeAttachmentFile,
  validateLoadAttachmentFile,
} from "@/lib/attachments";
import { useAppData } from "@/lib/store";
import type { LoadAttachment, LoadAttachmentCategory } from "@/lib/types";
import { useLoadAttachments } from "@/lib/use-load-attachments";
import { getUserDisplayName } from "@/lib/users";

type Tab = "all" | "photo" | "video" | "document";

const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  photo: "Photos",
  video: "Videos",
  document: "Documents",
};

const SOURCE_LABELS = { admin: "Admin", field: "Field" } as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Photos, videos, and documents attached to a Load — mounted verbatim on
 * both the Admin detail page and the field view against the same shared
 * repository (lib/load-attachments.ts), so an upload from either surface
 * appears immediately on the other. */
export function LoadAttachmentsPanel({
  loadId,
  editable,
  source,
}: {
  loadId: string;
  editable: boolean;
  source: "admin" | "field";
}) {
  const { users } = useAppData();
  const { attachments, addAttachment, toggleAttachmentArchive } =
    useLoadAttachments(loadId);
  const [tab, setTab] = useState<Tab>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [preview, setPreview] = useState<LoadAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<LoadAttachment | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: File[]) {
    if (!editable) return;
    setUploading(true);
    try {
      for (const file of files) {
        const error = validateLoadAttachmentFile(file);
        if (error) {
          toast.error(error);
          continue;
        }
        const isDuplicate = attachments.some(
          (a) => a.status === "active" && a.fileName === file.name,
        );
        if (isDuplicate) {
          toast.error(`"${file.name}" is already attached to this load.`);
          continue;
        }
        const category = categorizeAttachmentFile(
          file,
        ) as LoadAttachmentCategory;
        const fileUrl = URL.createObjectURL(file);
        await addAttachment({
          fileName: file.name,
          category,
          mimeType: file.type,
          sizeBytes: file.size,
          fileUrl,
          thumbnailUrl: category === "photo" ? fileUrl : undefined,
          source,
        });
      }
    } finally {
      setUploading(false);
    }
  }

  const isDragActive = useGlobalFileDrop({
    onDropFiles: (files) => {
      if (editable) handleFiles(files);
    },
  });

  const visible = attachments.filter((a) =>
    showArchived ? a.status === "archived" : a.status === "active",
  );
  const filtered =
    tab === "all" ? visible : visible.filter((a) => a.category === tab);
  const archivedCount = attachments.filter(
    (a) => a.status === "archived",
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tab === key
                  ? "bg-rust text-cream"
                  : "border border-manila-dark bg-cream text-steel hover:text-ink"
              }`}
            >
              {TAB_LABELS[key]}
              {key !== "all" &&
                ` (${visible.filter((a) => a.category === key).length})`}
            </button>
          ))}
        </div>
        {editable && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) handleFiles(files);
                e.target.value = "";
              }}
            />
            <Button
              variant="secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </>
        )}
      </div>

      <div
        className={`rounded-xl border p-3 transition-colors ${
          isDragActive && editable
            ? "border-rust bg-rust-soft/20"
            : "border-manila-dark"
        }`}
      >
        {filtered.length === 0 ? (
          attachments.length === 0 ? (
            <EmptyState
              icon={Paperclip}
              title="No attachments yet"
              description="Photos, documents, and signed paperwork will appear here."
              action={
                editable
                  ? {
                      label: "Upload",
                      onClick: () => fileInputRef.current?.click(),
                    }
                  : undefined
              }
            />
          ) : (
            <p className="py-6 text-center text-sm text-steel">
              No attachments match this filter.
            </p>
          )
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => {
              const uploader = users.find((u) => u.id === a.uploadedByUserId);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    if (a.category !== "document") {
                      setPreview(a);
                      return;
                    }
                    const win = window.open(a.fileUrl, "_blank");
                    if (!win) {
                      toast.error(
                        "Pop-up blocked. Allow pop-ups to view this document.",
                      );
                    }
                  }}
                  className="flex flex-col gap-2 rounded-xl border border-manila-dark bg-cream p-3 text-left transition-colors hover:border-rust/30"
                >
                  {a.category === "document" ? (
                    <div className="flex h-28 items-center justify-center rounded-lg bg-paper-dim">
                      <FileText size={28} className="text-steel-light" />
                    </div>
                  ) : (
                    // biome-ignore lint/performance/noImgElement: object-URL/thumbnail preview, not eligible for next/image
                    <img
                      src={a.thumbnailUrl ?? a.fileUrl}
                      alt=""
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {a.title || a.fileName}
                    </p>
                    <p className="truncate text-xs text-steel">
                      {formatFileSize(a.sizeBytes)} ·{" "}
                      {uploader ? getUserDisplayName(uploader) : "Unknown"} ·{" "}
                      {SOURCE_LABELS[a.source]}
                    </p>
                  </div>
                  {editable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (a.status === "active") {
                          setArchiveTarget(a);
                        } else {
                          toggleAttachmentArchive(a.id);
                        }
                      }}
                      className="self-start text-xs font-medium text-steel underline hover:text-rust"
                    >
                      {a.status === "active" ? "Archive" : "Restore"}
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {archivedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-xs text-steel underline hover:text-rust"
        >
          {showArchived
            ? "Hide archived attachments"
            : `Show ${archivedCount} archived attachment${archivedCount === 1 ? "" : "s"}`}
        </button>
      )}

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.title || preview?.fileName || "Preview"}
        size="lg"
      >
        {preview?.category === "video" ? (
          // biome-ignore lint/a11y/useMediaCaption: mock attachment, no captions source
          <video
            src={preview.fileUrl}
            controls
            className="max-h-[70vh] w-full rounded-lg"
          />
        ) : preview ? (
          // biome-ignore lint/performance/noImgElement: object-URL/full-size preview, not eligible for next/image
          <img
            src={preview.fileUrl}
            alt=""
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title="Archive attachment"
        body={`"${archiveTarget?.title || archiveTarget?.fileName}" will be hidden from the active list. You can restore it later.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() =>
          archiveTarget ? toggleAttachmentArchive(archiveTarget.id) : undefined
        }
      />
    </div>
  );
}
