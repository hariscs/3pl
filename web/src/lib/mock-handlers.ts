// Mock API handler used when the dev-bypass token is active.
// Every GET returns static mock data; mutations update the in-memory store
// so the UI feels real.  No API server required.

import { getBillingStatus, markLoadsAsInvoiced } from "./billing";
import type { Invoice } from "./invoices";
import {
  addInvoice,
  getInvoice,
  getInvoices,
  getNextInvoiceNumber,
} from "./invoices";
import {
  addLoadAttachment,
  getLoadAttachmentById,
  listLoadAttachments as getLoadAttachments,
  resetLoadAttachments,
  updateLoadAttachment,
} from "./load-attachments";
import { computeLoadFinancials } from "./load-financials";
import { getLoadReadiness } from "./load-readiness";
import {
  clockOutBlockedReason,
  endBreakBlockedReason,
  nowHHMM,
  startBreakBlockedReason,
} from "./load-time";
import {
  CUSTOMERS,
  EMPLOYEES,
  LOADS,
  LOCATIONS,
  PRODUCT_TYPES,
  SYSTEM_USERS,
} from "./mock-data";
import { DEV_BYPASS_TOKEN, getToken } from "./token";
import {
  type Customer,
  EDITABLE_LOAD_STATUSES,
  type Employee,
  type Load,
  type LoadAttachment,
  type LoadCrewAssignment,
  type LoadStatus,
  type Location,
  type ProductType,
  type SystemUser,
} from "./types";

// Clone mutable copies so mutations don't pollute the original static data.
let customers = structuredClone(CUSTOMERS);
let employees = structuredClone(EMPLOYEES);
let locations = structuredClone(LOCATIONS);
let productTypes = structuredClone(PRODUCT_TYPES);
let loads = structuredClone(LOADS);
let users = structuredClone(SYSTEM_USERS);

import type {
  EmployeePayrollStatus,
  PayrollPayment,
  PayrollPaymentMethod,
} from "./payroll";

let ticketCounter = Math.max(...loads.map((l) => l.ticketNumber)) + 1;

type PayrollStatusOverride = {
  status: EmployeePayrollStatus;
  approvedAt?: string;
  approvedByName?: string;
  paidAt?: string;
  paidByName?: string;
  payment?: PayrollPayment | null;
};

// Per-employee payroll status overrides for the mock API.
const payrollStatusOverrides: Record<string, PayrollStatusOverride> = {
  "emp-1": {
    status: "paid",
    approvedAt: "2026-07-08T10:00:00Z",
    approvedByName: "Rick Alvarez",
    paidAt: "2026-07-09T14:30:00Z",
    paidByName: "Rick Alvarez",
    payment: {
      amount: 21.0,
      paidAt: "2026-07-09",
      method: "direct_deposit",
      reference: "DD-2026-0709-0012",
      note: "Payroll for Jun 29 \u2013 Jul 5",
      recordedAt: "2026-07-09T14:30:00Z",
      recordedByName: "Rick Alvarez",
    },
  },
  "emp-2": {
    status: "approved",
    approvedAt: "2026-07-08T11:00:00Z",
    approvedByName: "Rick Alvarez",
  },
  "emp-3": { status: "pending_review" },
};

/** Reset all mutable stores back to the static seed (useful for testing). */
export function resetMockData(): void {
  customers = structuredClone(CUSTOMERS);
  employees = structuredClone(EMPLOYEES);
  locations = structuredClone(LOCATIONS);
  productTypes = structuredClone(PRODUCT_TYPES);
  loads = structuredClone(LOADS);
  users = structuredClone(SYSTEM_USERS);
  ticketCounter = Math.max(...loads.map((l) => l.ticketNumber)) + 1;
  resetLoadAttachments();
}

/** Returns true if the current session uses the dev-bypass token. */
function isMockActive(): boolean {
  if (typeof window === "undefined") return false;
  return getToken() === DEV_BYPASS_TOKEN;
}

