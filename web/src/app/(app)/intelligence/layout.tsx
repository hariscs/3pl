"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConversationHistory } from "@/components/intelligence/ConversationHistory";
import {
  IntelligenceChatProvider,
  useIntelligenceChat,
} from "@/lib/intelligence-chat";

// Only the chat route has no page header of its own to collide with, so it's
// the only page that gets this floating overlay link. Every other page
// (Knowledge Hub, etc.) renders its own in-flow back link instead, since an
// absolutely-positioned link over a scrolling page just floats on top of
// whatever content happens to scroll underneath it.
const FLOATING_BACK_LINK_ROUTE = "/intelligence";

function IntelligenceShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
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
        {pathname === FLOATING_BACK_LINK_ROUTE && (
          <Link
            href="/"
            className="absolute left-5 top-4 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-steel transition-colors duration-150 hover:bg-manila hover:text-ink"
          >
            <ArrowLeft size={14} />
            Back to Portal
          </Link>
        )}
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
