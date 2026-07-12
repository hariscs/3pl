import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: children is always the field's input/select, nested inside this label
    <label className="flex flex-col gap-1.5">
      <span className="font-display text-xs font-medium uppercase tracking-wider text-steel">
        {label}
        {required && <span className="ml-1 text-rust">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-steel-light">{hint}</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-sm border border-manila-dark bg-cream px-3 py-2 text-sm text-ink placeholder:text-steel-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${fieldBase} ${props.className ?? ""}`} />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldBase} ${props.className ?? ""}`} />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea {...props} className={`${fieldBase} ${props.className ?? ""}`} />
  );
}