function delay(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ── Route matching ────────────────────────────────────────────────

type Handler = (
  method: string,
  path: string,
  body?: unknown,
) => Promise<Response>;

const exact = (
  method: string,
  pathPattern: string,
  fn: (path: string, body?: unknown) => Promise<unknown>,
) => {
  return {
    method,
    match: (m: string, p: string) => m === method && p === pathPattern,
    fn,
  };
};

const pattern = (
  method: string,
  regex: RegExp,
  fn: (path: string, body?: unknown) => Promise<unknown>,
) => {
  return {
    method,
    match: (m: string, p: string) => m === method && regex.test(p),
    fn,
  };
};

async function handleAuthLogin(_path: string, body?: unknown) {
  const { email } = (body ?? {}) as { email?: string };
  const user = users.find((u) => u.email === email);
  if (!user)
    return jsonResponse({ message: "Invalid email or password." }, 401);
  return jsonResponse({ token: "mock-jwt", user });
}

// ── GET handlers ──────────────────────────────────────────────────

async function listLocations() {
  await delay();
  return jsonResponse(locations);
}

async function listCustomers() {
  await delay();
  return jsonResponse(customers);
}

async function listEmployees() {
  await delay();
  return jsonResponse(employees);
}

async function listProductTypes() {
  await delay();
  return jsonResponse(productTypes);
}

async function listLoads() {
  await delay();
  return jsonResponse(loads);
}

async function listUsers() {
  await delay();
  return jsonResponse(users);
}

// ── POST / PATCH handlers ─────────────────────────────────────────

/** True if another active location for the same customer already uses this name. */
function isDuplicateActiveLocation(
  data: Partial<Location>,
  excludeId?: string,
): boolean {
  const name = data.name?.trim().toLowerCase();
  if (!name || !data.customerId) return false;
  return locations.some(
    (l) =>
      l.id !== excludeId &&
      l.status !== "archived" &&
      l.customerId === data.customerId &&
      l.name.trim().toLowerCase() === name,
  );
}

async function createLocation(_path: string, body?: unknown) {
  await delay();
  const data = body as Partial<Location>;
  if (isDuplicateActiveLocation(data)) {
    return jsonResponse(
      {
        message: `"${data.name}" already exists for this customer.`,
        code: "DUPLICATE_LOCATION_NAME",
      },
      409,
    );
  }
  const now = new Date().toISOString();
  const loc = {
    ...(body as Record<string, unknown>),
    id: generateId("loc"),
    createdAt: now,
    updatedAt: now,
  } as unknown as Location;
  locations.push(loc);
  return jsonResponse(loc, 201);
}

async function updateLocation(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = locations.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  const data = body as Partial<Location>;
  if (isDuplicateActiveLocation({ ...locations[idx], ...data }, id)) {
    return jsonResponse(
      {
        message: `"${data.name ?? locations[idx].name}" already exists for this customer.`,
        code: "DUPLICATE_LOCATION_NAME",
      },
      409,
    );
  }
  locations[idx] = {
    ...locations[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(locations[idx]);
}

async function toggleLocationArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = locations.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  // Only ever toggles between active and archived — "inactive" is reachable
  // only through ordinary field editing, never through this action.
  locations[idx].status =
    locations[idx].status === "archived" ? "active" : "archived";
  locations[idx].updatedAt = new Date().toISOString();
  return jsonResponse(locations[idx]);
}

/** True if another active customer already uses this display name. */
function isDuplicateActiveCustomerName(
  data: Partial<Customer>,
  excludeId?: string,
): boolean {
  const name = data.displayName?.trim().toLowerCase();
  if (!name) return false;
  return customers.some(
    (c) =>
      c.id !== excludeId &&
      c.status !== "archived" &&
      c.displayName.trim().toLowerCase() === name,
  );
}

async function createCustomer(_path: string, body?: unknown) {
  await delay();
  const data = body as Partial<Customer>;
  if (isDuplicateActiveCustomerName(data)) {
    return jsonResponse(
      {
        message: `"${data.displayName}" already exists as an active customer.`,
        code: "DUPLICATE_CUSTOMER_NAME",
      },
      409,
    );
  }
  const now = new Date().toISOString();
  const cust = {
    ...(body as Record<string, unknown>),
    id: generateId("cust"),
    createdAt: now,
    updatedAt: now,
  } as unknown as Customer;
  customers.push(cust);
  return jsonResponse(cust, 201);
}

async function updateCustomer(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  const data = body as Partial<Customer>;
  if (isDuplicateActiveCustomerName(data, id)) {
    return jsonResponse(
      {
        message: `"${data.displayName}" already exists as an active customer.`,
        code: "DUPLICATE_CUSTOMER_NAME",
      },
      409,
    );
  }
  customers[idx] = {
    ...customers[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(customers[idx]);
}

async function toggleCustomerArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  // Only ever toggles between active and archived — "inactive" is reachable
  // only through ordinary field editing, never through this action.
  customers[idx].status =
    customers[idx].status === "archived" ? "active" : "archived";
  customers[idx].updatedAt = new Date().toISOString();
  return jsonResponse(customers[idx]);
}

async function createEmployee(_path: string, body?: unknown) {
  await delay();
  const data = body as Partial<Employee>;
  if (
    data.employeeId &&
    employees.some((e) => e.employeeId === data.employeeId)
  ) {
    return jsonResponse(
      { message: `Employee ID "${data.employeeId}" is already in use.` },
      409,
    );
  }
  const emp = {
    ...(body as Record<string, unknown>),
    id: generateId("emp"),
    employmentStatus: "active",
  } as unknown as Employee;
  employees.push(emp);
  return jsonResponse(emp, 201);
}

async function updateEmployee(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  const data = body as Partial<Employee>;
  if (
    data.employeeId &&
    employees.some((e) => e.employeeId === data.employeeId && e.id !== id)
  ) {
    return jsonResponse(
      { message: `Employee ID "${data.employeeId}" is already in use.` },
      409,
    );
  }
  employees[idx] = { ...employees[idx], ...data };
  return jsonResponse(employees[idx]);
}

async function toggleEmployeeArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  // Only ever toggles between active and archived — "inactive" is reachable
  // only through ordinary field editing, never through this action.
  employees[idx].employmentStatus =
    employees[idx].employmentStatus === "archived" ? "active" : "archived";
  return jsonResponse(employees[idx]);
}

/** True if another active work type for the same customer already uses this name. */
function isDuplicateActiveProductTypeName(
  data: Partial<ProductType>,
  excludeId?: string,
): boolean {
  const name = data.name?.trim().toLowerCase();
  if (!name || !data.customerId) return false;
  return productTypes.some(
    (p) =>
      p.id !== excludeId &&
      p.status !== "archived" &&
      p.customerId === data.customerId &&
      p.name.trim().toLowerCase() === name,
  );
}

async function createProductType(_path: string, body?: unknown) {
  await delay();
  const data = body as Partial<ProductType>;
  if (isDuplicateActiveProductTypeName(data)) {
    return jsonResponse(
      {
        message: `"${data.name}" already exists for this customer.`,
        code: "DUPLICATE_WORK_TYPE_NAME",
      },
      409,
    );
  }
  const now = new Date().toISOString();
  const pt = {
    ...(body as Record<string, unknown>),
    id: generateId("pt"),
    createdAt: now,
    updatedAt: now,
  } as unknown as ProductType;
  productTypes.push(pt);
  return jsonResponse(pt, 201);
}

async function updateProductType(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = productTypes.findIndex((p) => p.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  const data = body as Partial<ProductType>;
  if (isDuplicateActiveProductTypeName(data, id)) {
    return jsonResponse(
      {
        message: `"${data.name}" already exists for this customer.`,
        code: "DUPLICATE_WORK_TYPE_NAME",
      },
      409,
    );
  }
  productTypes[idx] = {
    ...productTypes[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(productTypes[idx]);
}

async function toggleProductTypeArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = productTypes.findIndex((p) => p.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  // Only ever toggles between active and archived — "inactive" is reachable
  // only through ordinary field editing, never through this action.
  productTypes[idx].status =
    productTypes[idx].status === "archived" ? "active" : "archived";
  productTypes[idx].updatedAt = new Date().toISOString();
  return jsonResponse(productTypes[idx]);
}

// ── Load domain helpers ─────────────────────────────────────────────

const READONLY_LOAD_STATUSES: LoadStatus[] = ["closed", "cancelled"];

function loadNotEditableResponse(): Response {
  return jsonResponse(
    {
      message: "This load is closed or cancelled and cannot be edited.",
      code: "LOAD_NOT_EDITABLE",
    },
    409,
  );
}

function snapshotFromProductType(pt: ProductType, now: string) {
  return {
    paySnapshot: {
      productTypeId: pt.id,
      employeePayType: pt.employeePayType,
      employeePayRate: pt.employeePayRate,
      unitOfMeasure: pt.unitOfMeasure,
      snapshottedAt: now,
    },
    billingSnapshot: {
      productTypeId: pt.id,
      customerBillingType: pt.customerBillingType,
      customerBillingRate: pt.customerBillingRate,
      unitOfMeasure: pt.unitOfMeasure,
      snapshottedAt: now,
    },
  };
}

function recomputeLoadFinancials(idx: number): void {
  const { billedAmount, payoutAmount } = computeLoadFinancials(loads[idx]);
  loads[idx].billedAmount = billedAmount;
  loads[idx].payoutAmount = payoutAmount;
}

/** Path segments for /loads/:id/assignments/:aid/<action> style routes. */
function loadAndAssignmentIds(path: string): { id: string; aid: string } {
  const parts = path.split("/");
  return { id: parts[2], aid: parts[4] };
}

function findAssignment(
  load: Load,
  assignmentId: string,
): LoadCrewAssignment | undefined {
  return load.assignments.find((a) => a.id === assignmentId);
}

async function createLoad(_path: string, body?: unknown) {
  await delay();
  const data = body as Partial<Load>;

  if (!data.customerId || !data.locationId || !data.productTypeId) {
    return jsonResponse(
      { message: "Customer, Location, and Work Type are required." },
      400,
    );
  }
  const location = locations.find((l) => l.id === data.locationId);
  if (!location || location.customerId !== data.customerId) {
    return jsonResponse(
      { message: "Location does not belong to the selected Customer." },
      400,
    );
  }
  const productType = productTypes.find((p) => p.id === data.productTypeId);
  if (!productType || productType.customerId !== data.customerId) {
    return jsonResponse(
      { message: "Work Type does not belong to the selected Customer." },
      400,
    );
  }

  const now = new Date().toISOString();
  const ticketNumber = ticketCounter++;
  const { paySnapshot, billingSnapshot } = snapshotFromProductType(
    productType,
    now,
  );
  const load: Load = {
    id: generateId("load"),
    ticketNumber,
    date: data.date ?? now.slice(0, 10),
    locationId: data.locationId,
    customerId: data.customerId,
    productTypeId: data.productTypeId,
    doorNumber: data.doorNumber ?? "",
    containerNumber: data.containerNumber ?? "",
    trailerNumber: data.trailerNumber ?? "",
    sealNumber: data.sealNumber ?? "",
    vendor: data.vendor ?? "",
    poNumbers: data.poNumbers ?? [],
    sorts: data.sorts ?? 0,
    cases: data.cases ?? 0,
    weight: data.weight ?? 0,
    palletCount: data.palletCount,
    pieceCount: data.pieceCount,
    assignments: [],
    supervisorUserId: data.supervisorUserId ?? null,
    paySnapshot,
    billingSnapshot,
    status: data.scheduledDate ? "scheduled" : "draft",
    billedAmount: 0,
    payoutAmount: 0,
    notes: [],
    operationalNotes: data.operationalNotes ?? null,
    completionNotes: null,
    scheduledDate: data.scheduledDate ?? null,
    scheduledStartTime: data.scheduledStartTime ?? null,
    createdAt: now,
    createdByUserId: data.createdByUserId ?? "user-admin",
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    closedAt: null,
    closedByUserId: null,
    cancelledAt: null,
    lastUpdatedAt: now,
  };
  loads.push(load);
  return jsonResponse(load, 201);
}

async function updateLoad(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }

  const data = body as Partial<Load>;
  const nextCustomerId = data.customerId ?? loads[idx].customerId;
  const nextLocationId = data.locationId ?? loads[idx].locationId;
  if (data.customerId || data.locationId) {
    const location = locations.find((l) => l.id === nextLocationId);
    if (!location || location.customerId !== nextCustomerId) {
      return jsonResponse(
        { message: "Location does not belong to the selected Customer." },
        400,
      );
    }
  }

  loads[idx] = {
    ...loads[idx],
    ...data,
    lastUpdatedAt: new Date().toISOString(),
  };

  // Work Type changed pre-closure — re-snapshot from the live rates.
  if (data.productTypeId && data.productTypeId !== loads[idx].productTypeId) {
    const productType = productTypes.find((p) => p.id === data.productTypeId);
    if (!productType || productType.customerId !== nextCustomerId) {
      return jsonResponse(
        { message: "Work Type does not belong to the selected Customer." },
        400,
      );
    }
    const { paySnapshot, billingSnapshot } = snapshotFromProductType(
      productType,
      new Date().toISOString(),
    );
    loads[idx].paySnapshot = paySnapshot;
    loads[idx].billingSnapshot = billingSnapshot;
  }

  recomputeLoadFinancials(idx);
  return jsonResponse(loads[idx]);
}

async function assignCrewMember(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }

  const data = body as { employeeId?: string; assignedByUserId?: string };
  if (!data.employeeId) {
    return jsonResponse({ message: "employeeId is required." }, 400);
  }
  const employee = employees.find((e) => e.id === data.employeeId);
  if (!employee || employee.employmentStatus === "archived") {
    return jsonResponse(
      { message: "Crew member must be active to be assigned." },
      400,
    );
  }
  const alreadyAssigned = loads[idx].assignments.some(
    (a) => a.employeeId === data.employeeId && a.status !== "removed",
  );
  if (alreadyAssigned) {
    return jsonResponse(
      { message: "This crew member is already assigned to this load." },
      409,
    );
  }

  const now = new Date().toISOString();
  const assignment: LoadCrewAssignment = {
    id: generateId(`${id}-a`),
    employeeId: data.employeeId,
    status: "assigned",
    assignedAt: now,
    assignedByUserId: data.assignedByUserId ?? "user-admin",
    clockIn: null,
    clockOut: null,
    breaks: [],
    removedAt: null,
    removedByUserId: null,
    removalReason: null,
  };
  loads[idx].assignments.push(assignment);
  loads[idx].lastUpdatedAt = now;
  return jsonResponse(loads[idx]);
}

async function clockInCrewMember(path: string, body?: unknown) {
  await delay();
  const { id, aid } = loadAndAssignmentIds(path);
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }
  const assignment = findAssignment(loads[idx], aid);
  if (!assignment) return jsonResponse({ message: "Not found" }, 404);
  if (assignment.status !== "assigned") {
    return jsonResponse(
      { message: "This crew member has already clocked in." },
      400,
    );
  }

  const data = body as { atTime?: string };
  const atTime = data.atTime ?? nowHHMM();
  assignment.status = "clocked_in";
  assignment.clockIn = atTime;

  if (loads[idx].status === "draft" || loads[idx].status === "scheduled") {
    loads[idx].status = "in_progress";
    loads[idx].startedAt = new Date().toISOString();
  }
  loads[idx].lastUpdatedAt = new Date().toISOString();
  return jsonResponse(loads[idx]);
}

async function startCrewBreak(path: string, body?: unknown) {
  await delay();
  const { id, aid } = loadAndAssignmentIds(path);
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }
  const assignment = findAssignment(loads[idx], aid);
  if (!assignment) return jsonResponse({ message: "Not found" }, 404);
  const blocked = startBreakBlockedReason(assignment);
  if (blocked) return jsonResponse({ message: blocked }, 400);

  const data = body as { atTime?: string };
  const atTime = data.atTime ?? nowHHMM();
  assignment.breaks.push({
    id: generateId(`${aid}-b`),
    breakStart: atTime,
    breakEnd: null,
  });
  assignment.status = "on_break";
  loads[idx].lastUpdatedAt = new Date().toISOString();
  return jsonResponse(loads[idx]);
}

async function endCrewBreak(path: string, body?: unknown) {
  await delay();
  const { id, aid } = loadAndAssignmentIds(path);
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }
  const assignment = findAssignment(loads[idx], aid);
  if (!assignment) return jsonResponse({ message: "Not found" }, 404);
  const blocked = endBreakBlockedReason(assignment);
  if (blocked) return jsonResponse({ message: blocked }, 400);

  const data = body as { atTime?: string };
  const atTime = data.atTime ?? nowHHMM();
  const openBreak = assignment.breaks.find((b) => !b.breakEnd);
  if (openBreak) openBreak.breakEnd = atTime;
  assignment.status = "clocked_in";
  loads[idx].lastUpdatedAt = new Date().toISOString();
  return jsonResponse(loads[idx]);
}

