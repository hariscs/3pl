// Mock API handler used when the dev-bypass token is active.
// Every GET returns static mock data; mutations update the in-memory store
// so the UI feels real.  No API server required.

import { DEV_BYPASS_TOKEN, getToken } from "./token";
import {
    CUSTOMERS,
    EMPLOYEES,
    LOCATIONS,
    LOADS,
    PRODUCT_TYPES,
    SYSTEM_USERS,
} from "./mock-data";
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

let ticketCounter = Math.max(...loads.map((l) => l.ticketNumber)) + 1;

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

type Handler = (method: string, path: string, body?: unknown) => Promise<Response>;

const exact = (
    method: string,
    pathPattern: string,
    fn: (path: string, body?: unknown) => Promise<unknown>,
) => {
    return { method, match: (m: string, p: string) => m === method && p === pathPattern, fn };
};

const pattern = (
    method: string,
    regex: RegExp,
    fn: (path: string, body?: unknown) => Promise<unknown>,
) => {
    return { method, match: (m: string, p: string) => m === method && regex.test(p), fn };
};

async function handleAuthLogin(_path: string, body?: unknown) {
    const { email } = (body ?? {}) as { email?: string };
    const user = users.find((u) => u.email === email);
    if (!user) return jsonResponse({ message: "Invalid email or password." }, 401);
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
    const loc = { ...(body as Record<string, unknown>), id: generateId("loc") } as unknown as Location;
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
    const cust = { ...(body as Record<string, unknown>), id: generateId("cust"), status: "active" } as unknown as Customer;
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
    customers[idx].status = customers[idx].status === "active" ? "archived" : "active";
    return jsonResponse(customers[idx]);
}

async function createEmployee(_path: string, body?: unknown) {
    await delay();
    const emp = { ...(body as Record<string, unknown>), id: generateId("emp"), status: "active" } as unknown as Employee;
    employees.push(emp);
    return jsonResponse(emp, 201);
}

async function updateEmployee(path: string, body?: unknown) {
    await delay();
    const id = path.split("/")[2];
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
    employees[idx] = { ...employees[idx], ...(body as Partial<Employee>) };
    return jsonResponse(employees[idx]);
}

async function toggleEmployeeArchive(path: string) {
    await delay();
    const id = path.split("/")[2];
    const idx = employees.findIndex((e) => e.id === id);
    if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
    employees[idx].status = employees[idx].status === "active" ? "archived" : "active";
    return jsonResponse(employees[idx]);
}

async function createProductType(_path: string, body?: unknown) {
    await delay();
    const pt = { ...(body as Record<string, unknown>), id: generateId("pt"), status: "active", rateLines: ((body as { rateLines?: unknown[] })?.rateLines ?? []).map((rl: unknown) => ({ ...rl as object, id: generateId("rl") })) } as unknown as ProductType;
    productTypes.push(pt);
    return jsonResponse(pt, 201);
}

async function updateProductType(path: string, body?: unknown) {
    await delay();
    const id = path.split("/")[2];
    const idx = productTypes.findIndex((p) => p.id === id);
    if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
    productTypes[idx] = { ...productTypes[idx], ...(body as Partial<ProductType>) };
    return jsonResponse(productTypes[idx]);
}

async function toggleProductTypeArchive(path: string) {
    await delay();
    const id = path.split("/")[2];
    const idx = productTypes.findIndex((p) => p.id === id);
    if (idx === -1) return jsonResponse({ message: "Not found" }, 404);
    productTypes[idx].status = productTypes[idx].status === "active" ? "archived" : "active";
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
    loads[idx] = { ...loads[idx], ...(body as Partial<Load>), lastUpdatedAt: new Date().toISOString() };
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
    const user = { ...(body as Record<string, unknown>), id: generateId("user"), status: "active" } as unknown as SystemUser;
    users.push(user);
    return jsonResponse(user, 201);
}

// ── Route table ───────────────────────────────────────────────────

const routes: { match: (method: string, path: string) => boolean; fn: (path: string, body?: unknown) => Promise<unknown> }[] = [
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
    pattern("POST", /^\/customers\/[^/]+\/toggle-archive$/, toggleCustomerArchive),

    // Employees
    exact("GET", "/employees", listEmployees),
    exact("POST", "/employees", createEmployee),
    pattern("PATCH", /^\/employees\/[^/]+$/, updateEmployee),
    pattern("POST", /^\/employees\/[^/]+\/toggle-archive$/, toggleEmployeeArchive),

    // Product Types
    exact("GET", "/product-types", listProductTypes),
    exact("POST", "/product-types", createProductType),
    pattern("PATCH", /^\/product-types\/[^/]+$/, updateProductType),
    pattern("POST", /^\/product-types\/[^/]+\/toggle-archive$/, toggleProductTypeArchive),

    // Loads
    exact("GET", "/loads", listLoads),
    exact("POST", "/loads", createLoad),
    pattern("PATCH", /^\/loads\/[^/]+$/, updateLoad),
    pattern("POST", /^\/loads\/[^/]+\/void$/, voidLoad),
    pattern("POST", /^\/loads\/[^/]+\/archive$/, archiveLoad),

    // Users
    exact("GET", "/users", listUsers),
    exact("POST", "/users", createUser),
];

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
        return jsonResponse({ message: `No mock handler for ${method} ${apiPath}` }, 404);
    }

    const result = await route.fn(apiPath, body);
    // Route handlers already return a Response; extract the awaited body.
    return result as unknown as Response;
}