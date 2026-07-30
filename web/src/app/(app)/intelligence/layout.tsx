"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConversationHistory } from "@/components/intelligence/ConversationHistory";
import {
  IntelligenceChatProvider,
  useIntelligenceChat,
} from "@/lib/intelligence-chat";

function IntelligenceShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    conversations,
    activeConversationId,
    selectConversation,
    startNewConversation,
    renameConversation,
  } = useIntelligenceChat();

  return (
    <div className="flex h-dvh bg-paper">
      <ConversationHistory
        collapsed={!sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={startNewConversation}
        onRenameConversation={renameConversation}
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

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IntelligenceChatProvider>
      <IntelligenceShell>{children}</IntelligenceShell>
    </IntelligenceChatProvider>
  );
}