async function clockOutCrewMember(path: string, body?: unknown) {
  await delay();
  const { id, aid } = loadAndAssignmentIds(path);
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }
  const assignment = findAssignment(loads[idx], aid);
  if (!assignment) return jsonResponse({ message: "Not found" }, 404);
  const blocked = clockOutBlockedReason(assignment);
  if (blocked) return jsonResponse({ message: blocked }, 400);

  const data = body as { atTime?: string };
  const atTime = data.atTime ?? nowHHMM();
  assignment.status = "clocked_out";
  assignment.clockOut = atTime;
  recomputeLoadFinancials(idx);
  loads[idx].lastUpdatedAt = new Date().toISOString();
  return jsonResponse(loads[idx]);
}

async function removeCrewMember(path: string, body?: unknown) {
  await delay();
  const { id, aid } = loadAndAssignmentIds(path);
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (READONLY_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }
  const assignment = findAssignment(loads[idx], aid);
  if (!assignment) return jsonResponse({ message: "Not found" }, 404);
  if (assignment.status === "removed") {
    return jsonResponse({ message: "Already removed." }, 400);
  }

  const data = body as { removedByUserId?: string; removalReason?: string };
  const now = new Date().toISOString();
  const atTime = nowHHMM();
  // Preserve worked-time history: close any open break and clock out first.
  if (assignment.status === "on_break") {
    const openBreak = assignment.breaks.find((b) => !b.breakEnd);
    if (openBreak) openBreak.breakEnd = atTime;
  }
  if (assignment.status === "clocked_in" || assignment.status === "on_break") {
    assignment.clockOut = atTime;
  }
  assignment.status = "removed";
  assignment.removedAt = now;
  assignment.removedByUserId = data.removedByUserId ?? "user-admin";
  assignment.removalReason = data.removalReason ?? null;

  recomputeLoadFinancials(idx);
  loads[idx].lastUpdatedAt = now;
  return jsonResponse(loads[idx]);
}

