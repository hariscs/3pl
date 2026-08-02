"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  variant = "primary",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title={title}
    >
      <p className="text-sm text-ink/80">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant={variant} onClick={handleConfirm} loading={submitting}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
