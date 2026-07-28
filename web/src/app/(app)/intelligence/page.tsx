"use client";

import { useState, useCallback, useRef } from "react";
import { PanelRightOpen } from "lucide-react";
import { ChatWorkspace } from "@/components/intelligence/ChatWorkspace";
import { EvidencePanel } from "@/components/intelligence/EvidencePanel";
import { mockIntelligenceStream } from "@/lib/mocks/intelligenceStream";
import type { Message, Evidence, SentAttachment } from "@/lib/intelligence";

let messageCounter = 0;
function nextMessageId() {
  return `msg-${++messageCounter}`;
}

export default function IntelligenceChatPage() {
  const [contextOpen, setContextOpen] = useState(false);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const streamingRef = useRef(false);

  const hasMessages = messages.length > 0;

  const handleSend = useCallback(
    async (content: string, attachments?: SentAttachment[]) => {
      if (streamingRef.current) return;
      streamingRef.current = true;

      const userMsg: Message = {
        id: nextMessageId(),
        role: "user",
        content,
        createdAt: Date.now(),
        attachments: attachments ?? [],
      };
      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);

      let assistantContent = "";
      let assistantId = nextMessageId();
      let evidenceFromStream: Evidence | null = null;

      const stream = mockIntelligenceStream();

      for await (const event of stream) {
        switch (event.type) {
          case "response.started":
            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: "",
                createdAt: Date.now(),
              },
            ]);
            break;
          case "message.delta":
            assistantContent += event.delta;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m,
              ),
            );
            break;
          case "evidence.available":
            evidenceFromStream = event.evidence;
            setActiveEvidence(event.evidence);
            break;
          case "response.completed":
            setThinking(false);
            break;
        }
      }

      if (evidenceFromStream) {
        setActiveEvidenceId(assistantId);
      }

      streamingRef.current = false;
    },
    [],
  );

  function handleShowEvidence(messageId: string) {
    setActiveEvidenceId(messageId);
    setContextOpen(true);
  }

  function handleCloseEvidence() {
    setContextOpen(false);
  }

  return (
    <>
      <ChatWorkspace
        messages={messages}
        thinking={thinking}
        hasMessages={hasMessages}
        activeEvidenceId={activeEvidenceId}
        activeEvidence={activeEvidence}
        onSend={handleSend}
        onShowEvidence={handleShowEvidence}
      />

      {contextOpen && (
        <aside className="fixed right-0 top-0 z-30 h-screen w-85 flex-none border-l border-manila-dark bg-paper-dim transition-all duration-300">
          <EvidencePanel
            evidence={activeEvidence}
            onClose={handleCloseEvidence}
          />
        </aside>
      )}
    </>
  );
}
