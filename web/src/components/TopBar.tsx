"use client";

import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/store";

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
    <header className="flex flex-none flex-col gap-3 border-b border-manila-dark bg-paper px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-wide text-ink">
          {title}
        </h1>
        {description && <p className="text-sm text-steel">{description}</p>}
      </div>
      <div className="flex flex-none items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 rounded-sm border border-manila-dark bg-cream px-3 py-1.5">
            <span className="text-sm text-ink">{user.name}</span>
            <span className="rounded-sm bg-ink px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wide text-cream">
              {user.role}
            </span>
          </div>
        )}
        <label className="flex items-center gap-2 rounded-sm border border-manila-dark bg-cream px-3 py-1.5">
          <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-steel">
            Location
          </span>
          <select
            value={currentLocationId}
            onChange={(e) => setCurrentLocationId(e.target.value)}
            className="bg-transparent text-sm text-ink focus:outline-none"
          >
            {locations.map((loc) => (
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
