// Shared Load attachment in-memory mock store. Mirrors lib/invoices.ts's
// pattern (module-level array + accessor functions) — a normalized,
// loadId-scoped collection consumed identically by the Admin detail page
// and the field view, never embedded inside Load itself.

import type { LoadAttachment } from "./types";

const SEED_ATTACHMENTS: LoadAttachment[] = [
  {
    id: "att-1",
    loadId: "load-249",
    fileName: "container-photo.png",
    category: "photo",
    mimeType: "image/png",
    sizeBytes: 586,
    fileUrl: "/mock-attachments/container-photo.png",
    thumbnailUrl: "/mock-attachments/container-photo.png",
    title: "Container photo",
    uploadedByUserId: "user-lead-triumph",
    uploadedAt: "2026-07-29T07:05:00Z",
    source: "field",
    status: "active",
  },
  {
    id: "att-2",
    loadId: "load-249",
    fileName: "seal-photo.png",
    category: "photo",
    mimeType: "image/png",
    sizeBytes: 584,
    fileUrl: "/mock-attachments/seal-photo.png",
    thumbnailUrl: "/mock-attachments/seal-photo.png",
    title: "Seal photo",
    uploadedByUserId: "user-lead-triumph",
    uploadedAt: "2026-07-29T07:07:00Z",
    source: "field",
    status: "active",
  },
  {
    id: "att-3",
    loadId: "load-249",
    fileName: "bill-of-lading.txt",
    category: "document",
    mimeType: "text/plain",
    sizeBytes: 215,
    fileUrl: "/mock-attachments/bill-of-lading.txt",
    title: "Bill of Lading",
    uploadedByUserId: "user-admin",
    uploadedAt: "2026-07-29T16:05:00Z",
    source: "admin",
    status: "active",
  },
  {
    id: "att-4",
    loadId: "load-248",
    fileName: "before-work-photo.png",
    category: "photo",
    mimeType: "image/png",
    sizeBytes: 584,
    fileUrl: "/mock-attachments/before-work-photo.png",
    thumbnailUrl: "/mock-attachments/before-work-photo.png",
    title: "Before-work photo",
    uploadedByUserId: "user-lead-triumph",
    uploadedAt: "2026-07-30T05:58:00Z",
    source: "field",
    status: "active",
  },
  {
    id: "att-5",
    loadId: "load-248",
    fileName: "signed-delivery-receipt.txt",
    category: "document",
    mimeType: "text/plain",
    sizeBytes: 197,
    fileUrl: "/mock-attachments/signed-delivery-receipt.txt",
    title: "Signed Delivery Receipt",
    uploadedByUserId: "user-admin",
    uploadedAt: "2026-07-30T13:40:00Z",
    source: "admin",
    status: "active",
  },
  {
    id: "att-6",
    loadId: "load-247",
    fileName: "container-photo.png",
    category: "photo",
    mimeType: "image/png",
    sizeBytes: 586,
    fileUrl: "/mock-attachments/container-photo.png",
    thumbnailUrl: "/mock-attachments/container-photo.png",
    title: "Mid-shift container photo",
    uploadedByUserId: "user-lead-triumph",
    uploadedAt: "2026-07-31T09:15:00Z",
    source: "field",
    status: "active",
  },
];

let attachments = structuredClone(SEED_ATTACHMENTS);

export function resetLoadAttachments(): void {
  attachments = structuredClone(SEED_ATTACHMENTS);
}

export function listLoadAttachments(loadId: string): LoadAttachment[] {
  return attachments.filter((a) => a.loadId === loadId);
}

export function getLoadAttachmentById(id: string): LoadAttachment | undefined {
  return attachments.find((a) => a.id === id);
}

export function addLoadAttachment(attachment: LoadAttachment): void {
  attachments.push(attachment);
}

export function updateLoadAttachment(
  id: string,
  patch: Partial<LoadAttachment>,
): LoadAttachment | undefined {
  const idx = attachments.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  attachments[idx] = { ...attachments[idx], ...patch };
  return attachments[idx];
}
