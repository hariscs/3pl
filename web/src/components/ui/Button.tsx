import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-rust text-cream border border-rust hover:bg-rust-dark hover:border-rust-dark",
  secondary: "bg-cream text-ink border border-manila-dark hover:bg-paper-dim",
  danger: "bg-cream text-stamp border border-stamp/40 hover:bg-stamp-soft",
  ghost:
    "bg-transparent text-steel border border-transparent hover:bg-paper-dim hover:text-ink",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    /** Shows a spinner and disables the button — for an action already in flight. */
    loading?: boolean;
  }
>(function Button(
  {
    variant = "primary",
    loading = false,
    disabled,
    className = "",
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
});
