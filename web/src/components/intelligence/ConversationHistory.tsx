"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Sparkles,
  Library,
} from "lucide-react";
import type { Conversation } from "@/lib/intelligence";

function ConversationItem({
  id,
  title,
  updatedAt,
  active,
  onClick,
  onRename,
}: {
  id: string;
  title: string;
  updatedAt: string;
  active?: boolean;
  onClick: () => void;
  onRename: (id: string, newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(true);
    setEditValue(title);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onRename(id, trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  }

  return (
    <div
      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150 ${active ? "bg-ink-soft" : "hover:bg-ink-soft"}`}
    >
      <button type="button" onClick={onClick} className="mt-0.5 shrink-0">
        <MessageSquare size={15} className="text-steel-light" />
      </button>
      <div
        className="min-w-0 flex-1"
        onClick={onClick}
        role="button"
        tabIndex={-1}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full rounded bg-ink-soft px-1 py-0.5 text-[13px] font-medium text-cream outline-none ring-1 ring-rust/30"
          />
        ) : (
          <p className="truncate text-[13px] font-medium leading-snug text-cream/80">
            {title}
          </p>
        )}
        <p className="mt-0.5 text-xs text-cream/50">{updatedAt}</p>
      </div>
      {!editing && (
        <button
          type="button"
          onClick={startEditing}
          className="mt-0.5 shrink-0 rounded p-0.5 text-cream/30 opacity-0 transition-all duration-150 hover:text-cream/60 group-hover:opacity-100"
          title="Rename"
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
  );
}

function formatRelativeTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
};

export function ConversationHistory({
  collapsed,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
}: Props) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const isKnowledge = pathname.includes("/knowledge");

  const filtered = search.trim()
    ? conversations.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase()),
    )
    : conversations;

  const today = filtered.filter((c) => c.group === "today");
  const yesterday = filtered.filter((c) => c.group === "yesterday");
  const previous = filtered.filter((c) => c.group === "previous");

  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-none flex-col border-r border-ink-line bg-ink">
        <div className="flex-1 py-4">
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto flex justify-center rounded-lg p-2 text-steel-light transition-colors hover:bg-ink-soft hover:text-cream/70"
            title="Open conversations"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
        <div className="pb-4">
          <Link
            href="/intelligence/knowledge"
            title="AI Knowledge Hub"
            className={`mx-auto flex justify-center rounded-lg p-2 transition-colors ${isKnowledge
              ? "bg-ink-soft text-rust"
              : "text-steel-light hover:bg-ink-soft hover:text-cream/70"
              }`}
          >
            <Sparkles size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-78 flex-none flex-col border-r border-ink-line bg-ink">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-cream/70">
          History
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-1.5 text-steel-light transition-colors hover:bg-ink-soft hover:text-cream/60"
          title="Close sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center gap-2.5 rounded-lg border border-ink-line bg-ink-soft px-3.5 py-2.5 text-[13px] font-medium text-cream/70 transition-all duration-150 hover:border-rust/30 hover:text-cream active:scale-[0.98]"
        >
          <Plus size={14} className="text-rust/60" />
          New Conversation
        </button>
      </div>

      <div className="px-3 pb-4">
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-light"
          />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ink-line bg-ink-soft py-2 pl-9 pr-3 text-[13px] text-cream/70 placeholder:text-steel-light outline-none transition-all duration-200 focus:border-rust/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-5">
        <div className="space-y-5">
          {today.length > 0 && (
            <section>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/50">
                Today
              </p>
              {today.map((c) => {
                const now = Date.now();
                const age = now - c.updatedAt;
                return (
                  <ConversationItem
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    updatedAt={formatRelativeTime(age)}
                    active={c.id === activeConversationId}
                    onClick={() => onSelectConversation(c.id)}
                    onRename={onRenameConversation}
                  />
                );
              })}
            </section>
          )}
          {yesterday.length > 0 && (
            <section>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/50">
                Yesterday
              </p>
              {yesterday.map((c) => {
                const now = Date.now();
                const age = now - c.updatedAt;
                return (
                  <ConversationItem
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    updatedAt={formatRelativeTime(age)}
                    active={c.id === activeConversationId}
                    onClick={() => onSelectConversation(c.id)}
                    onRename={onRenameConversation}
                  />
                );
              })}
            </section>
          )}
          {previous.length > 0 && (
            <section>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/50">
                Previous
              </p>
              {previous.map((c) => {
                const now = Date.now();
                const age = now - c.updatedAt;
                return (
                  <ConversationItem
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    updatedAt={formatRelativeTime(age)}
                    active={c.id === activeConversationId}
                    onClick={() => onSelectConversation(c.id)}
                    onRename={onRenameConversation}
                  />
                );
              })}
            </section>
          )}
        </div>
      </div>

      {/* AI Knowledge Hub — fixed at bottom, prominent */}
      <div className="flex-none border-t border-ink-line px-3 py-3">
        <Link
          href="/intelligence/knowledge"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all duration-200 ${isKnowledge
            ? "bg-rust text-cream"
            : "text-steel-light hover:bg-ink-soft hover:text-cream/80"
            }`}
        >
          <Sparkles
            size={17}
            className={isKnowledge ? "text-cream" : "text-rust/60"}
          />
          AI Knowledge Hub
        </Link>
      </div>
    </div>
  );
}
