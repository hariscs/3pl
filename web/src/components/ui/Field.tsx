import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: children is always the field's input/select, nested inside this label
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-rust">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-steel-light">{hint}</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink placeholder:text-steel-light transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-paper-dim disabled:text-steel disabled:border-manila-dark";

const fieldBorder =
  "border-manila-dark bg-cream focus:border-rust focus:ring-rust/20";
const fieldBorderInvalid =
  "border-stamp bg-cream focus:border-stamp focus:ring-stamp/20";

type InvalidProp = { invalid?: boolean };

export function Input({
  invalid,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & InvalidProp) {
  return (
    <input
      {...props}
      className={`${fieldBase} ${invalid ? fieldBorderInvalid : fieldBorder} ${className}`}
    />
  );
}

export function Select({
  invalid,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & InvalidProp) {
  return (
    <select
      {...props}
      className={`${fieldBase} ${invalid ? fieldBorderInvalid : fieldBorder} appearance-none bg-size-4 bg-position-[right_14px_center] bg-no-repeat pr-9 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        ...(props.style ?? {}),
      }}
    />
  );
}

export function Textarea({
  invalid,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp) {
  return (
    <textarea
      {...props}
      className={`${fieldBase} ${invalid ? fieldBorderInvalid : fieldBorder} ${className}`}
    />
  );
}
