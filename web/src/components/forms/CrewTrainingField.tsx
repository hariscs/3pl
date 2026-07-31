"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { TRAINING_TYPE_IDS, trainingTypeLabel } from "@/lib/crew-catalogues";
import type { CrewTrainingRecord } from "@/lib/types";

const TRAINING_TYPE_OPTIONS = TRAINING_TYPE_IDS.map((id) => ({
  value: id,
  label: trainingTypeLabel(id),
}));

type Draft = Omit<CrewTrainingRecord, "id"> & { id?: string };

const emptyDraft: Draft = {
  trainingTypeId: TRAINING_TYPE_IDS[0] ?? "",
  completedAt: "",
  expiresAt: "",
  provider: "",
  notes: "",
};

let draftCounter = 0;
function nextDraftId(): string {
  return `train-${Date.now()}-${++draftCounter}`;
}

export function CrewTrainingField({
  trainingRecords,
  onChange,
}: {
  trainingRecords: CrewTrainingRecord[];
  onChange: (trainingRecords: CrewTrainingRecord[]) => void;
}) {
  const [editing, setEditing] = useState<{
    index: number | null;
    draft: Draft;
  } | null>(null);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing({ index: null, draft: emptyDraft });
    setError("");
  }

  function openEdit(index: number) {
    setEditing({ index, draft: { ...trainingRecords[index] } });
    setError("");
  }

  function closeModal() {
    setEditing(null);
    setError("");
  }

  function removeRecord(index: number) {
    onChange(trainingRecords.filter((_, i) => i !== index));
  }

  function updateDraft(patch: Partial<Draft>) {
    setEditing((prev) =>
      prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev,
    );
  }

  function saveDraft() {
    if (!editing) return;
    const { draft } = editing;
    if (!draft.trainingTypeId) {
      setError("Training type is required.");
      return;
    }
    if (!draft.completedAt) {
      setError("Completion date is required.");
      return;
    }
    if (draft.expiresAt && draft.expiresAt < draft.completedAt) {
      setError("Expiration date cannot be before the completion date.");
      return;
    }
    const record: CrewTrainingRecord = {
      id: draft.id ?? nextDraftId(),
      trainingTypeId: draft.trainingTypeId,
      completedAt: draft.completedAt,
      expiresAt: draft.expiresAt || undefined,
      provider: draft.provider || undefined,
      notes: draft.notes || undefined,
    };
    onChange(
      editing.index === null
        ? [...trainingRecords, record]
        : trainingRecords.map((r, i) => (i === editing.index ? record : r)),
    );
    closeModal();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Training</p>
      <div className="mt-2.5 space-y-2">
        {trainingRecords.map((r, i) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-manila-dark bg-cream px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {trainingTypeLabel(r.trainingTypeId)}
              </p>
              <p className="mt-0.5 truncate text-xs text-steel">
                Completed {r.completedAt}
                {r.provider ? ` · ${r.provider}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(i)}
                aria-label="Edit training record"
                className="rounded-md p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeRecord(i)}
                aria-label="Remove training record"
                className="rounded-md p-1.5 text-steel-light transition-colors hover:bg-stamp-soft hover:text-stamp"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {trainingRecords.length === 0 && (
          <p className="text-sm text-steel-light">
            No training records added yet.
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        onClick={openAdd}
      >
        <Plus size={14} />
        Add training record
      </Button>

      <Modal
        open={editing !== null}
        onClose={closeModal}
        title={
          editing?.index === null
            ? "Add Training Record"
            : "Edit Training Record"
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Training Type" required>
              <SelectMenu
                value={editing.draft.trainingTypeId}
                onChange={(value) => updateDraft({ trainingTypeId: value })}
                options={TRAINING_TYPE_OPTIONS}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Completion Date" required>
                <Input
                  type="date"
                  value={editing.draft.completedAt}
                  onChange={(e) => updateDraft({ completedAt: e.target.value })}
                />
              </Field>
              <Field label="Expiration Date">
                <Input
                  type="date"
                  value={editing.draft.expiresAt ?? ""}
                  onChange={(e) => updateDraft({ expiresAt: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Provider / Instructor">
              <Input
                value={editing.draft.provider ?? ""}
                placeholder="Optional"
                onChange={(e) => updateDraft({ provider: e.target.value })}
              />
            </Field>
            <Field label="Notes">
              <Textarea
                rows={2}
                placeholder="Optional"
                value={editing.draft.notes ?? ""}
                onChange={(e) => updateDraft({ notes: e.target.value })}
              />
            </Field>
            {error && <p className="text-xs font-medium text-stamp">{error}</p>}
            <div className="flex justify-end gap-2.5 pt-1">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="button" onClick={saveDraft}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
