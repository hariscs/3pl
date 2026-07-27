"use client";

import { useState } from "react";
import { Sparkles, Copy, RefreshCw, FileSearch, Check } from "lucide-react";
import type { Message, Evidence } from "@/lib/intelligence";

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

function UserMessage({ content }: { content: string }) {
    return (
        <div className="mb-5 flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-5 py-3.5">
                <p className="text-[14px] leading-relaxed text-cream/90">{content}</p>
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
};

export function MessageList({ messages, thinking, activeEvidenceId, onShowEvidence }: Props) {
    const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === "assistant");

    return (
        <div>
            {messages.map((msg, i) => {
                if (msg.role === "user") {
                    return <UserMessage key={msg.id} content={msg.content} />;
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