"use client";

import { useState, type KeyboardEvent, useRef, useEffect } from "react";
import { ArrowUp, Mic, Paperclip } from "lucide-react";

const CATEGORIES = [
  "Finance",
  "Operations",
  "Loads",
  "Crew",
  "Reports",
  "Customers",
];

export function PromptArea() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) setValue("");
    }
  }

  function handleCategoryClick(category: string) {
    setValue(`Ask about ${category.toLowerCase()}...`);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-8">
      <div className="w-full max-w-175 text-center">
        <h1 className="intel-page-title">How can I help?</h1>

        {/* Prompt — the command center */}
        <div className="mt-8 rounded-2xl border border-manila-dark bg-cream shadow-card transition-all duration-300 focus-within:border-rust/30 focus-within:shadow-[0_8px_40px_-12px_rgba(37,99,235,0.1),0_0_0_1px_rgba(37,99,235,0.08)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your operations..."
            rows={1}
            className="w-full resize-none rounded-2xl bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-ink placeholder:text-steel-light/50 outline-none"
          />
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="rounded-xl p-2.5 text-steel-light transition-colors duration-200 hover:bg-manila hover:text-steel"
                title="Attach file"
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
              disabled={!value.trim()}
              className="rounded-xl bg-rust p-2.5 text-cream transition-all duration-200 hover:bg-rust-dark hover:shadow-[0_4px_16px_-4px_var(--color-rust)/0.4] active:scale-95 disabled:cursor-not-allowed disabled:bg-manila-dark disabled:text-steel-light disabled:shadow-none"
              onClick={() => setValue("")}
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>

        {/* Category chips */}
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
    </div>
  );
}