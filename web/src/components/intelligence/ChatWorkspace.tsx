"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { ArrowUp, Mic, Paperclip } from "lucide-react";
import { MessageList } from "@/components/intelligence/MessageList";
import type { Message, Evidence } from "@/lib/intelligence";

const CATEGORIES = ["Finance", "Operations", "Loads", "Crew", "Reports", "Customers"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_QUESTIONS: Record<Category, string> = {
    Finance: "Why did payroll increase this week?",
    Operations: "Which operations had the longest completion times?",
    Loads: "Show me today's active loads.",
    Crew: "Which employees worked overtime?",
    Reports: "Summarize operational performance for this week.",
    Customers: "Which customer generated the highest revenue?",
};

type Props = {
    messages: Message[];
    thinking: boolean;
    hasMessages: boolean;
    activeEvidenceId: string | null;
    activeEvidence: Evidence | null;
    onSend: (content: string) => void;
    onShowEvidence: (messageId: string) => void;
};

export function ChatWorkspace({ messages, thinking, hasMessages, activeEvidenceId, activeEvidence, onSend, onShowEvidence }: Props) {
    const [composerValue, setComposerValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, thinking]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [composerValue]);

    function handleSubmit() {
        const trimmed = composerValue.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setComposerValue("");
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

    const composer = (
        <div className="rounded-2xl border border-manila-dark bg-cream shadow-card transition-all duration-300 focus-within:border-rust/30 focus-within:shadow-[0_8px_40px_-12px_rgba(37,99,235,0.1),0_0_0_1px_rgba(37,99,235,0.08)]">
            <textarea ref={textareaRef} value={composerValue} onChange={(e) => setComposerValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything about your operations..." rows={1} className="w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-ink placeholder:text-steel-light/50 outline-none" />
            <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center gap-0.5">
                    <button type="button" className="rounded-xl p-2.5 text-steel-light transition-colors duration-200 hover:bg-manila hover:text-steel" title="Attach file"><Paperclip size={17} /></button>
                    <button type="button" className="rounded-xl p-2.5 text-steel-light transition-colors duration-200 hover:bg-manila hover:text-steel" title="Voice input"><Mic size={17} /></button>
                </div>
                <button type="button" disabled={!composerValue.trim()} className="rounded-xl bg-rust p-2.5 text-cream transition-all duration-200 hover:bg-rust-dark hover:shadow-[0_4px_16px_-4px_var(--color-rust)/0.4] active:scale-95 disabled:cursor-not-allowed disabled:bg-manila-dark disabled:text-steel-light disabled:shadow-none" onClick={handleSubmit}><ArrowUp size={17} /></button>
            </div>
        </div>
    );

    if (!hasMessages) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-8">
                <div className="w-full max-w-175">
                    <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">3PL Intelligence</h1>
                    <p className="mt-1 text-[14px] leading-relaxed text-steel">Ask questions about your warehouse operations.</p>
                    <div className="mt-8">{composer}</div>
                    <div className="mt-6">
                        <div className="flex flex-wrap gap-2 ml-4">
                            {CATEGORIES.map((category) => (
                                <button key={category} type="button" onClick={() => handleCategoryClick(category)} className="rounded-full border border-manila-dark bg-cream px-4 py-2 text-[13px] font-medium text-steel transition-all duration-150 hover:border-rust/30 hover:bg-rust-soft/30 hover:text-rust-dark active:scale-95">{category}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8 pt-6">
                <div className="mx-auto w-full max-w-175">
                    <MessageList messages={messages} thinking={thinking} activeEvidenceId={activeEvidenceId} activeEvidence={activeEvidence} onShowEvidence={onShowEvidence} />
                </div>
            </div>
            <div className="flex-none px-8 pb-6 pt-4">
                <div className="mx-auto w-full max-w-175">{composer}</div>
            </div>
            <div ref={bottomRef} />
        </div>
    );
}