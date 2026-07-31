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

export type LocationStatus = "active" | "inactive" | "archived";

export type LocationSiteContact = {
  name?: string;
  phone?: string;
  email?: string;
};

// A Location is an operational work site (warehouse, distribution center,
// customer facility, plant, job site) where crews check in, supervisors
// manage crews, and loads are created — not just an address. Every Location
// belongs to exactly one Customer via `customerId`; a Customer may have many
// Locations. Crew Members are never permanently assigned to a Location — that
// is resolved later, per shift, through Clock-In (not built yet). A User
// account's location access (manager/lead) lives on SystemUser.locationIds,
// not here.
export type Location = {
  id: string;
  name: string;
  customerId: string;
  region: string;
  code: string | null;
  group: string | null;

  addressL1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  timezone: string;
  notes?: string;
  siteContact?: LocationSiteContact;

  status: LocationStatus;
  shiftStart: string;
  shiftEnd: string;

  createdAt: string;
  updatedAt: string;
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

export type CustomerStatus = "active" | "inactive" | "archived";

export const PAYMENT_TERMS_LABELS = {
  due_on_receipt: "Due on Receipt",
  net_7: "Net 7",
  net_15: "Net 15",
  net_30: "Net 30",
  net_45: "Net 45",
} as const;
export type PaymentTerms = keyof typeof PAYMENT_TERMS_LABELS;
export const PAYMENT_TERMS_KEYS = Object.keys(
  PAYMENT_TERMS_LABELS,
) as PaymentTerms[];

// A Customer is the business entity that hires our staffing services (e.g.
// Amazon, Geodis, DHL) — distinct from the operational sites it owns. One
// Customer may have many Locations via Location.customerId; do not add a
// locationIds array back here, or the relationship would be duplicated in
// two directions. Billing/invoicing modules will consume billingEmail and
// paymentTerms later — this model only stores them for now.
export type Customer = {
  id: string;
  displayName: string;
  code: string | null;
  legalCompanyName: string | null;
  status: CustomerStatus;

  industry: string | null;
  website: string | null;
  taxId: string | null;

  contactName: string;
  contactTitle: string | null;
  email: string;
  phone: string | null;

  billingEmail: string | null;
  paymentTerms: PaymentTerms | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
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

export const UNIT_OF_MEASURE_LABELS = {
  container: "Container",
  case: "Case",
  piece: "Piece",
  pallet: "Pallet",
  pound: "Pound",
  kilogram: "Kilogram",
  ton: "Ton",
  hour: "Hour",
} as const;
export type UnitOfMeasure = keyof typeof UNIT_OF_MEASURE_LABELS;
export const UNIT_OF_MEASURE_KEYS = Object.keys(
  UNIT_OF_MEASURE_LABELS,
) as UnitOfMeasure[];

export const WORK_TYPE_PAY_TYPE_LABELS = {
  hourly: "Hourly",
  production: "Production",
} as const;
export type WorkTypePayType = keyof typeof WORK_TYPE_PAY_TYPE_LABELS;

export type ProductTypeStatus = "active" | "inactive" | "archived";

// Internally named ProductType (and routed at /product-types) for
// compatibility with existing code — the UI presents this domain as
// "Work Type" throughout, since the business sells labor services, not
// inventory. A Work Type belongs to exactly one Customer (never a global
// catalog, never scoped to a Location — different customers may have
// similarly-named work types with different rates). Selecting a Work Type
// on a Load is meant to supply its Unit of Measure, Employee Pay, and
// Customer Billing configuration automatically — this model only stores
// that configuration; it does not calculate anything.
export type ProductType = {
  id: string;
  customerId: string;
  name: string;
  code: string | null;
  status: ProductTypeStatus;

  unitOfMeasure: UnitOfMeasure;
  notes: string | null;

  employeePayType: WorkTypePayType;
  employeePayRate: number;

  customerBillingType: WorkTypePayType;
  customerBillingRate: number;

  createdAt: string;
  updatedAt: string;
};

// A Load is the central operational record connecting every other domain:
// Customer → Location → Work Type → Load → Crew Assignments → Time/Breaks →
// Payroll/Billing. Every Load belongs to exactly one Customer and Location
// (the Location must belong to that Customer) and uses one Work Type (which
// must also belong to that Customer). Selecting a Work Type snapshots its
// pay/billing configuration onto the Load (paySnapshot/billingSnapshot) —
// rates can change later on the Work Type without altering historical Loads.
// A Load is editable up through "completed"; "closed" and "cancelled" are
// read-only, protected records that Payroll/Billing/Invoices consume.
export type LoadStatus =
  | "draft" // created, no crew required yet — editable
  | "scheduled" // expected at a future date/time — editable
  | "in_progress" // crew clocked in — editable
  | "paused" // temporarily stopped — editable
  | "completed" // physical work finished, still correctable — editable
  | "closed" // finalized — READ-ONLY, feeds Payroll/Billing/Invoices
  | "cancelled"; // voided — READ-ONLY, generates no normal Payroll/Billing

export const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  paused: "Paused",
  completed: "Completed",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const EDITABLE_LOAD_STATUSES: LoadStatus[] = [
  "draft",
  "scheduled",
  "in_progress",
  "paused",
  "completed",
];

export type LoadCrewAssignmentStatus =
  | "assigned" // added to the load, not yet clocked in
  | "clocked_in"
  | "on_break"
  | "clocked_out"
  | "removed";

export type LoadBreakEntry = {
  id: string;
  /** "HH:MM", local to the load's operational day — same convention as clockIn/clockOut. */
  breakStart: string;
  breakEnd: string | null;
};

export type LoadCrewAssignment = {
  /** Stable per-occurrence id — not employeeId, so a removed crew member can be re-added. */
  id: string;
  employeeId: string;
  status: LoadCrewAssignmentStatus;
  assignedAt: string;
  assignedByUserId: string;
  clockIn: string | null;
  clockOut: string | null;
  breaks: LoadBreakEntry[];
  removedAt: string | null;
  removedByUserId: string | null;
  removalReason: string | null;
};

/** Captured when a Work Type is (re)selected on an editable Load — frozen
 * once the Load closes. Payroll always reads this, never the live Work Type. */
export type LoadPaySnapshot = {
  productTypeId: string;
  employeePayType: WorkTypePayType;
  employeePayRate: number;
  unitOfMeasure: UnitOfMeasure;
  snapshottedAt: string;
};

/** Same idea as LoadPaySnapshot, for what the Customer is billed. */
export type LoadBillingSnapshot = {
  productTypeId: string;
  customerBillingType: WorkTypePayType;
  customerBillingRate: number;
  unitOfMeasure: UnitOfMeasure;
  snapshottedAt: string;
};

export type LoadNote = {
  id: string;
  text: string;
  authorUserId: string;
  createdAt: string;
};

export type LoadAttachmentCategory = "photo" | "document" | "video";
/** Which surface uploaded the file — Admin desktop or the field view. */
export type LoadAttachmentSource = "admin" | "field";
export type LoadAttachmentStatus = "active" | "archived";

// Attachments are a normalized, load-scoped collection (never embedded in
// Load itself) so Admin and the field view can share exactly one repository.
export type LoadAttachment = {
  id: string;
  loadId: string;
  fileName: string;
  category: LoadAttachmentCategory;
  mimeType: string;
  sizeBytes: number;
  /** Object URL (session-only) or a /public seed placeholder — never a raw
   * base64 payload stored on the record. */
  fileUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  uploadedByUserId: string;
  uploadedAt: string;
  source: LoadAttachmentSource;
  status: LoadAttachmentStatus;
  archivedAt?: string;
  archivedByUserId?: string;
};

export type Load = {
  id: string;
  ticketNumber: number;
  date: string;

  locationId: string;
  /** Denormalized from Location.customerId — validated to match at every
   * write, not derived on read (same precedent as Invoice's snapshotted
   * display fields). */
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
  palletCount?: number;
  pieceCount?: number;

  assignments: LoadCrewAssignment[];
  supervisorUserId: string | null;

  paySnapshot: LoadPaySnapshot;
  billingSnapshot: LoadBillingSnapshot;

  status: LoadStatus;
  /** Server-computed from the snapshot + quantities/worked-hours — frozen
   * once the Load is closed or cancelled. Never hand-entered. */
  billedAmount: number;
  payoutAmount: number;

  notes: LoadNote[];
  operationalNotes: string | null;
  completionNotes: string | null;

  scheduledDate: string | null;
  scheduledStartTime: string | null;

  createdAt: string;
  createdByUserId: string;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  closedByUserId: string | null;
  cancelledAt: string | null;

  /** ISO timestamp of the last update. Displayed on the load detail screen. */
  lastUpdatedAt: string | null;
};
