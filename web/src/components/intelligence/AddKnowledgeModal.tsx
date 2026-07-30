"use client";

import { Check, File, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { type DragEvent, useRef, useState } from "react";
import { ShimmerText } from "@/components/intelligence/ShimmerText";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { KnowledgeItem } from "@/lib/mocks/mockKnowledgeItems";

// ── Types ───────────────────────────────────────────────
type SourceType = "Document" | "PDF" | "Plain Text";
type UploadStage = "idle" | "validating" | "uploading" | "processing" | "ready";

const SOURCE_TYPES: { value: SourceType; label: string; accept: string }[] = [
  { value: "Document", label: "Document", accept: ".doc,.docx" },
  { value: "PDF", label: "PDF", accept: ".pdf" },
  { value: "Plain Text", label: "Plain Text", accept: "" },
];

const CATEGORIES = [
  "Company",
  "Employees",
  "Operations",
  "Locations",
  "Payroll & Billing",
  "Customer SOPs",
] as const;

const STATUSES = ["Draft", "Published", "Needs Review"] as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const UPLOAD_STEPS = 18;

// ── Helpers ──────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function filenameToTitle(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return name;
  return name.slice(0, dot);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let itemIdCounter = 100;
function nextItemId(): string {
  return `ki-new-${++itemIdCounter}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── File Dropzone ───────────────────────────────────────
function FileDropzone({
  accept,
  file,
  error,
  onFile,
}: {
  accept: string;
  file: File | null;
  error: string;
  onFile: (f: File | null, error?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function validate(f: File): string | null {
    if (f.size > MAX_FILE_SIZE)
      return `File too large (max ${formatFileSize(MAX_FILE_SIZE)})`;
    const exts = accept.split(",");
    const name = f.name.toLowerCase();
    const ok = exts.some((ext) => name.endsWith(ext));
    if (!ok) return `Unsupported file type. Accepted: ${accept}`;
    return null;
  }

  function handleFile(f: File) {
    const err = validate(f);
    if (err) {
      onFile(null, err);
      return;
    }
    onFile(f);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  if (file) {
    return (
      <div className="animate-fade-up flex items-center justify-between rounded-xl border border-manila-dark bg-cream px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rust-soft/40">
            <File size={17} className="text-rust" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">
              {file.name}
            </p>
            <p className="text-[11px] text-steel">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          aria-label="Remove file"
          className="ml-3 shrink-0 rounded-lg p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-150 ${
          dragOver
            ? "scale-[1.01] border-rust/40 bg-rust-soft/20"
            : "border-manila-dark/60 bg-cream hover:border-rust/20 hover:bg-rust-soft/10"
        }`}
      >
        <Upload size={22} className="mx-auto text-steel-light/60" />
        <p className="mt-2.5 text-[13px] font-medium text-steel">
          Drag & drop or click to browse
        </p>
        <p className="mt-1 text-[11px] text-steel-light">
          {accept} · Max {formatFileSize(MAX_FILE_SIZE)}
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-stamp">{error}</p>
      )}
    </div>
  );
}

// ── Staged upload progress ──────────────────────────────
function UploadProgress({
  stage,
  progress,
}: {
  stage: UploadStage;
  progress: number;
}) {
  if (stage === "validating") {
    return <ShimmerText className="text-[13px]">Validating…</ShimmerText>;
  }
  if (stage === "uploading") {
    return (
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-manila-dark/60">
          <div
            className="h-full rounded-full bg-rust transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-xs font-medium text-steel">
          {progress}%
        </span>
      </div>
    );
  }
  if (stage === "processing") {
    return (
      <ShimmerText className="text-[13px]">Processing & indexing…</ShimmerText>
    );
  }
  if (stage === "ready") {
    return (
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.4 }}
        className="flex items-center gap-1.5 text-[13px] font-medium text-freight-dark"
      >
        <Check size={14} />
        Added to Knowledge Hub
      </motion.div>
    );
  }
  return null;
}

// ── Modal ────────────────────────────────────────────────
type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (item: KnowledgeItem) => void;
};

