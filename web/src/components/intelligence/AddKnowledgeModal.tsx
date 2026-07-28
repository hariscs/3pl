"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { X, Upload, FileText, File, Check } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { KnowledgeItem } from "@/lib/mocks/mockKnowledgeItems";

// ── Types ───────────────────────────────────────────────
type SourceType = "Document" | "PDF" | "Plain Text";

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
  onFile: (f: File | null) => void;
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
      onFile(null);
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
      <div className="flex items-center justify-between rounded-xl border border-manila-dark bg-cream px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
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
          className="ml-3 shrink-0 rounded-lg p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver
            ? "border-rust/40 bg-rust-soft/20"
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
      </div>
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

  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const titleRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

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
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileSelected(f: File | null) {
    setFileError("");
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

  function handleSave() {
    if (!validate()) return;

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
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      handleClose();
    }, 800);
  }

  const accept = SOURCE_TYPES.find((s) => s.value === sourceType)?.accept ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 px-4 py-10">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-manila-dark bg-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-manila-dark px-6 py-4">
          <div>
            <h2 className="intel-section-title">Add Knowledge</h2>
            <p className="mt-0.5 text-[13px] text-steel">
              Add a document, PDF, or plain-text knowledge item.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-steel-light transition-colors hover:bg-manila hover:text-steel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
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

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-manila-dark px-6 py-4">
          <p className="text-[13px] text-steel-light">
            {saved ? (
              <span className="flex items-center gap-1.5 text-freight-dark">
                <Check size={14} />
                Added to Knowledge Hub
              </span>
            ) : (
              "All fields marked with * are required"
            )}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="intel-button-text rounded-xl border border-manila-dark bg-cream px-4 py-2.5 text-steel transition-colors hover:bg-paper-dim active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className="intel-button-text rounded-xl bg-rust px-4 py-2.5 text-cream transition-all duration-200 hover:bg-rust-dark hover:shadow-[0_4px_16px_-4px_var(--color-rust)/0.4] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to Knowledge Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
