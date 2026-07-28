"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { ArrowUp, Mic, Paperclip, X, FileText } from "lucide-react";
import { MessageList } from "@/components/intelligence/MessageList";
import { ImagePreviewModal } from "@/components/intelligence/ImagePreviewModal";
import { GlobalAttachmentDropOverlay } from "@/components/intelligence/GlobalAttachmentDropOverlay";
import { useGlobalFileDrop } from "@/components/intelligence/useGlobalFileDrop";
import type {
  Message,
  Evidence,
  ChatAttachment,
  SentAttachment,
} from "@/lib/intelligence";

const CATEGORIES = [
  "Finance",
  "Operations",
  "Loads",
  "Crew",
  "Reports",
  "Customers",
] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_QUESTIONS: Record<Category, string> = {
  Finance: "Why did payroll increase this week?",
  Operations: "Which operations had the longest completion times?",
  Loads: "Show me today's active loads.",
  Crew: "Which employees worked overtime?",
  Reports: "Summarize operational performance for this week.",
  Customers: "Which customer generated the highest revenue?",
};

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg,.webp";
const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function buildSentAttachment(att: ChatAttachment): SentAttachment {
  return {
    id: att.id,
    name: att.name,
    mimeType: att.mimeType,
    size: att.size,
    category: att.category,
    previewUrl: att.previewUrl,
  };
}

type Props = {
  messages: Message[];
  thinking: boolean;
  hasMessages: boolean;
  activeEvidenceId: string | null;
  activeEvidence: Evidence | null;
  onSend: (content: string, attachments?: SentAttachment[]) => void;
  onShowEvidence: (messageId: string) => void;
};

