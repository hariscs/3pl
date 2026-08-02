"use client";

import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

type InputType = "email" | "password" | "text";

const CAPABILITIES = [
  { icon: ClipboardList, label: "Loads" },
  { icon: Users, label: "Crew" },
  { icon: DollarSign, label: "Payroll" },
  { icon: Receipt, label: "Billing" },
  { icon: Sparkles, label: "Intelligence" },
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
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
      {/* ── Compact brand band — mobile & tablet only ── */}
      <div className="bg-ink px-6 pb-8 pt-10 sm:pt-14 lg:hidden">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rust">
            <span className="text-sm font-bold text-cream">3W</span>
          </div>
          <p className="mt-4 font-display text-lg font-bold tracking-tight text-cream">
            3PL Work
          </p>
          <p className="mt-1.5 hidden text-sm text-steel-light sm:block">
            Warehouse operations, under control.
          </p>
        </div>
      </div>

      {/* ── Left panel: brand + product story — desktop only ── */}
      <section className="relative hidden overflow-y-auto overflow-x-hidden bg-ink lg:flex lg:w-[58%] lg:flex-col">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-rust/10 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-full flex-col justify-between gap-10 px-14 py-10 xl:px-20 xl:py-12">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rust">
              <span className="text-sm font-bold text-cream">3W</span>
            </div>
            <div>
              <p className="font-display text-base font-bold tracking-tight text-cream">
                3PL Work
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-steel-light">
                Warehouse Operations Platform
              </p>
            </div>
          </div>

          {/* Headline + capability strip */}
          <div>
            <div className="max-w-xl">
              <h1 className="font-display text-[clamp(2rem,3.2vw,3.25rem)] font-bold leading-[1.1] tracking-tight text-cream">
                Warehouse operations,{" "}
                <span className="text-rust">under control.</span>
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-steel-light">
                3PL Work coordinates loads, crew, payroll, and billing in one
                system, built for teams that run tight schedules.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-ink-line pt-6">
              {CAPABILITIES.map((capability) => (
                <div key={capability.label} className="flex items-center gap-2">
                  <capability.icon className="h-4 w-4 text-steel-light" />
                  <span className="font-tick text-[11px] font-medium uppercase tracking-[0.12em] text-steel-light">
                    {capability.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Framed photo */}
          <div className="relative h-40 flex-none overflow-hidden rounded-2xl border border-ink-line xl:h-48">
            <Image
              src="/assets/warehouse-dock.jpg"
              alt="Warehouse racking and staged pallets on the distribution floor"
              fill
              sizes="(min-width: 1280px) 620px, 520px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
            <p className="absolute bottom-4 left-5 font-tick text-[11px] font-medium uppercase tracking-[0.12em] text-steel-light">
              Charlotte, NC — Distribution Center
            </p>
          </div>
        </div>
      </section>

      {/* ── Right panel: login form ── */}
      <section className="flex flex-1 items-center justify-center overflow-y-auto bg-paper px-6 py-10 sm:py-14 lg:w-[42%]">
        <div className="w-full max-w-sm">
          <div className="animate-global-drop-in rounded-2xl border border-manila-dark bg-cream p-8 shadow-xl shadow-manila-dark/40 sm:p-9">
            <div className="mb-7">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-steel">
                Sign in to your account to continue.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Field label="Email address" required>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-light" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-light" />
                  <Input
                    type={showPassword ? "text" : ("password" as InputType)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pl-10 pr-10"
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
                <div className="rounded-lg bg-stamp-soft px-3 py-2.5 text-xs text-stamp">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
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
