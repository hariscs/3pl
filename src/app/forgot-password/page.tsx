"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

type Step = "identify" | "verify-method" | "code" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-lg font-semibold tracking-wide text-cream">
            Dockmaster
          </p>
          <p className="text-[11px] uppercase tracking-widest text-steel-light">
            Account recovery
          </p>
        </div>

        <div className="rounded-md border border-manila-dark bg-paper p-6 shadow-xl">
          {step === "identify" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email) return;
                setStep("verify-method");
              }}
            >
              <div>
                <h1 className="font-display text-lg font-semibold text-ink">
                  Find your account
                </h1>
                <p className="text-sm text-steel">
                  Enter the email on file. Admins, leads, and customer logins
                  all recover the same way.
                </p>
              </div>
              <Field label="Email address" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          )}

          {step === "verify-method" && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-lg font-semibold text-ink">
                  Choose how to verify
                </h1>
                <p className="text-sm text-steel">
                  We&apos;ll send a 6-digit code to confirm it&apos;s you.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 rounded-sm border border-manila-dark bg-cream px-3 py-2.5 text-sm">
                  <input
                    type="radio"
                    name="method"
                    checked={method === "email"}
                    onChange={() => setMethod("email")}
                    className="accent-rust"
                  />
                  <span>
                    Email —{" "}
                    <span className="text-steel">
                      {email.replace(/(.{2}).+(@.+)/, "$1•••$2")}
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-sm border border-manila-dark bg-cream px-3 py-2.5 text-sm">
                  <input
                    type="radio"
                    name="method"
                    checked={method === "sms"}
                    onChange={() => setMethod("sms")}
                    className="accent-rust"
                  />
                  <span>
                    Text message —{" "}
                    <span className="text-steel">(•••) •••-0142</span>
                  </span>
                </label>
              </div>
              <Button className="w-full" onClick={() => setStep("code")}>
                Send code
              </Button>
              <button
                type="button"
                onClick={() => setStep("identify")}
                className="w-full text-center text-xs text-steel underline"
              >
                Back
              </button>
            </div>
          )}

          {step === "code" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim().length !== 6) {
                  setCodeError("Enter the 6-digit code we sent you.");
                  return;
                }
                setCodeError("");
                setStep("reset");
              }}
            >
              <div>
                <h1 className="font-display text-lg font-semibold text-ink">
                  Enter verification code
                </h1>
                <p className="text-sm text-steel">
                  Sent via {method === "email" ? "email" : "text message"}. For
                  this preview, any 6 digits work.
                </p>
              </div>
              <Field label="Verification code" required>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                />
              </Field>
              {codeError && <p className="text-xs text-stamp">{codeError}</p>}
              <Button type="submit" className="w-full">
                Verify
              </Button>
              <button
                type="button"
                onClick={() => setStep("verify-method")}
                className="w-full text-center text-xs text-steel underline"
              >
                Send a different way
              </button>
            </form>
          )}

          {step === "reset" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (password.length < 8) {
                  setPasswordError("Password must be at least 8 characters.");
                  return;
                }
                if (password !== confirm) {
                  setPasswordError("Passwords don't match.");
                  return;
                }
                setPasswordError("");
                setStep("done");
              }}
            >
              <div>
                <h1 className="font-display text-lg font-semibold text-ink">
                  Set a new password
                </h1>
                <p className="text-sm text-steel">
                  Choose a new password for {email}.
                </p>
              </div>
              <div className="space-y-4">
                <Field label="New password" required>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Confirm new password" required>
                  <Input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </Field>
              </div>
              {passwordError && (
                <p className="text-xs text-stamp">{passwordError}</p>
              )}
              <Button type="submit" className="w-full">
                Reset password
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-freight text-freight">
                ✓
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-ink">
                  Password reset
                </h1>
                <p className="text-sm text-steel">
                  You can now sign in with your new password — no need to have
                  an admin recreate your account.
                </p>
              </div>
              <Link href="/">
                <Button className="w-full">Back to Dockmaster</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
