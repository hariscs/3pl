"use client";

import { useState } from "react";
import { StampBadge } from "@/components/StampBadge";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { useAppData } from "@/lib/store";
import type { Role } from "@/lib/types";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "lead" as Role,
  locationId: "",
};

export default function RegisterUserPage() {
  const { locations, users, addUser, currentLocationId } = useAppData();
  const [form, setForm] = useState(emptyForm);
  const [locationMode, setLocationMode] = useState<"choose" | "detect">(
    "choose",
  );
  const [detecting, setDetecting] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  function detectLocation() {
    setDetecting(true);
    setTimeout(() => {
      setForm((f) => ({ ...f, locationId: currentLocationId }));
      setDetecting(false);
    }, 700);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.locationId) return;
    addUser({
      name: form.name,
      email: form.email,
      role: form.role,
      locationId: form.locationId,
    });
    setJustCreated(form.name);
    setForm(emptyForm);
    setLocationMode("choose");
  }

  const locationName = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? "—";

  return (
    <>
      <TopBar
        title="Register User"
        description="Every login is tied to exactly one location — that location scopes everything the user can see."
      />
      <main className="flex-1 space-y-6 p-6">
        <Card title="New user">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Jordan Casey"
                required
              />
            </Field>
            <Field label="Email address" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="jordan@example.com"
                required
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="Role" required>
              <Select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as Role }))
                }
              >
                <option value="admin">Admin — full access</option>
                <option value="lead">Lead — load entry only</option>
                <option value="customer">Customer — read-only reporting</option>
              </Select>
            </Field>

            <div className="sm:col-span-2 rounded-md border border-manila-dark bg-manila/40 p-4">
              <p className="font-display text-xs font-medium uppercase tracking-wider text-steel">
                Location <span className="text-rust">*</span>
              </p>
              <p className="mb-3 text-xs text-steel-light">
                This user will only see data from the location assigned here.
              </p>
              <div className="mb-3 flex gap-1.5 rounded-sm border border-manila-dark bg-cream p-1 w-fit">
                {(
                  [
                    { key: "choose", label: "Choose from list" },
                    { key: "detect", label: "Fetch current location" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLocationMode(opt.key)}
                    className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                      locationMode === opt.key
                        ? "bg-ink text-cream"
                        : "text-steel hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {locationMode === "choose" ? (
                <Select
                  value={form.locationId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, locationId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select a location…</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={detectLocation}
                    disabled={detecting}
                  >
                    {detecting ? "Detecting…" : "Detect my location"}
                  </Button>
                  {form.locationId && !detecting && (
                    <span className="text-sm text-freight">
                      Detected: {locationName(form.locationId)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <Button type="submit">Create user</Button>
            </div>
          </form>
        </Card>

        {justCreated && (
          <p className="text-sm text-freight">
            {justCreated} was registered and can now log in.
          </p>
        )}

        <Card title="Existing users">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-manila-dark text-left font-display text-xs uppercase tracking-wide text-steel">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-manila-dark/60">
                    <td className="py-2 pr-4 text-ink">{u.name}</td>
                    <td className="py-2 pr-4 text-steel">{u.email}</td>
                    <td className="py-2 pr-4 capitalize text-ink">{u.role}</td>
                    <td className="py-2 pr-4 text-ink">
                      {locationName(u.locationId)}
                    </td>
                    <td className="py-2 pr-4">
                      <StampBadge status={u.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}
