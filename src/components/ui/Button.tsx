import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-rust text-cream border border-rust hover:bg-rust-dark hover:border-rust-dark",
  secondary:
    "bg-transparent text-ink border border-manila-dark hover:bg-manila",
  danger: "bg-transparent text-stamp border border-stamp hover:bg-stamp-soft",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-manila",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ variant = "primary", className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm font-medium tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});
