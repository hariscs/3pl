import { MOCK_RESPONSE, MOCK_ASSISTANT_CONTENT } from "@/lib/mocks/intelligenceResponse";
import type { StreamEvent, Evidence } from "@/lib/intelligence";

const CHUNK_SIZE = 8;
const CHUNK_DELAY = 55;

function splitIntoChunks(text: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

/**
 * Simulates a server-sent event stream for 3PL Intelligence responses.
 *
 * Emits:
 *   1. response.started
 *   2. message.delta  (repeated for each text chunk)
 *   3. evidence.available
 *   4. response.completed
 *
 * Later this will be replaced with a real SSE endpoint.
 */
export async function* mockIntelligenceStream(): AsyncGenerator<StreamEvent> {
    const response = MOCK_RESPONSE;
    const chunks = splitIntoChunks(MOCK_ASSISTANT_CONTENT, CHUNK_SIZE);

    // 1. Stream started
    yield { type: "response.started", responseId: response.id };

    // 2. Stream text chunks
    for (const chunk of chunks) {
        await delay(CHUNK_DELAY);
        yield { type: "message.delta", delta: chunk };
    }

    // 3. Evidence available
    await delay(200);
    yield { type: "evidence.available", evidence: response.evidence };

    // 4. Stream completed
    yield { type: "response.completed" };
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}