async function pauseLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (loads[idx].status !== "in_progress") {
    return jsonResponse(
      { message: "Only an in-progress load can be paused." },
      400,
    );
  }
  const now = new Date().toISOString();
  loads[idx].status = "paused";
  loads[idx].pausedAt = now;
  loads[idx].lastUpdatedAt = now;
  return jsonResponse(loads[idx]);
}

async function resumeLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (loads[idx].status !== "paused") {
    return jsonResponse({ message: "Only a paused load can be resumed." }, 400);
  }
  loads[idx].status = "in_progress";
  loads[idx].pausedAt = null;
  loads[idx].lastUpdatedAt = new Date().toISOString();
  return jsonResponse(loads[idx]);
}

async function completeLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  const load = loads[idx];
  if (load.status !== "in_progress" && load.status !== "paused") {
    return jsonResponse(
      { message: "Only an in-progress or paused load can be completed." },
      400,
    );
  }

  const productType = productTypes.find((p) => p.id === load.productTypeId);
  const readiness = getLoadReadiness(load, employees, productType);
  if (readiness.status === "review") {
    const blockers = readiness.issues.filter((i) => i.severity === "blocker");
    if (blockers.length > 0) {
      return jsonResponse(
        {
          message: "This load isn't ready to complete.",
          code: "LOAD_NOT_READY",
          issues: readiness.issues,
        },
        409,
      );
    }
  }

  const now = new Date().toISOString();
  load.status = "completed";
  load.completedAt = now;
  recomputeLoadFinancials(idx);
  load.lastUpdatedAt = now;
  return jsonResponse(load);
}

