export type Role = "admin" | "lead" | "customer";

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

export type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationId: string;
  status: RecordStatus;
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

// Crew (Employee) category — fixed set. Mirrors api/src/schemas/domain.ts
// (CREW_CATEGORY_KEYS). Stored as the key; labelled here for the UI.
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

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  hourlyRate: number;
  category: CrewCategory | null;
  locationId: string;
  status: RecordStatus;
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