export function ChatWorkspace({
  messages,
  thinking,
  hasMessages,
  activeEvidenceId,
  activeEvidence,
  onSend,
  onShowEvidence,
}: Props) {
  const [composerValue, setComposerValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ref to keep attachment state accessible from the global drop callback (avoids stale closures)
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  // Auto-scroll + auto-resize
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [composerValue]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      for (const att of attachments) {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      }
    };
  }, [attachments]);

  // ── File handling ───────────────────────────────────
  let attachCounter = 0;
  function nextAttachId() {
    return `att-${++attachCounter}`;
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const currentAttachments = attachmentsRef.current;

    function isDuplicate(file: File): boolean {
      return currentAttachments.some(
        (a) =>
          a.name === file.name &&
          a.size === file.size &&
          a.file.lastModified === file.lastModified,
      );
    }

    function validateFile(file: File): string | null {
      if (file.size > MAX_FILE_SIZE)
        return `"${file.name}" exceeds 20 MB limit`;
      if (currentAttachments.length >= MAX_FILES)
        return "Maximum 10 files per message";
      if (isDuplicate(file)) return `"${file.name}" already attached`;
      return null;
    }

    const newAttachments: ChatAttachment[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        newAttachments.push({
          id: nextAttachId(),
          file,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          category: isImage(file.type) ? "image" : "document",
          previewUrl: isImage(file.type)
            ? URL.createObjectURL(file)
            : undefined,
          status: "invalid",
          error,
        });
        continue;
      }
      newAttachments.push({
        id: nextAttachId(),
        file,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        category: isImage(file.type) ? "image" : "document",
        previewUrl: isImage(file.type) ? URL.createObjectURL(file) : undefined,
        status: "ready",
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  // ── Global drag-and-drop ────────────────────────────
  const isDragActive = useGlobalFileDrop({ onDropFiles: addFiles });

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  // ── Send ────────────────────────────────────────────
  function handleSubmit() {
    const trimmed = composerValue.trim();
    const validAttachments = attachments.filter((a) => a.status === "ready");
    if (!trimmed && validAttachments.length === 0) return;

    // Clean up preview URLs before sending
    const sentAttachments: SentAttachment[] = validAttachments.map((a) =>
      buildSentAttachment(a),
    );

    onSend(trimmed, sentAttachments);
    setComposerValue("");
    setAttachments([]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleCategoryClick(category: Category) {
    setComposerValue(CATEGORY_QUESTIONS[category]);
    textareaRef.current?.focus();
  }

  function openImagePreview(url: string, filename: string) {
    setPreviewUrl(url);
    setPreviewFilename(filename);
  }

  function closeImagePreview() {
    setPreviewUrl(null);
    setPreviewFilename("");
  }

  const hasDraftContent =
    composerValue.trim().length > 0 ||
    attachments.some((a) => a.status === "ready");

  // ── Composer ────────────────────────────────────────
  const composer = (
    <div
      className={`rounded-2xl border transition-all duration-300 ${isDragActive
        ? "border-rust/50 bg-rust-soft/10 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.2)]"
        : "border-manila-dark bg-cream shadow-card focus-within:border-rust/30 focus-within:shadow-[0_8px_40px_-12px_rgba(37,99,235,0.1),0_0_0_1px_rgba(37,99,235,0.08)]"
        }`}
    >
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 px-4 pt-4 pb-1 max-h-40 overflow-y-auto">
          {attachments.map((att) => (
            <div
              key={att.id}
              className={`group relative flex items-center gap-2 rounded-xl border px-3 py-2 ${att.status === "invalid"
                ? "border-stamp/30 bg-stamp-soft/30"
                : "border-manila-dark bg-cream hover:border-rust/20"
                }`}
            >
              {/* Thumbnail or file icon */}
              {att.previewUrl ? (
                <button
                  type="button"
                  onClick={() => openImagePreview(att.previewUrl!, att.name)}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                >
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-manila/60">
                  <FileText size={18} className="text-steel-light" />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-ink max-w-35">
                  {att.name}
                </p>
                <p
                  className={`text-[10px] ${att.status === "invalid" ? "text-stamp" : "text-steel-light"}`}
                >
                  {att.error ?? formatFileSize(att.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-manila-dark bg-cream text-steel-light opacity-0 shadow-sm transition-opacity hover:text-stamp group-hover:opacity-100"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={composerValue}
        onChange={(e) => setComposerValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your operations..."
        rows={1}
        className="w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-ink placeholder:text-steel-light/50 outline-none"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2.5 text-steel-light transition-colors duration-200 hover:bg-manila hover:text-steel"
            title="Attach files"
          >
            <Paperclip size={17} />
          </button>
          <button
            type="button"
            className="rounded-xl p-2.5 text-steel-light transition-colors duration-200 hover:bg-manila hover:text-steel"
            title="Voice input"
          >
            <Mic size={17} />
          </button>
        </div>
        <button
          type="button"
          disabled={!hasDraftContent}
          className="rounded-xl bg-rust p-2.5 text-cream transition-all duration-200 hover:bg-rust-dark hover:shadow-[0_4px_16px_-4px_var(--color-rust)/0.4] active:scale-95 disabled:cursor-not-allowed disabled:bg-manila-dark disabled:text-steel-light disabled:shadow-none"
          onClick={handleSubmit}
        >
          <ArrowUp size={17} />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );

  // ── Empty state ─────────────────────────────────────
  if (!hasMessages) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-8">
        <GlobalAttachmentDropOverlay active={isDragActive} />
        <div className="w-full max-w-175 text-center">
          <p className="intel-body-secondary">How can I help?</p>
          <div className="mt-8">{composer}</div>
          <div className="mt-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className="rounded-full border border-manila-dark bg-cream px-4 py-2 text-[13px] font-medium text-steel transition-all duration-150 hover:border-rust/30 hover:bg-rust-soft/30 hover:text-rust-dark active:scale-95"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ImagePreviewModal
          url={previewUrl}
          filename={previewFilename}
          onClose={closeImagePreview}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <GlobalAttachmentDropOverlay active={isDragActive} />
      <div className="flex-1 overflow-y-auto px-8 pt-6">
        <div className="mx-auto w-full max-w-175">
          <MessageList
            messages={messages}
            thinking={thinking}
            activeEvidenceId={activeEvidenceId}
            activeEvidence={activeEvidence}
            onShowEvidence={onShowEvidence}
            onImagePreview={openImagePreview}
          />
        </div>
      </div>
      <div className="flex-none px-8 pb-6 pt-4">
        <div className="mx-auto w-full max-w-175">{composer}</div>
      </div>
      <div ref={bottomRef} />
      <ImagePreviewModal
        url={previewUrl}
        filename={previewFilename}
        onClose={closeImagePreview}
      />
    </div>
  );
}