async function reopenLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (loads[idx].status !== "completed") {
    return jsonResponse(
      { message: "Only a completed load can be reopened." },
      400,
    );
  }
  loads[idx].status = "in_progress";
  loads[idx].completedAt = null;
  loads[idx].lastUpdatedAt = new Date().toISOString();
  return jsonResponse(loads[idx]);
}

async function closeLoad(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (loads[idx].status !== "completed") {
    return jsonResponse(
      { message: "Only a completed load can be closed." },
      400,
    );
  }
  const data = body as { closedByUserId?: string };
  const now = new Date().toISOString();
  loads[idx].status = "closed";
  loads[idx].closedAt = now;
  loads[idx].closedByUserId = data.closedByUserId ?? "user-admin";
  loads[idx].lastUpdatedAt = now;
  return jsonResponse(loads[idx]);
}

async function cancelLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  if (!EDITABLE_LOAD_STATUSES.includes(loads[idx].status)) {
    return loadNotEditableResponse();
  }
  const now = new Date().toISOString();
  loads[idx].status = "cancelled";
  loads[idx].cancelledAt = now;
  loads[idx].billedAmount = 0;
  loads[idx].payoutAmount = 0;
  loads[idx].lastUpdatedAt = now;
  return jsonResponse(loads[idx]);
}

