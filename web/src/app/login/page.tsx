"use client";

import {
  ArrowRight,
  Brain,
  ChartNoAxesCombined,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

type InputType = "email" | "password" | "text";

const FEATURES = [
  { icon: ClipboardList, label: "Manage Loads" },
  { icon: Users, label: "Track Crew" },
  { icon: DollarSign, label: "Calculate Payroll" },
  { icon: Clock, label: "Customer Billing" },
  { icon: Brain, label: "AI Crew Matching" },
  { icon: Sparkles, label: "Smart Forecasting" },
  { icon: ChartNoAxesCombined, label: "Predictive Analytics" },
];

export default function LoginPage() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in — skip the form.
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign in. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh lg:h-dvh lg:overflow-hidden">
      {/* ── Left Panel ── */}
      <section className="relative hidden overflow-hidden bg-paper lg:block lg:w-[58%]">
        {/* Warehouse image in bottom-right, masked to fade naturally */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/warehouse.svg')",
            backgroundSize: "cover",
            backgroundPosition: "bottom right",
            backgroundRepeat: "no-repeat",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 100% at bottom right, black 40%, transparent 70%)",
            maskImage:
              "radial-gradient(ellipse 100% 100% at bottom right, black 40%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-20 flex h-full flex-col justify-start px-12 pb-8 pt-20 xl:px-16 xl:pt-24 2xl:px-20">
          <div className="flex flex-col justify-center gap-6">
            {/* Brand */}
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-ink">
                3PL Work
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-rust">
                Warehouse Operations Platform
              </p>
            </div>

            {/* Heading */}
            <div className="max-w-130">
              <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-ink">
                Built for <span className="text-rust">warehouse staffing</span>{" "}
                operations
              </h2>
            </div>

            {/* Feature items — single column */}
            <div className="flex flex-col gap-2.5">
              {FEATURES.map((feat) => (
                <div key={feat.label} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rust-soft">
                    <feat.icon className="h-3.5 w-3.5 text-rust" />
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {feat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Right Panel: Login Card ── */}
      <section className="flex min-h-0 flex-1 items-center justify-center bg-linear-to-br from-paper to-rust-soft/40 p-6 lg:w-[42%]">
        <div className="w-full max-w-sm">
          {/* Mobile banner */}
          <div className="mb-8 overflow-hidden rounded-xl lg:hidden">
            <div
              className="relative flex h-32 items-end bg-cover bg-center"
              style={{ backgroundImage: "url('/assets/warehouse.svg')" }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-ink/80 to-ink/40" />
              <div className="relative z-10 p-5">
                <p className="font-display text-lg font-bold text-cream">
                  3PL Work
                </p>
                <p className="text-[11px] uppercase tracking-widest text-steel-light">
                  Warehouse Operations Platform
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-manila-dark bg-cream p-8 shadow-xl shadow-manila-dark/50">
            <div className="mb-6">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-rust">
                <span className="text-sm font-bold text-cream">3W</span>
              </div>

              <h1 className="text-xl font-semibold text-ink">Welcome back</h1>
              <p className="mt-1 text-sm text-steel">
                Sign in to your account to continue.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Field label="Email address" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : ("password" as InputType)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-steel-light transition-colors hover:bg-paper-dim hover:text-steel"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-manila-dark accent-rust focus:ring-2 focus:ring-rust/20"
                  />
                  <span className="text-sm text-steel">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-rust hover:text-rust-dark"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="rounded-lg bg-stamp-soft px-3 py-2 text-xs text-stamp">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting}
              >
                {submitting ? "Signing in\u2026" : "Sign in"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          <p
            className="mt-6 text-center text-xs text-steel-light"
            suppressHydrationWarning
          >
            &copy; {new Date().getFullYear()} 3PL Work. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
