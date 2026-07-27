"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

type Props = {
    url: string | null;
    filename: string;
    onClose: () => void;
};

export function ImagePreviewModal({ url, filename, onClose }: Props) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (!url) return;
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [url, handleKeyDown]);

    if (!url) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-10">
            {/* Backdrop */}
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default" />

            {/* Content */}
            <div className="relative z-10 flex max-h-[85vh] max-w-2xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-manila-dark px-5 py-3.5">
                    <p className="truncate text-[13px] font-medium text-ink">{filename}</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Image */}
                <div className="flex items-center justify-center p-4">
                    <img
                        src={url}
                        alt={filename}
                        className="max-h-[70vh] max-w-full rounded-xl object-contain"
                    />
                </div>
            </div>
        </div>
    );
}