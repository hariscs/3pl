"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { type CertificationStatus, getCertificationStatus } from "@/lib/crew";
import {
  CERTIFICATION_TYPE_IDS,
  certificationTypeLabel,
} from "@/lib/crew-catalogues";
import type { CrewCertification } from "@/lib/types";

const STATUS_LABELS: Record<CertificationStatus, string> = {
  no_expiry: "No Expiry",
  valid: "Valid",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
};

const STATUS_CLASSES: Record<CertificationStatus, string> = {
  no_expiry: "bg-manila text-steel",
  valid: "bg-freight-soft text-freight-dark",
  expiring_soon: "bg-amber-soft text-amber",
  expired: "bg-stamp-soft text-stamp",
};

const CERTIFICATION_TYPE_OPTIONS = CERTIFICATION_TYPE_IDS.map((id) => ({
  value: id,
  label: certificationTypeLabel(id),
}));

type Draft = Omit<CrewCertification, "id"> & { id?: string };

const emptyDraft: Draft = {
  certificationTypeId: CERTIFICATION_TYPE_IDS[0] ?? "",
  certificateNumber: "",
  issuingAuthority: "",
  issuedAt: "",
  expiresAt: "",
  notes: "",
};

let draftCounter = 0;
function nextDraftId(): string {
  return `cert-${Date.now()}-${++draftCounter}`;
}

export function CrewCertificationsField({
  certifications,
  onChange,
}: {
  certifications: CrewCertification[];
  onChange: (certifications: CrewCertification[]) => void;
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
    setEditing({ index, draft: { ...certifications[index] } });
    setError("");
  }

  function closeModal() {
    setEditing(null);
    setError("");
  }

  function removeCertification(index: number) {
    onChange(certifications.filter((_, i) => i !== index));
  }

  function updateDraft(patch: Partial<Draft>) {
    setEditing((prev) =>
      prev ? { ...prev, draft: { ...prev.draft, ...patch } } : prev,
    );
  }

  function saveDraft() {
    if (!editing) return;
    const { draft } = editing;
    if (!draft.certificationTypeId) {
      setError("Certification type is required.");
      return;
    }
    if (draft.issuedAt && draft.expiresAt && draft.expiresAt < draft.issuedAt) {
      setError("Expiration date cannot be before the issued date.");
      return;
    }
    const record: CrewCertification = {
      id: draft.id ?? nextDraftId(),
      certificationTypeId: draft.certificationTypeId,
      certificateNumber: draft.certificateNumber || undefined,
      issuingAuthority: draft.issuingAuthority || undefined,
      issuedAt: draft.issuedAt || undefined,
      expiresAt: draft.expiresAt || undefined,
      notes: draft.notes || undefined,
    };
    onChange(
      editing.index === null
        ? [...certifications, record]
        : certifications.map((c, i) => (i === editing.index ? record : c)),
    );
    closeModal();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Certifications</p>
      <div className="mt-2.5 space-y-2">
        {certifications.map((c, i) => {
          const status = getCertificationStatus(c);
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-manila-dark bg-cream px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {certificationTypeLabel(c.certificationTypeId)}
                </p>
                <p className="mt-0.5 truncate text-xs text-steel">
                  {c.expiresAt ? `Expires ${c.expiresAt}` : "No expiration"}
                  {c.issuingAuthority ? ` · ${c.issuingAuthority}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLASSES[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
                <button
                  type="button"
                  onClick={() => openEdit(i)}
                  aria-label="Edit certification"
                  className="rounded-md p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeCertification(i)}
                  aria-label="Remove certification"
                  className="rounded-md p-1.5 text-steel-light transition-colors hover:bg-stamp-soft hover:text-stamp"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {certifications.length === 0 && (
          <p className="text-sm text-steel-light">
            No certifications added yet.
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
        Add certification
      </Button>

      <Modal
        open={editing !== null}
        onClose={closeModal}
        title={
          editing?.index === null ? "Add Certification" : "Edit Certification"
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Certification Type" required>
              <SelectMenu
                value={editing.draft.certificationTypeId}
                onChange={(value) =>
                  updateDraft({ certificationTypeId: value })
                }
                options={CERTIFICATION_TYPE_OPTIONS}
              />
            </Field>
            <Field label="Certificate Number">
              <Input
                value={editing.draft.certificateNumber ?? ""}
                placeholder="Optional"
                onChange={(e) =>
                  updateDraft({ certificateNumber: e.target.value })
                }
              />
            </Field>
            <Field label="Issuing Authority">
              <Input
                value={editing.draft.issuingAuthority ?? ""}
                placeholder="Optional"
                onChange={(e) =>
                  updateDraft({ issuingAuthority: e.target.value })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Issued Date">
                <Input
                  type="date"
                  value={editing.draft.issuedAt ?? ""}
                  onChange={(e) => updateDraft({ issuedAt: e.target.value })}
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
