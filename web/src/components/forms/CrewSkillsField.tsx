"use client";

import { X } from "lucide-react";
import { SKILL_IDS, skillLabel } from "@/lib/crew-catalogues";

export function CrewSkillsField({
  skillIds,
  onChange,
}: {
  skillIds: string[];
  onChange: (skillIds: string[]) => void;
}) {
  const available = SKILL_IDS.filter((id) => !skillIds.includes(id));

  function addSkill(id: string) {
    onChange([...skillIds, id]);
  }
  function removeSkill(id: string) {
    onChange(skillIds.filter((s) => s !== id));
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Skills</p>
      <p className="mt-1 text-xs text-steel-light">
        Reusable capabilities — a crew member can have any number, separate from
        their one primary job category.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {skillIds.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full bg-rust-soft px-3 py-1.5 text-xs font-medium text-rust-dark"
          >
            {skillLabel(id)}
            <button
              type="button"
              onClick={() => removeSkill(id)}
              aria-label={`Remove ${skillLabel(id)}`}
              className="text-rust-dark/60 transition-colors hover:text-rust-dark"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {skillIds.length === 0 && (
          <p className="text-sm text-steel-light">No skills added yet.</p>
        )}
      </div>
      {available.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {available.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => addSkill(id)}
              className="rounded-full border border-manila-dark px-3 py-1.5 text-xs font-medium text-steel transition-colors hover:border-rust/30 hover:bg-rust-soft/30 hover:text-rust-dark"
            >
              + {skillLabel(id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
