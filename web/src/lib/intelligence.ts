// ── Message ──────────────────────────────────────────────
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  attachments?: SentAttachment[];
};

// ── Chat Attachments ─────────────────────────────────────
export type ChatAttachment = {
  id: string;
  file: File;
  name: string;
  mimeType: string;
  size: number;
  category: "image" | "document";
  previewUrl?: string;
  status: "ready" | "invalid";
  error?: string;
};

export type SentAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: "image" | "document";
  previewUrl?: string;
};

// ── Evidence ─────────────────────────────────────────────
export type EvidenceSource = {
  id: string;
  type: string;
  label: string;
  status: "available" | "unavailable";
};

export type EvidenceRecord = {
  id: string;
  recordType: string;
  title: string;
  subtitle: string;
};

export type EvidenceDocument = {
  id: string;
  name: string;
  fileType: string;
};

export type Evidence = {
  sources: EvidenceSource[];
  records: EvidenceRecord[];
  documents: EvidenceDocument[];
  attachments: EvidenceDocument[];
};

// ── Response ─────────────────────────────────────────────
export type IntelligenceResponse = {
  id: string;
  conversationId: string;
  status: "complete";
  createdAt: number;
  message: Message;
  evidence: Evidence;
  metadata: {
    requestId: string;
    responseTimeMs: number;
    generatedAt: number;
    demo: true;
  };
};

// ── Conversation ────────────────────────────────────────
export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  preview: string;
};

// ── Stream events ───────────────────────────────────────
export type StreamEvent =
  | { type: "response.started"; responseId: string }
  | { type: "message.delta"; delta: string }
  | { type: "evidence.available"; evidence: Evidence }
  | { type: "response.completed" };