// ── Load attachments ────────────────────────────────────────────────

async function listLoadAttachmentsHandler(path: string) {
  await delay();
  const id = path.split("/")[2];
  return jsonResponse(getLoadAttachments(id));
}

async function createLoadAttachmentHandler(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  if (!loads.some((l) => l.id === id)) {
    return jsonResponse({ message: "Not found" }, 404);
  }
  const data = body as Partial<LoadAttachment>;
  if (!data.fileName || !data.category || !data.fileUrl) {
    return jsonResponse(
      { message: "fileName, category, and fileUrl are required." },
      400,
    );
  }
  const attachment: LoadAttachment = {
    id: generateId("att"),
    loadId: id,
    fileName: data.fileName,
    category: data.category,
    mimeType: data.mimeType ?? "application/octet-stream",
    sizeBytes: data.sizeBytes ?? 0,
    fileUrl: data.fileUrl,
    thumbnailUrl: data.thumbnailUrl,
    title: data.title,
    description: data.description,
    uploadedByUserId: data.uploadedByUserId ?? "user-admin",
    uploadedAt: new Date().toISOString(),
    source: data.source ?? "admin",
    status: "active",
  };
  addLoadAttachment(attachment);
  return jsonResponse(attachment, 201);
}

async function toggleAttachmentArchiveHandler(path: string) {
  await delay();
  const parts = path.split("/");
  const attachmentId = parts[4];
  const attachment = getLoadAttachmentById(attachmentId);
  if (!attachment) return jsonResponse({ message: "Not found" }, 404);
  const archiving = attachment.status === "active";
  const updated = updateLoadAttachment(attachmentId, {
    status: archiving ? "archived" : "active",
    archivedAt: archiving ? new Date().toISOString() : undefined,
    archivedByUserId: archiving ? "user-admin" : undefined,
  });
  return jsonResponse(updated);
}

async function createUser(_path: string, body?: unknown) {
  await delay();
  const data = body as Partial<SystemUser>;
  if (data.email && users.some((u) => u.email === data.email)) {
    return jsonResponse(
      { message: `"${data.email}" is already registered.` },
      409,
    );
  }
  const user = {
    ...(body as Record<string, unknown>),
    id: generateId("user"),
    status: "active",
  } as unknown as SystemUser;
  users.push(user);
  return jsonResponse(user, 201);
}

async function updateUser(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  const data = body as Partial<SystemUser>;
  if (data.email && users.some((u) => u.email === data.email && u.id !== id)) {
    return jsonResponse(
      { message: `"${data.email}" is already registered.` },
      409,
    );
  }
  users[idx] = { ...users[idx], ...data };
  return jsonResponse(users[idx]);
}

async function toggleUserArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  users[idx].status = users[idx].status === "active" ? "archived" : "active";
  return jsonResponse(users[idx]);
}

// ── Route table ───────────────────────────────────────────────────

