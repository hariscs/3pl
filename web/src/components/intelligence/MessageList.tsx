"use client";

import {
  Check,
  Copy,
  FileSearch,
  FileText,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ShimmerText } from "@/components/intelligence/ShimmerText";
import type { Evidence, Message, SentAttachment } from "@/lib/intelligence";

// ── Block parsing ──────────────────────────────────────────
//
// Content streams in strictly append-only, so every block before the last
// one is permanently frozen once it exists — only the last (currently
// growing) block can still be ambiguous. Keys are derived from each block's
// first line so a block already on screen never remounts (and never replays
// its entrance animation) as more text streams into it.

type Block =
  | { type: "paragraph"; key: string; lines: string[] }
  | { type: "bullet-list"; key: string; items: string[] }
  | { type: "ordered-list"; key: string; items: string[] }
  | { type: "blockquote"; key: string; lines: string[] }
  | { type: "code"; key: string; language: string; code: string }
  | { type: "table"; key: string; header: string[]; rows: string[][] };

const FENCE_RE = /^```(\w*)\s*$/;
const BULLET_RE = /^[-*]\s/;
const ORDERED_RE = /^\d+\.\s/;
const QUOTE_RE = /^>\s?/;

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t || !t.includes("-") || !t.includes("|")) return false;
  return /^[|:\-\s]+$/.test(t);
}

function splitTableRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((cell) => cell.trim());
}

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let counter = 0;
  const makeKey = (raw: string) => `b-${counter++}-${raw.slice(0, 16)}`;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const fenceMatch = line.match(FENCE_RE);
    if (fenceMatch) {
      const key = makeKey(line);
      const language = fenceMatch[1] ?? "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing fence
      blocks.push({ type: "code", key, language, code: codeLines.join("\n") });
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const key = makeKey(line);
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", key, header, rows });
      continue;
    }

    if (QUOTE_RE.test(line.trim())) {
      const key = makeKey(line);
      const quoteLines: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(QUOTE_RE, ""));
        i++;
      }
      blocks.push({ type: "blockquote", key, lines: quoteLines });
      continue;
    }

    if (BULLET_RE.test(line.trim())) {
      const key = makeKey(line);
      const items: string[] = [];
      while (i < lines.length && BULLET_RE.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(BULLET_RE, ""));
        i++;
      }
      blocks.push({ type: "bullet-list", key, items });
      continue;
    }

    if (ORDERED_RE.test(line.trim())) {
      const key = makeKey(line);
      const items: string[] = [];
      while (i < lines.length && ORDERED_RE.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(ORDERED_RE, ""));
        i++;
      }
      blocks.push({ type: "ordered-list", key, items });
      continue;
    }

    // Paragraph: the current line plus any following lines that don't open
    // a new block type.
    {
      const key = makeKey(line);
      const paraLines = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !FENCE_RE.test(lines[i]) &&
        !BULLET_RE.test(lines[i].trim()) &&
        !ORDERED_RE.test(lines[i].trim()) &&
        !QUOTE_RE.test(lines[i].trim()) &&
        !lines[i].trim().startsWith("|")
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "paragraph", key, lines: paraLines });
    }
  }

  return blocks;
}

// ── Inline formatting (bold + inline code) ─────────────────

function renderInline(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}-${part.slice(0, 8)}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-manila px-1.5 py-0.5 font-mono text-[13px] text-rust-dark"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

// ── Block rendering ─────────────────────────────────────────

function BlockView({
  block,
  isLast,
  trailingCursor,
}: {
  block: Block;
  isLast: boolean;
  trailingCursor?: ReactNode;
}) {
  const cursor = isLast ? trailingCursor : undefined;

  if (block.type === "code") {
    return (
      <div className="animate-fade-up overflow-hidden rounded-xl border border-manila-dark bg-ink">
        {block.language && (
          <div className="border-b border-white/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-cream/40">
            {block.language}
          </div>
        )}
        <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed">
          <code className="font-mono text-cream/90">
            {block.code}
            {cursor}
          </code>
        </pre>
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="animate-fade-up overflow-x-auto rounded-xl border border-manila-dark">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-manila-dark bg-manila/40">
              {block.header.map((cell, ci) => (
                <th
                  key={`${block.key}-h-${ci}`}
                  className="px-3 py-2 text-left font-semibold text-ink/80"
                >
                  {renderInline(cell, `${block.key}-h-${ci}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr
                key={`${block.key}-r-${ri}`}
                className="border-b border-manila-dark/60 last:border-b-0"
              >
                {row.map((cell, ci) => (
                  <td
                    key={`${block.key}-r-${ri}-c-${ci}`}
                    className="px-3 py-2 text-ink/85"
                  >
                    {renderInline(cell, `${block.key}-r-${ri}-c-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "blockquote") {
    return (
      <blockquote className="animate-fade-up border-l-2 border-manila-dark pl-3.5 text-[15px] italic leading-relaxed text-steel">
        {block.lines.map((line, li) => (
          <span key={`${block.key}-${li}`}>
            {li > 0 && <br />}
            {renderInline(line, `${block.key}-${li}`)}
          </span>
        ))}
        {cursor}
      </blockquote>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <ol className="animate-fade-up list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/85">
        {block.items.map((item, ii) => (
          <li key={`${block.key}-${ii}`}>
            {renderInline(item, `${block.key}-${ii}`)}
            {ii === block.items.length - 1 && cursor}
          </li>
        ))}
      </ol>
    );
  }

  if (block.type === "bullet-list") {
    return (
      <ul className="animate-fade-up space-y-1.5">
        {block.items.map((item, ii) => (
          <li
            key={`${block.key}-${ii}`}
            className="flex gap-2 text-[15px] leading-relaxed text-ink/85"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-steel-light/60" />
            <span>
              {renderInline(item, `${block.key}-${ii}`)}
              {ii === block.items.length - 1 && cursor}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="animate-fade-up text-[15px] leading-relaxed text-ink/85">
      {block.lines.map((line, li) => (
        <span key={`${block.key}-${li}`}>
          {li > 0 && <br />}
          {renderInline(line, `${block.key}-${li}`)}
        </span>
      ))}
      {cursor}
    </p>
  );
}

function FormattedContent({
  content,
  trailingCursor,
}: {
  content: string;
  trailingCursor?: ReactNode;
}) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {blocks.map((block, i) => (
        <BlockView
          key={block.key}
          block={block}
          isLast={i === blocks.length - 1}
          trailingCursor={trailingCursor}
        />
      ))}
    </div>
  );
}

// ── Thinking / streaming affordances ────────────────────────

function ThinkingIndicator() {
  return (
    <div className="mb-5 flex items-center gap-3.5">
      <div className="animate-avatar-pulse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rust-soft/60">
        <Sparkles size={15} className="text-rust" />
      </div>
      <ShimmerText className="text-[15px]">Thinking…</ShimmerText>
    </div>
  );
}

function StreamingCursor() {
  return (
    <span
      aria-hidden="true"
      className="animate-caret-blink ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-ink/70"
    />
  );
}

// ── Messages ─────────────────────────────────────────────────

function AssistantMessage({
  content,
  messageId,
  isEvidenceActive,
  streaming,
  onShowEvidence,
}: {
  content: string;
  messageId: string;
  isEvidenceActive: boolean;
  streaming: boolean;
  onShowEvidence: (messageId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group mb-5">
      <div className="flex gap-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rust-soft/60">
          <Sparkles size={15} className="text-rust" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <FormattedContent
            content={content}
            trailingCursor={streaming ? <StreamingCursor /> : undefined}
          />
        </div>
      </div>

      {!streaming && (
        <div className="ml-11 mt-1.5 flex items-center gap-0.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md p-1.5 text-steel/50 transition-colors hover:bg-manila hover:text-steel"
            title="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-steel/50 transition-colors hover:bg-manila hover:text-steel"
            title="Regenerate"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => onShowEvidence(messageId)}
            className={`rounded-md p-1.5 transition-colors ${isEvidenceActive ? "bg-rust-soft/40 text-rust-dark" : "text-steel/50 hover:bg-manila hover:text-steel"}`}
            title="Show Evidence"
          >
            <FileSearch size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentCard({
  attachment,
  onImagePreview,
}: {
  attachment: SentAttachment;
  onImagePreview?: (url: string, filename: string) => void;
}) {
  const isImg = attachment.category === "image";
  const previewUrl = attachment.previewUrl;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2">
      {isImg && previewUrl ? (
        <button
          type="button"
          onClick={() => onImagePreview?.(previewUrl, attachment.name)}
          className="h-9 w-9 shrink-0 overflow-hidden rounded-lg"
        >
          {/* biome-ignore lint/performance/noImgElement: object-URL preview, not eligible for next/image */}
          <img
            src={previewUrl}
            alt={attachment.name}
            className="h-full w-full object-cover"
          />
        </button>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <FileText size={15} className="text-cream/50" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-cream/80 max-w-40">
          {attachment.name}
        </p>
        <p className="text-[10px] text-cream/40">
          {formatFileSize(attachment.size)}
        </p>
      </div>
    </div>
  );
}

function UserMessage({
  content,
  attachments,
  onImagePreview,
}: {
  content: string;
  attachments?: SentAttachment[];
  onImagePreview?: (url: string, filename: string) => void;
}) {
  return (
    <div className="animate-fade-up mb-5 flex flex-col items-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-5 py-3.5">
        {content && (
          <p className="text-sm leading-relaxed text-cream/90">{content}</p>
        )}
        {attachments && attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${content ? "mt-3" : ""}`}>
            {attachments.map((att) => (
              <AttachmentCard
                key={att.id}
                attachment={att}
                onImagePreview={onImagePreview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  messages: Message[];
  thinking: boolean;
  activeEvidenceId: string | null;
  activeEvidence: Evidence | null;
  onShowEvidence: (messageId: string) => void;
  onImagePreview?: (url: string, filename: string) => void;
};

export function MessageList({
  messages,
  thinking,
  activeEvidenceId,
  onShowEvidence,
  onImagePreview,
}: Props) {
  const lastMessage = messages[messages.length - 1];
  const isAwaitingFirstToken =
    thinking &&
    (!lastMessage || lastMessage.role === "user" || lastMessage.content === "");
  const lastAssistantIndex = [...messages]
    .reverse()
    .findIndex((m) => m.role === "assistant");

  return (
    <div role="log" aria-live="polite" aria-busy={thinking}>
      {messages.map((msg, i) => {
        if (msg.role === "user") {
          return (
            <UserMessage
              key={msg.id}
              content={msg.content}
              attachments={msg.attachments}
              onImagePreview={onImagePreview}
            />
          );
        }
        const isLastAssistant = lastAssistantIndex === messages.length - 1 - i;
        // While awaiting the first token, ThinkingIndicator stands in for
        // this (still-empty) message so the two don't render simultaneously.
        if (isLastAssistant && isAwaitingFirstToken) return null;
        const isStreamingThisMessage = isLastAssistant && thinking;
        return (
          <AssistantMessage
            key={msg.id}
            content={msg.content}
            messageId={msg.id}
            isEvidenceActive={activeEvidenceId === msg.id}
            streaming={isStreamingThisMessage}
            onShowEvidence={onShowEvidence}
          />
        );
      })}
      {isAwaitingFirstToken && <ThinkingIndicator />}
    </div>
  );
}
