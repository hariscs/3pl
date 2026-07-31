"use client";

import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/store";
import { getUserDisplayName } from "@/lib/users";

export function TopBar({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { locations, currentLocationId, setCurrentLocationId } = useAppData();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex flex-none flex-col gap-3 border-b border-manila-dark bg-paper/90 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-steel">{description}</p>
        )}
      </div>
      <div className="flex flex-none items-center gap-2.5">
        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-manila-dark bg-cream px-3 py-1.5 shadow-card">
            <span className="text-sm font-medium text-ink">
              {getUserDisplayName(user)}
            </span>
            <span className="rounded-full bg-rust-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rust">
              {user.role}
            </span>
          </div>
        )}
        <label className="flex items-center gap-2 rounded-xl border border-manila-dark bg-cream px-3 py-1.5 shadow-card">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-steel">
            Location
          </span>
          <select
            value={currentLocationId}
            onChange={(e) => setCurrentLocationId(e.target.value)}
            className="bg-transparent text-sm font-medium text-ink focus:outline-none"
          >
            {locations
              .filter((loc) => loc.status !== "archived")
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
          </select>
        </label>
      </div>
    </header>
  );
}
