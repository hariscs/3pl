"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  CUSTOMERS,
  EMPLOYEES,
  LOADS,
  LOCATIONS,
  PRODUCT_TYPES,
  SYSTEM_USERS,
} from "./mock-data";
import type {
  Customer,
  Employee,
  Load,
  Location,
  ProductType,
  Role,
  SystemUser,
} from "./types";

type NewUser = Omit<SystemUser, "id" | "status">;
type NewCustomer = Omit<Customer, "id" | "status">;
type NewEmployee = Omit<Employee, "id" | "status">;
type NewProductType = Omit<ProductType, "id" | "status">;
type NewLoad = Omit<
  Load,
  "id" | "ticketNumber" | "status" | "billedAmount" | "payoutAmount"
>;

type AppData = {
  locations: Location[];
  customers: Customer[];
  employees: Employee[];
  productTypes: ProductType[];
  loads: Load[];
  users: SystemUser[];

  currentLocationId: string;
  setCurrentLocationId: (id: string) => void;
  role: Role;
  setRole: (role: Role) => void;

  addUser: (input: NewUser) => void;

  addCustomer: (input: NewCustomer) => void;
  updateCustomer: (id: string, input: Partial<Customer>) => void;
  toggleCustomerArchive: (id: string) => void;

  addEmployee: (input: NewEmployee) => void;
  updateEmployee: (id: string, input: Partial<Employee>) => void;
  toggleEmployeeArchive: (id: string) => void;

  addProductType: (input: NewProductType) => void;
  updateProductType: (id: string, input: Partial<ProductType>) => void;
  toggleProductTypeArchive: (id: string) => void;

  addLoad: (input: NewLoad) => Load;
  updateLoad: (id: string, input: Partial<Load>) => void;
  voidLoad: (id: string) => void;
  archiveLoad: (id: string) => void;
};

const AppDataContext = createContext<AppData | null>(null);

let idCounter = 1000;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [locations] = useState<Location[]>(LOCATIONS);
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [productTypes, setProductTypes] =
    useState<ProductType[]>(PRODUCT_TYPES);
  const [loads, setLoads] = useState<Load[]>(LOADS);
  const [users, setUsers] = useState<SystemUser[]>(SYSTEM_USERS);

  const addUser = useCallback((input: NewUser) => {
    setUsers((prev) => [
      ...prev,
      { ...input, id: nextId("user"), status: "active" },
    ]);
  }, []);

  const [currentLocationId, setCurrentLocationId] = useState<string>(
    LOCATIONS[0].id,
  );
  const [role, setRole] = useState<Role>("admin");

  const addCustomer = useCallback((input: NewCustomer) => {
    setCustomers((prev) => [
      ...prev,
      { ...input, id: nextId("cust"), status: "active" },
    ]);
  }, []);

  const updateCustomer = useCallback((id: string, input: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...input } : c)),
    );
  }, []);

  const toggleCustomerArchive = useCallback((id: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "archived" : "active" }
          : c,
      ),
    );
  }, []);

  const addEmployee = useCallback((input: NewEmployee) => {
    setEmployees((prev) => [
      ...prev,
      { ...input, id: nextId("emp"), status: "active" },
    ]);
  }, []);

  const updateEmployee = useCallback((id: string, input: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...input } : e)),
    );
  }, []);

  const toggleEmployeeArchive = useCallback((id: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: e.status === "active" ? "archived" : "active" }
          : e,
      ),
    );
  }, []);

  const addProductType = useCallback((input: NewProductType) => {
    setProductTypes((prev) => [
      ...prev,
      { ...input, id: nextId("pt"), status: "active" },
    ]);
  }, []);

  const updateProductType = useCallback(
    (id: string, input: Partial<ProductType>) => {
      setProductTypes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...input } : p)),
      );
    },
    [],
  );

  const toggleProductTypeArchive = useCallback((id: string) => {
    setProductTypes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "archived" : "active" }
          : p,
      ),
    );
  }, []);

  const addLoad = useCallback(
    (input: NewLoad) => {
      const nextTicket =
        loads.reduce((max, l) => Math.max(max, l.ticketNumber), 0) + 1;
      const created: Load = {
        ...input,
        id: nextId("load"),
        ticketNumber: nextTicket,
        status: "active",
        billedAmount: 0,
        payoutAmount: 0,
      };
      setLoads((prev) => [...prev, created]);
      return created;
    },
    [loads],
  );

  const updateLoad = useCallback((id: string, input: Partial<Load>) => {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, ...input } : l)));
  }, []);

  const voidLoad = useCallback((id: string) => {
    setLoads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: "void", billedAmount: 0, payoutAmount: 0 }
          : l,
      ),
    );
  }, []);

  const archiveLoad = useCallback((id: string) => {
    setLoads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "archived" } : l)),
    );
  }, []);

  const value = useMemo<AppData>(
    () => ({
      locations,
      customers,
      employees,
      productTypes,
      loads,
      users,
      currentLocationId,
      setCurrentLocationId,
      role,
      setRole,
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
      currentLocationId,
      role,
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
