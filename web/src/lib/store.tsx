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
  Role,
  SystemUser,
} from "./types";

type NewUser = Omit<SystemUser, "id" | "status"> & { password: string };
type NewCustomer = Omit<Customer, "id" | "createdAt" | "updatedAt">;
type NewEmployee = Omit<Employee, "id" | "employmentStatus">;
type NewProductType = Omit<ProductType, "id" | "createdAt" | "updatedAt">;
type NewLoad = Omit<
  Load,
  | "id"
  | "ticketNumber"
  | "status"
  | "billedAmount"
  | "payoutAmount"
  | "lastUpdatedAt"
  | "trailerNumber"
  | "sealNumber"
>;
type NewLocation = Omit<Location, "id" | "createdAt" | "updatedAt">;

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
  toggleLocationArchive: (id: string) => Promise<void>;

  addUser: (input: NewUser) => Promise<void>;
  updateUser: (id: string, input: Partial<SystemUser>) => Promise<void>;
  toggleUserArchive: (id: string) => Promise<void>;

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

function locationBody(input: Partial<Location>) {
  // Empty/blank optional fields are omitted (undefined) rather than sent as ""
  // — the API's optional fields don't accept null, and code is unique.
  const clean = (v: string | null | undefined) => v || undefined;
  return {
    name: input.name,
    customerId: input.customerId,
    region: input.region,
    code: clean(input.code),
    group: clean(input.group),
    addressL1: clean(input.addressL1),
    city: clean(input.city),
    state: clean(input.state),
    postalCode: clean(input.postalCode),
    country: clean(input.country),
    timezone: clean(input.timezone),
    notes: clean(input.notes),
    siteContact: input.siteContact,
    status: input.status,
    shiftStart: clean(input.shiftStart),
    shiftEnd: clean(input.shiftEnd),
  };
}

function customerBody(input: Partial<Customer>) {
  // Empty/blank optional fields are omitted (undefined) rather than sent as ""
  // — the API's optional fields don't accept null.
  const clean = (v: string | null | undefined) => v || undefined;
  return {
    displayName: input.displayName,
    code: clean(input.code),
    legalCompanyName: clean(input.legalCompanyName),
    status: input.status,
    industry: clean(input.industry),
    website: clean(input.website),
    taxId: clean(input.taxId),
    contactName: input.contactName,
    contactTitle: clean(input.contactTitle),
    email: input.email,
    phone: clean(input.phone),
    billingEmail: clean(input.billingEmail),
    paymentTerms: input.paymentTerms ?? undefined,
    notes: clean(input.notes),
  };
}

function employeeBody(input: Partial<Employee>) {
  const {
    employeeId,
    firstName,
    lastName,
    preferredName,
    profilePhotoUrl,
    phone,
    email,
    address,
    emergencyContact,
    hireDate,
    employmentType,
    category,
    notes,
    payType,
    hourlyRate,
    productionPayEligible,
    skillIds,
    certifications,
    trainingRecords,
  } = input;
  // The mock API accepts a category key or omits it; it never accepts null.
  return {
    employeeId,
    firstName,
    lastName,
    preferredName,
    profilePhotoUrl,
    phone,
    email,
    address,
    emergencyContact,
    hireDate,
    employmentType,
    category: category ?? undefined,
    notes,
    payType,
    hourlyRate,
    productionPayEligible,
    skillIds,
    certifications,
    trainingRecords,
  };
}

function userBody(input: Partial<SystemUser> & { password?: string }) {
  const {
    firstName,
    lastName,
    email,
    role,
    locationIds,
    customerId,
    linkedCrewMemberId,
    password,
  } = input;
  return {
    firstName,
    lastName,
    email,
    role,
    // Only meaningful for the role that owns it — send an empty array/undefined
    // for the rest rather than whatever stale value the form was last showing.
    locationIds: locationIds ?? [],
    customerId: customerId || undefined,
    linkedCrewMemberId: linkedCrewMemberId || undefined,
    // Omitted entirely on updates (undefined) so an edit never overwrites the
    // stored password with a blank value.
    password: password || undefined,
  };
}

function productTypeBody(input: Partial<ProductType>) {
  const clean = (v: string | null | undefined) => v || undefined;
  return {
    customerId: input.customerId,
    name: input.name,
    code: clean(input.code),
    status: input.status,
    unitOfMeasure: input.unitOfMeasure,
    notes: clean(input.notes),
    employeePayType: input.employeePayType,
    employeePayRate: input.employeePayRate,
    customerBillingType: input.customerBillingType,
    customerBillingRate: input.customerBillingRate,
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

  // Default the active location to the logged-in user's first assigned
  // location (meaningful for manager/lead), falling back to the first
  // location overall once locations load — admin/finance are unrestricted
  // and employee/customer have no location concept, so they all land here.
  useEffect(() => {
    if (!currentLocationId) {
      const assigned = user?.locationIds?.[0];
      if (assigned) {
        setCurrentLocationId(assigned);
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
  const toggleLocationArchive = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/locations/${id}/toggle-archive`);
        await invalidate(keys.locations);
      }, "Location updated."),
    [invalidate],
  );

  const addUser = useCallback(
    (input: NewUser) =>
      withToast(async () => {
        await api.post("/users", userBody(input));
        await invalidate(keys.users);
      }, "User created."),
    [invalidate],
  );
  const updateUser = useCallback(
    (id: string, input: Partial<SystemUser>) =>
      withToast(async () => {
        await api.patch(`/users/${id}`, userBody(input));
        await invalidate(keys.users);
      }, "User saved."),
    [invalidate],
  );
  const toggleUserArchive = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/users/${id}/toggle-archive`);
        await invalidate(keys.users);
      }, "User updated."),
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
      }, "Work type created."),
    [invalidate],
  );
  const updateProductType = useCallback(
    (id: string, input: Partial<ProductType>) =>
      withToast(async () => {
        await api.patch(`/product-types/${id}`, productTypeBody(input));
        await invalidate(keys.productTypes);
      }, "Work type saved."),
    [invalidate],
  );
  const toggleProductTypeArchive = useCallback(
    (id: string) =>
      withToast(async () => {
        await api.post(`/product-types/${id}/toggle-archive`);
        await invalidate(keys.productTypes);
      }, "Work type updated."),
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
      toggleLocationArchive,
      addUser,
      updateUser,
      toggleUserArchive,
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
      toggleLocationArchive,
      addUser,
      updateUser,
      toggleUserArchive,
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
