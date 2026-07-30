"use client";

import { ChatWorkspace } from "@/components/intelligence/ChatWorkspace";
import { EvidencePanel } from "@/components/intelligence/EvidencePanel";
import { useIntelligenceChat } from "@/lib/intelligence-chat";

export default function IntelligenceChatPage() {
  const {
    messages,
    thinking,
    activeEvidenceId,
    activeEvidence,
    contextOpen,
    sendMessage,
    showEvidence,
    closeEvidence,
  } = useIntelligenceChat();

  return (
    <>
      <ChatWorkspace
        messages={messages}
        thinking={thinking}
        hasMessages={messages.length > 0}
        activeEvidenceId={activeEvidenceId}
        activeEvidence={activeEvidence}
        onSend={sendMessage}
        onShowEvidence={showEvidence}
      />

      {contextOpen && (
        <aside className="fixed right-0 top-0 z-30 h-dvh w-85 flex-none border-l border-manila-dark bg-paper-dim transition-all duration-300">
          <EvidencePanel evidence={activeEvidence} onClose={closeEvidence} />
        </aside>
      )}
    </>
  );
}
