"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { ApiError, api } from "./api/client";
import { useAuth } from "./auth";
import type { LoadAttachment, LoadAttachmentCategory } from "./types";

// Load attachments are per-load and potentially numerous, so — unlike the
// small master-data lists — they're fetched on demand per detail page
// rather than joined into the app-boot parallel-fetch block in store.tsx.
// Admin and the field view both call this same hook against the same
// shared repository (lib/load-attachments.ts via mock-handlers.ts).

type NewAttachment = {
  fileName: string;
  category: LoadAttachmentCategory;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  source: "admin" | "field";
};

export function useLoadAttachments(loadId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["loadAttachments", loadId],
    queryFn: () => api.get<LoadAttachment[]>(`/loads/${loadId}/attachments`),
    enabled: !!loadId,
  });

  const invalidate = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: ["loadAttachments", loadId] }),
    [queryClient, loadId],
  );

  const addAttachment = useCallback(
    async (input: NewAttachment) => {
      if (!loadId) return undefined;
      try {
        const created = await api.post<LoadAttachment>(
          `/loads/${loadId}/attachments`,
          { ...input, uploadedByUserId: user?.id },
        );
        await invalidate();
        toast.success("Attachment uploaded.");
        return created;
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Upload failed.";
        toast.error(message);
        return undefined;
      }
    },
    [loadId, invalidate, user],
  );

  const toggleAttachmentArchive = useCallback(
    async (attachmentId: string) => {
      if (!loadId) return;
      try {
        await api.post(
          `/loads/${loadId}/attachments/${attachmentId}/toggle-archive`,
        );
        await invalidate();
        toast.success("Attachment updated.");
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Something went wrong.";
        toast.error(message);
      }
    },
    [loadId, invalidate],
  );

  return {
    attachments: query.data ?? [],
    isLoading: query.isLoading,
    addAttachment,
    toggleAttachmentArchive,
  };
}
