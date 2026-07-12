"use client";

import { useAppData } from "@/lib/store";

export function TopBar({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { locations, currentLocationId, setCurrentLocationId, role, setRole } =
    useAppData();

  return (
    <header className="flex flex-none flex-col gap-3 border-b border-manila-dark bg-paper px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-wide text-ink">
          {title}
        </h1>
        {description && <p className="text-sm text-steel">{description}</p>}
      </div>
      <div className="flex flex-none items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-sm border border-manila-dark bg-cream p-1">
          {(["admin", "lead"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
                role === r ? "bg-ink text-cream" : "text-steel hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
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
