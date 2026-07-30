"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  DollarSign,
  FileText,
  type LucideIcon,
  Mic,
  Paperclip,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GlobalAttachmentDropOverlay } from "@/components/intelligence/GlobalAttachmentDropOverlay";
import { ImagePreviewModal } from "@/components/intelligence/ImagePreviewModal";
import { MessageList } from "@/components/intelligence/MessageList";
import { useGlobalFileDrop } from "@/components/intelligence/useGlobalFileDrop";
import type {
  ChatAttachment,
  Evidence,
  Message,
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

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Finance: DollarSign,
  Operations: Activity,
  Loads: Truck,
  Crew: Users,
  Reports: BarChart3,
  Customers: Building2,
};

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg,.webp";
const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const NEAR_BOTTOM_THRESHOLD = 120;

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
  const [isNearBottom, setIsNearBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Ref to keep attachment state accessible from the global drop callback (avoids stale closures)
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;

  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsNearBottom(
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD,
    );
  }, []);

  // Auto-scroll only when the reader is already near the bottom, so streaming
  // in a new response never yanks them away from history they scrolled up to read.
  // messages/thinking are intentionally trigger-only deps (read via refs, not directly).
  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger-only deps, see comment above
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && isNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, thinking]);

  // composerValue is a trigger-only dep — the effect reads the textarea's own
  // scrollHeight off the DOM, not the value itself.
  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger-only dep, see comment above
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

  // nextAttachId is intentionally omitted: useCallback([]) locks in this
  // render's closure over attachCounter once, so IDs keep incrementing
  // correctly across calls instead of resetting every render.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
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

    const sentAttachments: SentAttachment[] = validAttachments.map((a) =>
      buildSentAttachment(a),
    );

    onSend(trimmed, sentAttachments);
    setComposerValue("");
    setAttachments([]);
    setIsNearBottom(true);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
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

  function scrollToBottom() {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setIsNearBottom(true);
  }

  const hasDraftContent =
    composerValue.trim().length > 0 ||
    attachments.some((a) => a.status === "ready");
  const sendDisabled = !hasDraftContent || thinking;

  // ── Composer ────────────────────────────────────────
  const composer = (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isDragActive
          ? "border-rust/50 bg-rust-soft/10 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.2)]"
          : "border-manila-dark bg-cream shadow-card focus-within:border-rust/30 focus-within:shadow-[0_8px_40px_-12px_rgba(37,99,235,0.1),0_0_0_1px_rgba(37,99,235,0.08)]"
      }`}
    >
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 px-4 pt-4 pb-1 max-h-40 overflow-y-auto">
          {attachments.map((att) => {
            const previewUrl = att.previewUrl;
            return (
              <div
                key={att.id}
                className={`animate-global-drop-in group relative flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  att.status === "invalid"
                    ? "border-stamp/30 bg-stamp-soft/30"
                    : "border-manila-dark bg-cream hover:border-rust/20"
                }`}
              >
                {/* Thumbnail or file icon */}
                {previewUrl ? (
                  <button
                    type="button"
                    onClick={() => openImagePreview(previewUrl, att.name)}
                    className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                  >
                    {/* biome-ignore lint/performance/noImgElement: object-URL preview, not eligible for next/image */}
                    <img
                      src={previewUrl}
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
                  aria-label={`Remove ${att.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-manila-dark bg-cream text-steel-light opacity-0 shadow-sm transition-opacity hover:text-stamp group-hover:opacity-100"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
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
        aria-label="Message"
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
          disabled={sendDisabled}
          title={thinking ? "Waiting for response…" : "Send"}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-rust text-cream transition-all duration-200 hover:bg-rust-dark hover:shadow-[0_4px_16px_-4px_var(--color-rust)/0.4] active:scale-95 disabled:cursor-not-allowed disabled:bg-manila-dark disabled:text-steel-light disabled:shadow-none"
          onClick={handleSubmit}
        >
          {thinking ? (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-steel-light" />
          ) : (
            <ArrowUp size={17} />
          )}
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
          <div className="animate-global-drop-in relative mx-auto mb-6 flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-rust/15 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-rust-soft to-rust-soft/50 ring-1 ring-rust/10">
              <Sparkles size={22} className="text-rust" />
            </div>
          </div>
          <p
            style={{ animationDelay: "60ms" }}
            className="animate-global-drop-in text-[34px] font-medium leading-[1.15] tracking-[-0.015em] text-ink"
          >
            How can I help?
          </p>
          <p
            style={{ animationDelay: "110ms" }}
            className="animate-global-drop-in mt-2.5 text-[15px] text-steel"
          >
            Ask about loads, payroll, customers, or anything else in your
            operations.
          </p>
          <div
            style={{ animationDelay: "160ms" }}
            className="animate-global-drop-in mt-8"
          >
            {composer}
          </div>
          <div
            style={{ animationDelay: "200ms" }}
            className="animate-global-drop-in mt-6"
          >
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    className="flex items-center gap-1.5 rounded-full border border-manila-dark bg-cream px-4 py-2 text-[13px] font-medium text-steel transition-all duration-150 hover:border-rust/30 hover:bg-rust-soft/30 hover:text-rust-dark active:scale-95"
                  >
                    <Icon size={13} className="text-steel-light" />
                    {category}
                  </button>
                );
              })}
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
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <GlobalAttachmentDropOverlay active={isDragActive} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-8 pt-6"
      >
        <div className="mx-auto w-full max-w-175 pb-2">
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

      {!isNearBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="animate-global-drop-in absolute bottom-30 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-manila-dark bg-cream px-3.5 py-2 text-xs font-medium text-steel shadow-md transition-colors hover:border-rust/30 hover:text-ink"
        >
          <ArrowDown size={13} />
          {thinking ? "New messages" : "Scroll to bottom"}
        </button>
      )}

      <div className="flex-none px-8 pb-6 pt-4">
        <div className="mx-auto w-full max-w-175">{composer}</div>
      </div>
      <ImagePreviewModal
        url={previewUrl}
        filename={previewFilename}
        onClose={closeImagePreview}
      />
    </div>
  );
}
