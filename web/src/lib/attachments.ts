// Load attachment validation — a sibling to file.ts (which stays scoped to
// the single-image Crew profile-photo picker) since Load attachments cover
// three kinds of file with different size limits.

import type { LoadAttachmentCategory } from "@/lib/types";

export const LOAD_ATTACHMENT_LIMITS: Record<LoadAttachmentCategory, number> = {
  photo: 15 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

/** Categorizes by actual MIME type, not just the file extension. */
export function categorizeAttachmentFile(
  file: File,
): LoadAttachmentCategory | null {
  if (IMAGE_TYPES.includes(file.type)) return "photo";
  if (VIDEO_TYPES.includes(file.type)) return "video";
  if (DOCUMENT_TYPES.includes(file.type)) return "document";
  return null;
}

export function validateLoadAttachmentFile(file: File): string | null {
  const category = categorizeAttachmentFile(file);
  if (!category) {
    return `"${file.name}" isn't a supported file type.`;
  }
  const limit = LOAD_ATTACHMENT_LIMITS[category];
  if (file.size > limit) {
    return `"${file.name}" exceeds the ${Math.round(limit / (1024 * 1024))} MB limit for ${category}s.`;
  }
  return null;
}