export function AddKnowledgeModal({ open, onClose, onSave }: Props) {
  const [sourceType, setSourceType] = useState<SourceType>("Document");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [plainText, setPlainText] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Draft");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [description, setDescription] = useState("");

  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setSourceType("Document");
    setFile(null);
    setFileError("");
    setPlainText("");
    setTitle("");
    setCategory("");
    setOwner("");
    setStatus("Draft");
    setEffectiveDate("");
    setDescription("");
    setErrors({});
    setStage("idle");
    setProgress(0);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileSelected(f: File | null, error?: string) {
    setFileError(error ?? "");
    setFile(f);
    if (f && !title) {
      setTitle(filenameToTitle(f.name));
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!title.trim()) e.title = "Title is required";
    if (!category) e.category = "Category is required";
    if (!owner.trim()) e.owner = "Owner is required";
    if (!effectiveDate) e.effectiveDate = "Effective date is required";
    if (!description.trim()) e.description = "Description is required";

    if (sourceType === "Plain Text") {
      if (!plainText.trim()) e.plainText = "Knowledge content is required";
    } else {
      if (!file) e.file = "A file is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setStage("validating");
    await delay(400);

    setStage("uploading");
    setProgress(0);
    for (let i = 1; i <= UPLOAD_STEPS; i++) {
      await delay(45);
      setProgress(Math.round((i / UPLOAD_STEPS) * 100));
    }

    setStage("processing");
    await delay(700);

    const type =
      sourceType === "Plain Text"
        ? "Plain Text"
        : sourceType === "PDF"
          ? "PDF"
          : "Document";

    const item: KnowledgeItem = {
      id: nextItemId(),
      title: title.trim(),
      type,
      category,
      status,
      owner: owner.trim(),
      effectiveDate,
      lastReviewedAt: today(),
      description: description.trim(),
    };

    onSave(item);
    setStage("ready");
    await delay(900);
    handleClose();
  }

  const accept = SOURCE_TYPES.find((s) => s.value === sourceType)?.accept ?? "";
  const busy = stage !== "idle";

  const footer = (
    <div className="flex flex-col gap-3">
      {busy && <UploadProgress stage={stage} progress={progress} />}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-steel-light">
          {stage === "idle" && "All fields marked with * are required"}
        </p>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy}>
            Add to Knowledge Hub
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : handleClose}
      title="Add Knowledge"
      size="lg"
      footer={footer}
    >
      <div className="space-y-6">
        <p className="-mt-1 text-[13px] text-steel">
          Add a document, PDF, or plain-text knowledge item.
        </p>

        {/* Source type selector */}
        <Field label="Source Type" required>
          <div className="flex gap-1.5">
            {SOURCE_TYPES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setSourceType(s.value);
                  setFile(null);
                  setFileError("");
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                  sourceType === s.value
                    ? "bg-rust-soft/60 text-rust-dark ring-1 ring-rust/20"
                    : "text-steel/60 hover:bg-manila hover:text-steel"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        {/* File dropzone or plain text */}
        {sourceType === "Plain Text" ? (
          <Field
            label="Knowledge Content"
            required
            hint={`${plainText.length} characters`}
          >
            <Textarea
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              placeholder="Write or paste the company policy, procedure, location information, or other knowledge that 3PL Intelligence should understand."
              rows={6}
              className="min-h-35"
            />
            {errors.plainText && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.plainText}
              </p>
            )}
          </Field>
        ) : (
          <Field label="Upload File" required>
            <FileDropzone
              accept={accept}
              file={file}
              error={fileError}
              onFile={handleFileSelected}
            />
            {errors.file && !fileError && (
              <p className="mt-1.5 text-xs font-medium text-stamp">
                {errors.file}
              </p>
            )}
          </Field>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Title" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Knowledge item title"
              />
              {errors.title && (
                <p className="mt-1 text-xs font-medium text-stamp">
                  {errors.title}
                </p>
              )}
            </Field>
          </div>

          <Field label="Category" required>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>
                Select category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.category && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.category}
              </p>
            )}
          </Field>

          <Field label="Owner" required>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. HR Department"
            />
            {errors.owner && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.owner}
              </p>
            )}
          </Field>

          <Field label="Status" required>
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof STATUSES)[number])
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Effective Date" required>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
            {errors.effectiveDate && (
              <p className="mt-1 text-xs font-medium text-stamp">
                {errors.effectiveDate}
              </p>
            )}
          </Field>
        </div>

        <Field
          label="Description"
          required
          hint="A concise summary of what this knowledge item contains"
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the content..."
            rows={2}
          />
          {errors.description && (
            <p className="mt-1 text-xs font-medium text-stamp">
              {errors.description}
            </p>
          )}
        </Field>
      </div>
    </Modal>
  );
}
