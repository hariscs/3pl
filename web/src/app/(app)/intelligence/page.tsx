"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, PanelRightOpen } from "lucide-react";
import { ConversationHistory } from "@/components/intelligence/ConversationHistory";
import { ChatWorkspace } from "@/components/intelligence/ChatWorkspace";
import { EvidencePanel } from "@/components/intelligence/EvidencePanel";
import { mockIntelligenceStream } from "@/lib/mocks/intelligenceStream";
import { MOCK_CONVERSATIONS } from "@/lib/mocks/conversationHistory";
import type { Message, Evidence, Conversation, StreamEvent } from "@/lib/intelligence";

let messageCounter = 0;
function nextMessageId() {
    return `msg-${++messageCounter}`;
}

let convCounter = MOCK_CONVERSATIONS.length;
function nextConvId() {
    return `conv-${++convCounter}`;
}

export default function IntelligencePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [contextOpen, setContextOpen] = useState(false);
    const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
    const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [thinking, setThinking] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const streamingRef = useRef(false);

    const hasMessages = messages.length > 0;

    function handleNewConversation() {
        setMessages([]);
        setActiveEvidence(null);
        setActiveEvidenceId(null);
        setActiveConversationId(null);
    }

    function handleSelectConversation(_id: string) {
        // Placeholder — conversations are not persisted yet
    }

    function handleRenameConversation(id: string, newTitle: string) {
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c)));
    }

    const handleSend = useCallback(async (content: string) => {
        if (streamingRef.current) return;
        streamingRef.current = true;

        // Add user message
        const userMsg: Message = { id: nextMessageId(), role: "user", content, createdAt: Date.now() };
        const isFirst = !hasMessages;

        setMessages((prev) => [...prev, userMsg]);
        setThinking(true);

        // If first message in a new conversation, add to history
        if (isFirst) {
            const title = content.length > 40 ? content.slice(0, 40) + "…" : content;
            const conv: Conversation = {
                id: nextConvId(),
                title,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                group: "today",
                preview: content,
            };
            setConversations((prev) => [conv, ...prev]);
            setActiveConversationId(conv.id);
        }

        // Collect assistant response from stream
        let assistantContent = "";
        let assistantId = nextMessageId();
        let evidenceFromStream: Evidence | null = null;

        const stream = mockIntelligenceStream();

        for await (const event of stream) {
            switch (event.type) {
                case "response.started":
                    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", createdAt: Date.now() }]);
                    break;
                case "message.delta":
                    assistantContent += event.delta;
                    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m)));
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

        // Link evidence to the assistant message
        if (evidenceFromStream) {
            setActiveEvidenceId(assistantId);
        }

        streamingRef.current = false;
    }, [hasMessages]);

    function handleShowEvidence(messageId: string) {
        setActiveEvidenceId(messageId);
        setContextOpen(true);
    }

    function handleCloseEvidence() {
        setContextOpen(false);
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

            <main className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex h-11 flex-none items-center justify-between px-5">
                    <Link href="/" className="flex items-center gap-1.5 text-[12px] font-medium text-steel transition-colors hover:text-ink">
                        <ArrowLeft size={14} />
                        Back to Portal
                    </Link>
                    {!contextOpen && (
                        <button type="button" onClick={() => setContextOpen(true)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-steel/50 transition-colors hover:bg-manila hover:text-steel">
                            <PanelRightOpen size={13} />
                            Evidence
                        </button>
                    )}
                </div>
                <ChatWorkspace
                    messages={messages}
                    thinking={thinking}
                    hasMessages={hasMessages}
                    activeEvidenceId={activeEvidenceId}
                    activeEvidence={activeEvidence}
                    onSend={handleSend}
                    onShowEvidence={handleShowEvidence}
                />
            </main>

            {contextOpen && (
                <aside className="w-[340px] flex-none border-l border-manila-dark bg-paper-dim transition-all duration-300">
                    <EvidencePanel evidence={activeEvidence} onClose={handleCloseEvidence} />
                </aside>
            )}
        </div>
    );
}