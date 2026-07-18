"use client";

import { type QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { ApiError, api } from "./api/client";
import { useAuth } from "./auth";
import type {
  Customer,
  Employee,
  Load,
  Location,
  ProductType,
  RateLine,
  Role,
  SystemUser,
} from "./types";

type NewUser = Omit<SystemUser, "id" | "status"> & { password: string };
type NewCustomer = Omit<Customer, "id" | "status">;
type NewEmployee = Omit<Employee, "id" | "status">;
type NewProductType = Omit<ProductType, "id" | "status">;
type NewLoad = Omit<
  Load,
  "id" | "ticketNumber" | "status" | "billedAmount" | "payoutAmount"
>;
type NewLocation = Omit<Location, "id">;

type AppData = {
  locations: Location[];
  customers: Customer[];
  employees: Employee[];
  productTypes: ProductType[];
  loads: Load[];
  users: SystemUser[];

  /** True until the initial datasets have loaded. */
  isLoading: boolean;

  currentLocationId: string;
  setCurrentLocationId: (id: string) => void;
  /** The authenticated user's role (read-only — derived from login). */
  role: Role;

  addLocation: (input: NewLocation) => Promise<void>;
  updateLocation: (id: string, input: Partial<Location>) => Promise<void>;

  addUser: (input: NewUser) => Promise<void>;

  addCustomer: (input: NewCustomer) => Promise<void>;
  updateCustomer: (id: string, input: Partial<Customer>) => Promise<void>;
  toggleCustomerArchive: (id: string) => Promise<void>;

  addEmployee: (input: NewEmployee) => Promise<void>;
  updateEmployee: (id: string, input: Partial<Employee>) => Promise<void>;
  toggleEmployeeArchive: (id: string) => Promise<void>;

  addProductType: (input: NewProductType) => Promise<void>;
  updateProductType: (id: string, input: Partial<ProductType>) => Promise<void>;
  toggleProductTypeArchive: (id: string) => Promise<void>;

  addLoad: (input: NewLoad) => Promise<Load | undefined>;
  updateLoad: (id: string, input: Partial<Load>) => Promise<void>;
  voidLoad: (id: string) => Promise<void>;
  archiveLoad: (id: string) => Promise<void>;
};

const AppDataContext = createContext<AppData | null>(null);

const keys = {
  locations: ["locations"] as const,
  customers: ["customers"] as const,
  employees: ["employees"] as const,
  productTypes: ["productTypes"] as const,
  loads: ["loads"] as const,
  users: ["users"] as const,
} satisfies Record<string, QueryKey>;

// --- request body shaping (only send fields the API accepts) ---

function stripRateLineIds(rateLines: RateLine[]): Omit<RateLine, "id">[] {
  return rateLines.map(({ id: _id, ...rest }) => rest);
}

function locationBody(input: Partial<Location>) {
  // Empty/blank optional fields are omitted (undefined) rather than sent as ""
  // — the API's optional fields don't accept null, and code is unique.
  const clean = (v: string | null | undefined) => v || undefined;
  return {
    name: input.name,
    region: input.region,
    code: clean(input.code),
    group: clean(input.group),
    addressL1: clean(input.addressL1),
    city: clean(input.city),
    state: clean(input.state),
    postalCode: clean(input.postalCode),
    timezone: clean(input.timezone),
    status: clean(input.status),
    shiftStart: clean(input.shiftStart),
    shiftEnd: clean(input.shiftEnd),
  };
}

function customerBody(input: Partial<Customer>) {
  const {
    contactName,
    email,
    phone,
    displayName,
    legalCompanyName,
    locationIds,
  } = input;
  return {
    contactName,
    email,
    phone,
    displayName,
    legalCompanyName,
    locationIds,
  };
}

function employeeBody(input: Partial<Employee>) {
  const { name, email, phone, address, hourlyRate, category, locationId } =
    input;
  // The API accepts a category key or omits it; it never accepts null.
  return {
    name,
    email,
    phone,
    address,
    hourlyRate,
    category: category ?? undefined,
    locationId,
  };
}

function productTypeBody(input: Partial<ProductType>) {
  const { customerId, locationId, name, rateLines } = input;
  return {
    customerId,
    locationId,
    name,
    rateLines: rateLines ? stripRateLineIds(rateLines) : undefined,
  };
}

// Runs a mutation, showing a success/error toast. On failure it surfaces the
// error as a toast and resolves to `undefined` (rather than rejecting) so
// fire-and-forget call sites don't produce unhandled promise rejections.
async function withToast<T>(
  action: () => Promise<T>,
  successMessage: string,
): Promise<T | undefined> {
  try {
    const result = await action();
    toast.success(successMessage);
    return result;
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Something went wrong.";
    toast.error(message);
    return undefined;
  }
}

function loadBody(input: Partial<Load>) {
  const {
    date,
    locationId,
    customerId,
    productTypeId,
    doorNumber,
    containerNumber,
    vendor,
    poNumbers,
    sorts,
    cases,
    weight,
    assignments,
    status,
  } = input;
  // billedAmount / payoutAmount / ticketNumber are computed server-side.
  return {
    date,
    locationId,
    customerId,
    productTypeId,
    doorNumber,
    containerNumber,
    vendor,
    poNumbers,
    sorts,
    cases,
    weight,
    assignments,
    status,
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const locationsQuery = useQuery({
    queryKey: keys.locations,
    queryFn: () => api.get<Location[]>("/locations"),
  });
  const customersQuery = useQuery({
    queryKey: keys.customers,
    queryFn: () => api.get<Customer[]>("/customers"),
  });
  const employeesQuery = useQuery({
    queryKey: keys.employees,
    queryFn: () => api.get<Employee[]>("/employees"),
  });
  const productTypesQuery = useQuery({
    queryKey: keys.productTypes,
    queryFn: () => api.get<ProductType[]>("/product-types"),
  });
  const loadsQuery = useQuery({
    queryKey: keys.loads,
    queryFn: () => api.get<Load[]>("/loads"),
  });
  const usersQuery = useQuery({
    queryKey: keys.users,
    queryFn: () => api.get<SystemUser[]>("/users"),
  });

  const locations = useMemo(
    () => locationsQuery.data ?? [],
    [locationsQuery.data],
  );
  const customers = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data],
  );
  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );
  const productTypes = useMemo(
    () => productTypesQuery.data ?? [],
    [productTypesQuery.data],
  );
  const loads = useMemo(() => loadsQuery.data ?? [], [loadsQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const [currentLocationId, setCurrentLocationId] = useState<string>("");
  // Role follows whoever is logged in — no manual switching.
  const role: Role = user?.role ?? "admin";

  // Default the active location to the logged-in user's assigned location,
  // falling back to the first one once locations load.
  useEffect(() => {
    if (!currentLocationId) {
      if (user?.locationId) {
        setCurrentLocationId(user.locationId);
      } else if (locations.length > 0) {
        setCurrentLocationId(locations[0].id);
      }
    }
  }, [locations, currentLocationId, user]);

  const invalidate = useCallback(
    (key: QueryKey) => queryClient.invalidateQueries({ queryKey: key }),
    [queryClient],
  );

  const addLocation = useCallback(
    (input: NewLocation) =>
      withToast(async () => {
        await api.post("/locations", locationBody(input));
        await invalidate(keys.locations);
      }, "Location created."),
    [invalidate],
  );
  const updateLocation = useCallback(
    (id: string, input: Partial<Location>) =>
      withToast(async () => {
        await api.patch(`/locations/${id}`, locationBody(input));
        await invalidate(keys.locations);
      }, "Location saved."),
    [invalidate],
  );

  const addUser = useCallback(
    (input: NewUser) =>
      withToast(async () => {
        await api.post("/users", input);
        await invalidate(keys.users);
      }, "User created."),
    [invalidate],
  );

  const addCustomer = useCallback(
    (input: NewCustomer) =>
      withToast(async () => {
        await api.post("/customers", customerBody(input));
        await invalidate(keys.customers);
      }, "Customer created."),
    [invalidate],
  );
  const updateCustomer = useCallback(
    (id: string, input: Partial<Customer>) =>
      withToast(async () => {
        await api.patch(`/customers/${id}`, customerBody(input));
        await invalidate(keys.customers);
      }, "Customer saved."),
    [invalidate],
  );
  const toggleCustomerArchive = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/customers/${id}/toggle-archive`);
        await invalidate(keys.customers);
      }, "Customer updated."),
    [invalidate],
  );

  const addEmployee = useCallback(
    (input: NewEmployee) =>
      withToast(async () => {
        await api.post("/employees", employeeBody(input));
        await invalidate(keys.employees);
      }, "Employee created."),
    [invalidate],
  );
  const updateEmployee = useCallback(
    (id: string, input: Partial<Employee>) =>
      withToast(async () => {
        await api.patch(`/employees/${id}`, employeeBody(input));
        await invalidate(keys.employees);
      }, "Employee saved."),
    [invalidate],
  );
  const toggleEmployeeArchive = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/employees/${id}/toggle-archive`);
        await invalidate(keys.employees);
      }, "Employee updated."),
    [invalidate],
  );

  const addProductType = useCallback(
    (input: NewProductType) =>
      withToast(async () => {
        await api.post("/product-types", productTypeBody(input));
        await invalidate(keys.productTypes);
      }, "Product type created."),
    [invalidate],
  );
  const updateProductType = useCallback(
    (id: string, input: Partial<ProductType>) =>
      withToast(async () => {
        await api.patch(`/product-types/${id}`, productTypeBody(input));
        await invalidate(keys.productTypes);
      }, "Product type saved."),
    [invalidate],
  );
  const toggleProductTypeArchive = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/product-types/${id}/toggle-archive`);
        await invalidate(keys.productTypes);
      }, "Product type updated."),
    [invalidate],
  );

  const addLoad = useCallback(
    (input: NewLoad) =>
      withToast(async () => {
        const created = await api.post<Load>("/loads", loadBody(input));
        await invalidate(keys.loads);
        return created;
      }, "Load saved."),
    [invalidate],
  );
  const updateLoad = useCallback(
    (id: string, input: Partial<Load>) =>
      withToast(async () => {
        await api.patch(`/loads/${id}`, loadBody(input));
        await invalidate(keys.loads);
      }, "Load saved."),
    [invalidate],
  );
  const voidLoad = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/loads/${id}/void`);
        await invalidate(keys.loads);
      }, "Load voided."),
    [invalidate],
  );
  const archiveLoad = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/loads/${id}/archive`);
        await invalidate(keys.loads);
      }, "Load archived."),
    [invalidate],
  );

  const isLoading =
    locationsQuery.isLoading ||
    customersQuery.isLoading ||
    employeesQuery.isLoading ||
    productTypesQuery.isLoading ||
    loadsQuery.isLoading ||
    usersQuery.isLoading;

  const value = useMemo<AppData>(
    () => ({
      locations,
      customers,
      employees,
      productTypes,
      loads,
      users,
      isLoading,
      currentLocationId,
      setCurrentLocationId,
      role,
      addLocation,
      updateLocation,
      addUser,
      addCustomer,
      updateCustomer,
      toggleCustomerArchive,
      addEmployee,
      updateEmployee,
      toggleEmployeeArchive,
      addProductType,
      updateProductType,
      toggleProductTypeArchive,
      addLoad,
      updateLoad,
      voidLoad,
      archiveLoad,
    }),
    [
      locations,
      customers,
      employees,
      productTypes,
      loads,
      users,
      isLoading,
      currentLocationId,
      role,
      addLocation,
      updateLocation,
      addUser,
      addCustomer,
      updateCustomer,
      toggleCustomerArchive,
      addEmployee,
      updateEmployee,
      toggleEmployeeArchive,
      addProductType,
      updateProductType,
      toggleProductTypeArchive,
      addLoad,
      updateLoad,
      voidLoad,
      archiveLoad,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return ctx;
}
