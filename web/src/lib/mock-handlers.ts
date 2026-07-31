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
  CUSTOMERS,
  EMPLOYEES,
  LOADS,
  LOCATIONS,
  PRODUCT_TYPES,
  SYSTEM_USERS,
} from "./mock-data";
import { DEV_BYPASS_TOKEN, getToken } from "./token";
import type {
  Customer,
  Employee,
  Load,
  Location,
  ProductType,
  SystemUser,
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
      amount: 134.0,
      paidAt: "2026-07-09",
      method: "direct_deposit",
      reference: "DD-2026-0709-0012",
      note: "Payroll for Jun 30 \u2013 Jul 6",
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

async function createLocation(_path: string, body?: unknown) {
  await delay();
  const loc = {
    ...(body as Record<string, unknown>),
    id: generateId("loc"),
  } as unknown as Location;
  locations.push(loc);
  return jsonResponse(loc, 201);
}

async function updateLocation(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = locations.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  locations[idx] = { ...locations[idx], ...(body as Partial<Location>) };
  return jsonResponse(locations[idx]);
}

async function createCustomer(_path: string, body?: unknown) {
  await delay();
  const cust = {
    ...(body as Record<string, unknown>),
    id: generateId("cust"),
    status: "active",
  } as unknown as Customer;
  customers.push(cust);
  return jsonResponse(cust, 201);
}

async function updateCustomer(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  customers[idx] = { ...customers[idx], ...(body as Partial<Customer>) };
  return jsonResponse(customers[idx]);
}

async function toggleCustomerArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  customers[idx].status =
    customers[idx].status === "active" ? "archived" : "active";
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

async function createProductType(_path: string, body?: unknown) {
  await delay();
  const pt = {
    ...(body as Record<string, unknown>),
    id: generateId("pt"),
    status: "active",
    rateLines: ((body as { rateLines?: unknown[] })?.rateLines ?? []).map(
      (rl: unknown) => ({ ...(rl as object), id: generateId("rl") }),
    ),
  } as unknown as ProductType;
  productTypes.push(pt);
  return jsonResponse(pt, 201);
}

async function updateProductType(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = productTypes.findIndex((p) => p.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  productTypes[idx] = {
    ...productTypes[idx],
    ...(body as Partial<ProductType>),
  };
  return jsonResponse(productTypes[idx]);
}

async function toggleProductTypeArchive(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = productTypes.findIndex((p) => p.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  productTypes[idx].status =
    productTypes[idx].status === "active" ? "archived" : "active";
  return jsonResponse(productTypes[idx]);
}

async function createLoad(_path: string, body?: unknown) {
  await delay();
  const ticketNumber = ticketCounter++;
  const load = {
    ...(body as Record<string, unknown>),
    id: generateId("load"),
    ticketNumber,
    status: "active",
    billedAmount: 0,
    payoutAmount: 0,
    lastUpdatedAt: new Date().toISOString(),
  } as unknown as Load;
  loads.push(load);
  return jsonResponse(load, 201);
}

async function updateLoad(path: string, body?: unknown) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  loads[idx] = {
    ...loads[idx],
    ...(body as Partial<Load>),
    lastUpdatedAt: new Date().toISOString(),
  };
  return jsonResponse(loads[idx]);
}

async function voidLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  loads[idx].status = "void";
  loads[idx].billedAmount = 0;
  loads[idx].payoutAmount = 0;
  return jsonResponse(loads[idx]);
}

async function archiveLoad(path: string) {
  await delay();
  const id = path.split("/")[2];
  const idx = loads.findIndex((l) => l.id === id);
  if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
  loads[idx].status = "archived";
  return jsonResponse(loads[idx]);
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
  pattern("POST", /^\/loads\/[^/]+\/void$/, voidLoad),
  pattern("POST", /^\/loads\/[^/]+\/archive$/, archiveLoad),

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
    if (load.status !== "complete")
      return jsonResponse(
        {
          message: "Only completed loads can be invoiced.",
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
