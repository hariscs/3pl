"use client";

import { useState } from "react";
import { Sparkles, Copy, RefreshCw, FileSearch, Check, FileText } from "lucide-react";
import type { Message, Evidence, SentAttachment } from "@/lib/intelligence";

function FormattedContent({ content }: { content: string }) {
    const paragraphs = content.split("\n\n").filter(Boolean);

    return (
        <div className="space-y-3">
            {paragraphs.map((paragraph, i) => {
                const lines = paragraph.split("\n");
                if (lines.length === 1 && !lines[0].startsWith("- ") && !lines[0].startsWith("* ")) {
                    return (
                        <p key={i} className="text-[14px] leading-relaxed text-ink/80">
                            {lines[0]}
                        </p>
                    );
                }

                if (lines.every((l) => l.startsWith("- ") || l.startsWith("* "))) {
                    return (
                        <ul key={i} className="space-y-1">
                            {lines.map((line, j) => (
                                <li key={j} className="flex gap-2 text-[14px] leading-relaxed text-ink/80">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-steel/50" />
                                    <span>{line.replace(/^[-*] /, "")}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                return (
                    <p key={i} className="text-[14px] leading-relaxed text-ink/80">
                        {lines.filter(Boolean).map((line, j) => (
                            <span key={j}>
                                {j > 0 && <br />}
                                {line}
                            </span>
                        ))}
                    </p>
                );
            })}
        </div>
    );
}

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
                    <FormattedContent content={content} />
                </div>
            </div>

            {!streaming && (
                <div className="ml-[44px] mt-1.5 flex items-center gap-0.5">
                    <button type="button" onClick={handleCopy} className="rounded-md p-1.5 text-steel/50 transition-colors hover:bg-manila hover:text-steel" title="Copy">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button type="button" className="rounded-md p-1.5 text-steel/50 transition-colors hover:bg-manila hover:text-steel" title="Regenerate">
                        <RefreshCw size={14} />
                    </button>
                    <button type="button" onClick={() => onShowEvidence(messageId)} className={`rounded-md p-1.5 transition-colors ${isEvidenceActive ? "bg-rust-soft/40 text-rust-dark" : "text-steel/50 hover:bg-manila hover:text-steel"}`} title="Show Evidence">
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

function AttachmentCard({ attachment, onImagePreview }: { attachment: SentAttachment; onImagePreview?: (url: string, filename: string) => void }) {
    const isImg = attachment.category === "image";
    return (
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            {isImg && attachment.previewUrl ? (
                <button type="button" onClick={() => onImagePreview?.(attachment.previewUrl!, attachment.name)} className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                    <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
                </button>
            ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <FileText size={15} className="text-cream/50" />
                </div>
            )}
            <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-cream/80 max-w-[160px]">{attachment.name}</p>
                <p className="text-[10px] text-cream/40">{formatFileSize(attachment.size)}</p>
            </div>
        </div>
    );
}

function UserMessage({ content, attachments, onImagePreview }: { content: string; attachments?: SentAttachment[]; onImagePreview?: (url: string, filename: string) => void }) {
    return (
        <div className="mb-5 flex flex-col items-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-5 py-3.5">
                {content && <p className="text-[14px] leading-relaxed text-cream/90">{content}</p>}
                {attachments && attachments.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${content ? "mt-3" : ""}`}>
                        {attachments.map((att) => (
                            <AttachmentCard key={att.id} attachment={att} onImagePreview={onImagePreview} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ThinkingIndicator() {
    return (
        <div className="mb-5 ml-[44px] flex items-center gap-1.5 pt-1.5">
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-steel [animation-delay:0ms]" />
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-steel [animation-delay:200ms]" />
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-steel [animation-delay:400ms]" />
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

export function MessageList({ messages, thinking, activeEvidenceId, onShowEvidence, onImagePreview }: Props) {
    const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === "assistant");

    return (
        <div>
            {messages.map((msg, i) => {
                if (msg.role === "user") {
                    return <UserMessage key={msg.id} content={msg.content} attachments={msg.attachments} onImagePreview={onImagePreview} />;
                }
                const isLastAssistant = lastAssistantIndex === messages.length - 1 - i;
                const isStreaming = isLastAssistant && thinking;
                return (
                    <AssistantMessage
                        key={msg.id}
                        content={msg.content}
                        messageId={msg.id}
                        isEvidenceActive={activeEvidenceId === msg.id}
                        streaming={isStreaming}
                        onShowEvidence={onShowEvidence}
                    />
                );
            })}
            {thinking && <ThinkingIndicator />}
        </div>
    );
}