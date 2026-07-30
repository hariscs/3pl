"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Conversation,
  Evidence,
  Message,
  SentAttachment,
} from "@/lib/intelligence";
import {
  MOCK_CONVERSATION_MESSAGES,
  MOCK_CONVERSATIONS,
  MOCK_EVIDENCE_BY_MESSAGE,
} from "@/lib/mocks/conversationHistory";
import { mockIntelligenceStream } from "@/lib/mocks/intelligenceStream";

let messageCounter = 0;
function nextMessageId() {
  return `msg-${++messageCounter}`;
}

let conversationCounter = 0;
function nextConversationId() {
  return `conv-new-${++conversationCounter}`;
}

function deriveTitle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "New conversation";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

type ChatContextValue = {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  thinking: boolean;
  contextOpen: boolean;
  activeEvidenceId: string | null;
  activeEvidence: Evidence | null;
  sendMessage: (content: string, attachments?: SentAttachment[]) => void;
  selectConversation: (id: string) => void;
  startNewConversation: () => void;
  renameConversation: (id: string, newTitle: string) => void;
  showEvidence: (messageId: string) => void;
  closeEvidence: () => void;
};

const IntelligenceChatContext = createContext<ChatContextValue | null>(null);

export function IntelligenceChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, Message[]>
  >(MOCK_CONVERSATION_MESSAGES);
  const [evidenceByMessage, setEvidenceByMessage] = useState<
    Record<string, Evidence>
  >(MOCK_EVIDENCE_BY_MESSAGE);
  const [thinking, setThinking] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const streamingRef = useRef(false);

  const messages = activeConversationId
    ? (messagesByConversation[activeConversationId] ?? [])
    : [];
  const activeEvidence = activeEvidenceId
    ? (evidenceByMessage[activeEvidenceId] ?? null)
    : null;

  const sendMessage = useCallback(
    async (content: string, attachments?: SentAttachment[]) => {
      if (streamingRef.current) return;
      if (!content.trim() && !(attachments && attachments.length > 0)) return;
      streamingRef.current = true;

      const targetId = activeConversationId ?? nextConversationId();
      if (!activeConversationId) setActiveConversationId(targetId);

      const userMsg: Message = {
        id: nextMessageId(),
        role: "user",
        content,
        createdAt: Date.now(),
        attachments: attachments ?? [],
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] ?? []), userMsg],
      }));

      setConversations((prev) => {
        const now = Date.now();
        const exists = prev.some((c) => c.id === targetId);
        if (exists) {
          return prev.map((c) =>
            c.id === targetId
              ? { ...c, updatedAt: now, preview: content || c.preview }
              : c,
          );
        }
        return [
          {
            id: targetId,
            title: deriveTitle(content),
            createdAt: now,
            updatedAt: now,
            preview: content,
          },
          ...prev,
        ];
      });

      setThinking(true);
      setContextOpen(false);

      let assistantContent = "";
      let receivedEvidence: Evidence | null = null;
      const assistantId = nextMessageId();

      const stream = mockIntelligenceStream();
      for await (const event of stream) {
        switch (event.type) {
          case "response.started":
            setMessagesByConversation((prev) => ({
              ...prev,
              [targetId]: [
                ...(prev[targetId] ?? []),
                {
                  id: assistantId,
                  role: "assistant",
                  content: "",
                  createdAt: Date.now(),
                },
              ],
            }));
            break;
          case "message.delta":
            assistantContent += event.delta;
            setMessagesByConversation((prev) => ({
              ...prev,
              [targetId]: (prev[targetId] ?? []).map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m,
              ),
            }));
            break;
          case "evidence.available":
            receivedEvidence = event.evidence;
            setEvidenceByMessage((prev) => ({
              ...prev,
              [assistantId]: event.evidence,
            }));
            break;
          case "response.completed":
            setThinking(false);
            break;
        }
      }

      if (receivedEvidence) setActiveEvidenceId(assistantId);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, updatedAt: Date.now() } : c,
        ),
      );

      streamingRef.current = false;
    },
    [activeConversationId],
  );

  const selectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      setActiveEvidenceId(null);
      setContextOpen(false);
      router.push("/intelligence");
    },
    [router],
  );

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setActiveEvidenceId(null);
    setContextOpen(false);
    router.push("/intelligence");
  }, [router]);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c,
      ),
    );
  }, []);

  const showEvidence = useCallback((messageId: string) => {
    setActiveEvidenceId(messageId);
    setContextOpen(true);
  }, []);

  const closeEvidence = useCallback(() => {
    setContextOpen(false);
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      activeConversationId,
      messages,
      thinking,
      contextOpen,
      activeEvidenceId,
      activeEvidence,
      sendMessage,
      selectConversation,
      startNewConversation,
      renameConversation,
      showEvidence,
      closeEvidence,
    }),
    [
      conversations,
      activeConversationId,
      messages,
      thinking,
      contextOpen,
      activeEvidenceId,
      activeEvidence,
      sendMessage,
      selectConversation,
      startNewConversation,
      renameConversation,
      showEvidence,
      closeEvidence,
    ],
  );

  return (
    <IntelligenceChatContext.Provider value={value}>
      {children}
    </IntelligenceChatContext.Provider>
  );
}

export function useIntelligenceChat() {
  const ctx = useContext(IntelligenceChatContext);
  if (!ctx) {
    throw new Error(
      "useIntelligenceChat must be used within IntelligenceChatProvider",
    );
  }
  return ctx;
}
