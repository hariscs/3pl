"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ConversationHistory } from "@/components/intelligence/ConversationHistory";
import { MOCK_CONVERSATIONS } from "@/lib/mocks/conversationHistory";
import type { Conversation } from "@/lib/intelligence";

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  function handleNewConversation() {
    setActiveConversationId(null);
    router.push("/intelligence");
  }

  function handleSelectConversation(_id: string) {
    // Placeholder
  }

  function handleRenameConversation(id: string, newTitle: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c,
      ),
    );
  }

  return (
    <div className="flex h-screen bg-paper">
      <ConversationHistory
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
      />

      <main className="relative flex flex-1 flex-col overflow-y-auto">
        <Link
          href="/"
          className="absolute left-5 top-4 flex items-center gap-1.5 text-[13px] font-medium text-steel-light transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to Portal
        </Link>
        {children}
      </main>
    </div>
  );
}
