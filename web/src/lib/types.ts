// Admin/Finance: unrestricted (all locations, no selection needed).
// Manager/Lead: scoped to one or more selected locations.
// Customer: scoped via `customerId`, not location.
// Employee: no permanent location at all — that comes from Clock-In/Shift
// data later, not from the User account.
export type Role =
  | "admin"
  | "manager"
  | "lead"
  | "finance"
  | "customer"
  | "employee";

export type RecordStatus = "active" | "archived";

export type Location = {
  id: string;
  name: string;
  region: string;
  code: string | null;
  group: string | null;
  addressL1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  timezone: string;
  status: string;
  shiftStart: string;
  shiftEnd: string;
};

// A User Account represents system access (authentication/authorization)
// only — it is a separate entity from a Crew Member (the worker record).
// A Crew Member may exist with no User Account, and a User Account may
// exist with no linked Crew Member. Only "employee"-role accounts link to
// one, via `linkedCrewMemberId`. Do not duplicate Crew fields here (skills,
// certifications, pay, photo, etc. all live on Employee, not SystemUser).
export type SystemUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  status: RecordStatus;
  /** Meaningful only for "manager"/"lead" — ignored (and should be empty)
   * for every other role. Empty for "admin"/"finance" means unrestricted,
   * not "no access". */
  locationIds: string[];
  /** Meaningful only for "customer" — optional even then. */
  customerId?: string;
  /** Meaningful only for "employee" — required for that role. References
   * Employee.id (the Crew Member's internal id, not its employeeId code). */
  linkedCrewMemberId?: string;
};

export type Customer = {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  displayName: string;
  legalCompanyName: string;
  locationIds: string[];
  status: RecordStatus;
};

// Crew (Employee) primary job category — fixed set. Distinct from Skills:
// a crew member has exactly one primary category but any number of skills.
export const CREW_CATEGORY_LABELS = {
  labour: "Labour",
  operator: "Operator",
  forklift: "Forklift",
  lead: "Crew Lead",
  sorter: "Sorter",
  loader: "Loader",
  checker: "Checker",
  clerk: "Clerk",
} as const;
export type CrewCategory = keyof typeof CREW_CATEGORY_LABELS;
export const CREW_CATEGORY_KEYS = Object.keys(
  CREW_CATEGORY_LABELS,
) as CrewCategory[];

// Employment status is its own type (not the shared RecordStatus) because it
// has a third value, "inactive", reachable only through ordinary editing —
// never through the Archive/Restore action, which only ever toggles between
// "active" and "archived".
export type EmploymentStatus = "active" | "inactive" | "archived";

export const EMPLOYMENT_TYPE_LABELS = {
  full_time: "Full Time",
  part_time: "Part Time",
  temporary: "Temporary",
  contract: "Contract",
} as const;
export type EmploymentType = keyof typeof EMPLOYMENT_TYPE_LABELS;
export const EMPLOYMENT_TYPE_KEYS = Object.keys(
  EMPLOYMENT_TYPE_LABELS,
) as EmploymentType[];

export const PAY_TYPE_LABELS = {
  hourly: "Hourly",
  production: "Production",
  hybrid: "Hybrid",
} as const;
export type PayType = keyof typeof PAY_TYPE_LABELS;
export const PAY_TYPE_KEYS = Object.keys(PAY_TYPE_LABELS) as PayType[];

export type EmployeeAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export type EmergencyContact = {
  name?: string;
  phone?: string;
  relationship?: string;
};

/** A crew member's certification record. Status is always derived from
 * `expiresAt` (see getCertificationStatus in lib/crew.ts) — never stored. */
export type CrewCertification = {
  id: string;
  certificationTypeId: string;
  certificateNumber?: string;
  issuingAuthority?: string;
  issuedAt?: string;
  expiresAt?: string;
  notes?: string;
};

export type CrewTrainingRecord = {
  id: string;
  trainingTypeId: string;
  completedAt: string;
  expiresAt?: string;
  provider?: string;
  notes?: string;
};

export type Employee = {
  id: string;
  /** Human-facing code (e.g. "EMP-1024"), distinct from the internal `id`. */
  employeeId: string;

  firstName: string;
  lastName: string;
  preferredName?: string;

  profilePhotoUrl?: string;

  phone: string;
  email?: string;

  address?: EmployeeAddress;
  emergencyContact?: EmergencyContact;

  employmentStatus: EmploymentStatus;
  hireDate?: string;
  employmentType?: EmploymentType;
  /** Primary job category on the floor — one value. See skillIds for the
   * (separate) set of a crew member's capabilities. */
  category: CrewCategory | null;
  notes?: string;

  payType: PayType;
  hourlyRate: number;
  productionPayEligible: boolean;

  skillIds: string[];
  certifications: CrewCertification[];
  trainingRecords: CrewTrainingRecord[];
};

/** One configurable unit of measure inside a product type's rate card. */
export type RateLine = {
  id: string;
  unit: string;
  billBase: number;
  billThreshold: number;
  billOverRate: number;
  payThreshold: number;
  payOverRate: number;
  payBonus: number;
};

export type ProductType = {
  id: string;
  customerId: string;
  locationId: string;
  name: string;
  rateLines: RateLine[];
  status: RecordStatus;
};

export type LoadStatus = "active" | "complete" | "void" | "archived";

export type LoadEmployeeAssignment = {
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
};

export type Load = {
  id: string;
  ticketNumber: number;
  date: string;
  locationId: string;
  customerId: string;
  productTypeId: string;
  doorNumber: string;
  containerNumber: string;
  trailerNumber: string;
  sealNumber: string;
  vendor: string;
  poNumbers: string[];
  sorts: number;
  cases: number;
  weight: number;
  assignments: LoadEmployeeAssignment[];
  status: LoadStatus;
  billedAmount: number;
  payoutAmount: number;
  /** ISO timestamp of the last update. Displayed on the load detail screen. */
  lastUpdatedAt: string | null;
};
