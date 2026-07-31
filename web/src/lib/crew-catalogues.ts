// Small typed reference catalogues for crew Skills, Certification Types, and
// Training Types. These are frontend-only lookup tables (id -> label) — there
// is no admin CRUD for managing them in this pass, per project scope. A crew
// member stores only the ids (skillIds: string[], certificationTypeId,
// trainingTypeId); these maps are just how the UI renders a readable label.

export const SKILL_LABELS = {
  forklift_operation: "Forklift Operation",
  container_unloading: "Container Unloading",
  rf_scanner: "RF Scanner",
  pallet_building: "Pallet Building",
  loading: "Loading",
  heavy_lifting: "Heavy Lifting",
} as const;
export type SkillId = keyof typeof SKILL_LABELS;
export const SKILL_IDS = Object.keys(SKILL_LABELS) as SkillId[];

export const CERTIFICATION_TYPE_LABELS = {
  forklift_certification: "Forklift Certification",
  osha_safety_training: "OSHA Safety Training",
  hazmat_handling: "Hazmat Handling",
  scissor_lift_operation: "Scissor Lift Operation",
} as const;
export type CertificationTypeId = keyof typeof CERTIFICATION_TYPE_LABELS;
export const CERTIFICATION_TYPE_IDS = Object.keys(
  CERTIFICATION_TYPE_LABELS,
) as CertificationTypeId[];

export const TRAINING_TYPE_LABELS = {
  cold_storage_safety: "Cold Storage Safety",
  customer_site_orientation: "Customer Site Orientation",
  hazard_communication: "Hazard Communication",
} as const;
export type TrainingTypeId = keyof typeof TRAINING_TYPE_LABELS;
export const TRAINING_TYPE_IDS = Object.keys(
  TRAINING_TYPE_LABELS,
) as TrainingTypeId[];

export function skillLabel(id: string): string {
  return (SKILL_LABELS as Record<string, string>)[id] ?? id;
}

export function certificationTypeLabel(id: string): string {
  return (CERTIFICATION_TYPE_LABELS as Record<string, string>)[id] ?? id;
}

export function trainingTypeLabel(id: string): string {
  return (TRAINING_TYPE_LABELS as Record<string, string>)[id] ?? id;
}
