"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
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

  const originatingQuestion = useMemo(() => {
    if (!activeEvidenceId) return undefined;
    const evidenceIndex = messages.findIndex((m) => m.id === activeEvidenceId);
    for (let i = evidenceIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") return messages[i].content;
    }
    return undefined;
  }, [messages, activeEvidenceId]);

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

      <AnimatePresence>
        {contextOpen && (
          <motion.aside
            key="evidence-panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-30 h-dvh w-85 flex-none border-l border-manila-dark bg-cream shadow-[-8px_0_30px_-15px_rgba(15,23,42,0.15)]"
          >
            <EvidencePanel
              evidence={activeEvidence}
              onClose={closeEvidence}
              originatingQuestion={originatingQuestion}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