const routes: {
  match: (method: string, path: string) => boolean;
  fn: (path: string, body?: unknown) => Promise<unknown>;
}[] = [
  // Auth
  exact("POST", "/auth/login", handleAuthLogin),

  // Locations
  exact("GET", "/locations", listLocations),
  exact("POST", "/locations", createLocation),
  pattern("PATCH", /^\/locations\/[^/]+$/, updateLocation),
  pattern(
    "POST",
    /^\/locations\/[^/]+\/toggle-archive$/,
    toggleLocationArchive,
  ),

  // Customers
  exact("GET", "/customers", listCustomers),
  exact("POST", "/customers", createCustomer),
  pattern("PATCH", /^\/customers\/[^/]+$/, updateCustomer),
  pattern(
    "POST",
    /^\/customers\/[^/]+\/toggle-archive$/,
    toggleCustomerArchive,
  ),

  // Employees
  exact("GET", "/employees", listEmployees),
  exact("POST", "/employees", createEmployee),
  pattern("PATCH", /^\/employees\/[^/]+$/, updateEmployee),
  pattern(
    "POST",
    /^\/employees\/[^/]+\/toggle-archive$/,
    toggleEmployeeArchive,
  ),

  // Product Types
  exact("GET", "/product-types", listProductTypes),
  exact("POST", "/product-types", createProductType),
  pattern("PATCH", /^\/product-types\/[^/]+$/, updateProductType),
  pattern(
    "POST",
    /^\/product-types\/[^/]+\/toggle-archive$/,
    toggleProductTypeArchive,
  ),

  // Loads
  exact("GET", "/loads", listLoads),
  exact("POST", "/loads", createLoad),
  pattern("PATCH", /^\/loads\/[^/]+$/, updateLoad),
  pattern("POST", /^\/loads\/[^/]+\/assignments$/, assignCrewMember),
  pattern(
    "POST",
    /^\/loads\/[^/]+\/assignments\/[^/]+\/clock-in$/,
    clockInCrewMember,
  ),
  pattern(
    "POST",
    /^\/loads\/[^/]+\/assignments\/[^/]+\/break-start$/,
    startCrewBreak,
  ),
  pattern(
    "POST",
    /^\/loads\/[^/]+\/assignments\/[^/]+\/break-end$/,
    endCrewBreak,
  ),
  pattern(
    "POST",
    /^\/loads\/[^/]+\/assignments\/[^/]+\/clock-out$/,
    clockOutCrewMember,
  ),
  pattern(
    "POST",
    /^\/loads\/[^/]+\/assignments\/[^/]+\/remove$/,
    removeCrewMember,
  ),
  pattern("POST", /^\/loads\/[^/]+\/pause$/, pauseLoad),
  pattern("POST", /^\/loads\/[^/]+\/resume$/, resumeLoad),
  pattern("POST", /^\/loads\/[^/]+\/complete$/, completeLoad),
  pattern("POST", /^\/loads\/[^/]+\/reopen$/, reopenLoad),
  pattern("POST", /^\/loads\/[^/]+\/close$/, closeLoad),
  pattern("POST", /^\/loads\/[^/]+\/cancel$/, cancelLoad),
  pattern("GET", /^\/loads\/[^/]+\/attachments$/, listLoadAttachmentsHandler),
  pattern("POST", /^\/loads\/[^/]+\/attachments$/, createLoadAttachmentHandler),
  pattern(
    "POST",
    /^\/loads\/[^/]+\/attachments\/[^/]+\/toggle-archive$/,
    toggleAttachmentArchiveHandler,
  ),

  // Users
  exact("GET", "/users", listUsers),
  exact("POST", "/users", createUser),
  pattern("PATCH", /^\/users\/[^/]+$/, updateUser),
  pattern("POST", /^\/users\/[^/]+\/toggle-archive$/, toggleUserArchive),

  // Invoices
  exact("GET", "/invoices", listInvoices),
  exact("POST", "/invoices", createInvoice),
  pattern("GET", /^\/invoices\/[^/]+$/, getInvoiceById),

  // Payroll status lifecycle
  pattern("GET", /^\/payroll\/records\/[^/]+$/, getPayrollRecord),
  pattern("POST", /^\/payroll\/records\/.+\/approve$/, approvePayrollRecord),
  pattern("POST", /^\/payroll\/records\/.+\/mark-paid$/, markPaidPayrollRecord),
];

// ── Invoice handlers ──────────────────────────────────────────────

async function listInvoices() {
  await delay();
  return jsonResponse(getInvoices());
}

async function getInvoiceById(path: string) {
  await delay();
  const id = path.split("/")[2];
  const invoice = getInvoice(id);
  if (!invoice) return jsonResponse({ message: "Invoice not found." }, 404);
  return jsonResponse(invoice);
}

async function createInvoice(_path: string, body?: unknown) {
  await delay(200);
  const data = body as {
    customerId?: string;
    loadIds?: string[];
    invoiceDate?: string;
    dueDate?: string;
    notes?: string | null;
  };

  // Validate required fields
  if (!data.customerId)
    return jsonResponse(
      { message: "Customer is required.", code: "CUSTOMER_REQUIRED" },
      400,
    );
  if (!data.loadIds || data.loadIds.length === 0)
    return jsonResponse(
      {
        message: "At least one billable load is required.",
        code: "INVOICE_LOADS_REQUIRED",
      },
      400,
    );
  if (!data.invoiceDate)
    return jsonResponse(
      { message: "Invoice date is required.", code: "INVOICE_DATE_REQUIRED" },
      400,
    );
  if (!data.dueDate)
    return jsonResponse(
      { message: "Due date is required.", code: "DUE_DATE_REQUIRED" },
      400,
    );
  if (data.dueDate < data.invoiceDate)
    return jsonResponse(
      {
        message: "Due date cannot be earlier than invoice date.",
        code: "INVALID_DUE_DATE",
      },
      400,
    );

  const customer = customers.find((c) => c.id === data.customerId);
  if (!customer)
    return jsonResponse(
      { message: "Customer not found.", code: "CUSTOMER_NOT_FOUND" },
      404,
    );

  // Validate loads
  const selectedLoads: Load[] = [];
  for (const loadId of data.loadIds!) {
    const load = loads.find((l) => l.id === loadId);
    if (!load)
      return jsonResponse(
        {
          message: "One or more selected loads could not be found.",
          code: "LOAD_NOT_FOUND",
        },
        400,
      );
    if (load.status !== "completed" && load.status !== "closed")
      return jsonResponse(
        {
          message: "Only completed or closed loads can be invoiced.",
          code: "LOAD_NOT_COMPLETED",
        },
        400,
      );
    if (load.billedAmount <= 0)
      return jsonResponse(
        {
          message: "One or more selected loads have no billable amount.",
          code: "LOAD_NOT_BILLABLE",
        },
        400,
      );
    // Check billing status using dynamic store
    const billing = getBillingStatus(load.id);
    if (billing.status === "invoiced")
      return jsonResponse(
        {
          message: "One or more selected loads have already been invoiced.",
          code: "LOAD_ALREADY_INVOICED",
        },
        400,
      );
    if (load.customerId !== data.customerId)
      return jsonResponse(
        {
          message: "Invoice customer does not match the selected loads.",
          code: "CUSTOMER_MISMATCH",
        },
        400,
      );
    selectedLoads.push(load);
  }

  // Derive line items
  const lineItems = selectedLoads.map((load) => {
    const locationName =
      locations.find((loc) => loc.id === load.locationId)?.name ?? "—";
    const productTypeName =
      productTypes.find((p) => p.id === load.productTypeId)?.name ?? "—";
    return {
      id: generateId("ili"),
      loadId: load.id,
      ticketNumber: load.ticketNumber,
      completedAt: load.date,
      locationName,
      productTypeName,
      containerNumber: load.containerNumber || null,
      caseCount: load.cases,
      description: `Load #${load.ticketNumber} — ${productTypeName}`,
      amount: load.billedAmount,
    };
  });

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const dates = selectedLoads.map((l) => l.date).sort();
  const invoice: Invoice = {
    id: generateId("inv"),
    invoiceNumber: getNextInvoiceNumber(),
    status: "draft",
    customerId: customer.id,
    customerName: customer.displayName,
    invoiceDate: data.invoiceDate!,
    dueDate: data.dueDate!,
    billingPeriodStart: dates[0],
    billingPeriodEnd: dates[dates.length - 1],
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(subtotal * 100) / 100,
    notes: data.notes?.trim() || null,
    createdAt: new Date().toISOString(),
    createdByName: "Rick Alvarez",
  };

  addInvoice(invoice);

  // Mark loads as invoiced
  markLoadsAsInvoiced(data.loadIds!, invoice.id);

  return jsonResponse(invoice, 201);
}

async function getPayrollRecord(path: string) {
  await delay();
  const id = path.split("/")[3];
  const override = payrollStatusOverrides[id];
  if (!override)
    return jsonResponse({
      status: "pending_review",
      approvedAt: null,
      approvedByName: null,
      paidAt: null,
      paidByName: null,
    });
  return jsonResponse(override);
}

async function approvePayrollRecord(path: string) {
  await delay();
  const id = path.split("/")[3];
  const override = payrollStatusOverrides[id];
  if (!override)
    return jsonResponse(
      { message: "Payroll record not found.", code: "PAYROLL_NOT_FOUND" },
      404,
    );
  if (override.status !== "pending_review")
    return jsonResponse(
      {
        message: "Only payroll records pending review can be approved.",
        code: "PAYROLL_NOT_PENDING_REVIEW",
      },
      400,
    );
  override.status = "approved";
  override.approvedAt = new Date().toISOString();
  override.approvedByName = "Rick Alvarez";
  return jsonResponse(override);
}

async function markPaidPayrollRecord(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[3];
  const override = payrollStatusOverrides[id];
  if (!override)
    return jsonResponse(
      { message: "Payroll record not found.", code: "PAYROLL_NOT_FOUND" },
      404,
    );
  if (override.status === "paid")
    return jsonResponse(
      {
        message: "This payroll record has already been marked as paid.",
        code: "PAYROLL_ALREADY_PAID",
      },
      400,
    );
  if (override.status !== "approved")
    return jsonResponse(
      {
        message: "Only approved payroll records can be marked as paid.",
        code: "PAYROLL_NOT_APPROVED",
      },
      400,
    );

  const data = body as {
    paidAt?: string;
    method?: string;
    reference?: string;
    note?: string;
    amount?: number;
  };
  if (!data?.reference || !String(data.reference).trim())
    return jsonResponse(
      {
        message: "Payment reference is required.",
        code: "PAYMENT_REFERENCE_REQUIRED",
      },
      400,
    );
  if (!data?.paidAt)
    return jsonResponse(
      { message: "Payment date is required.", code: "PAYMENT_DATE_REQUIRED" },
      400,
    );

  const payment: PayrollPayment = {
    amount: data.amount ?? 0,
    paidAt: data.paidAt,
    method: (data.method as PayrollPaymentMethod) ?? "direct_deposit",
    reference: String(data.reference).trim(),
    note: data.note?.trim() || null,
    recordedAt: new Date().toISOString(),
    recordedByName: "Rick Alvarez",
  };

  override.status = "paid";
  override.paidAt = new Date().toISOString();
  override.paidByName = "Rick Alvarez";
  override.payment = payment;

  return jsonResponse(override);
}

export async function handleMockRequest(
  method: string,
  apiPath: string,
  body?: unknown,
): Promise<Response | null> {
  if (!isMockActive()) return null;

  const route = routes.find((r) => r.match(method, apiPath));
  if (!route) {
    // Return empty arrays for unknown GET requests, 404 for mutations.
    if (method === "GET") {
      await delay();
      return jsonResponse([]);
    }
    return jsonResponse(
      { message: `No mock handler for ${method} ${apiPath}` },
      404,
    );
  }

  const result = await route.fn(apiPath, body);
  // Route handlers already return a Response; extract the awaited body.
  return result as unknown as Response;
}
