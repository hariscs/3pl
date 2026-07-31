"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api/client";
import type { EmployeePayrollStatus, PayrollPayment } from "./payroll";

export type PayrollRecord = {
  status: EmployeePayrollStatus;
  approvedAt: string | null;
  approvedByName: string | null;
  paidAt: string | null;
  paidByName: string | null;
  payment?: PayrollPayment | null;
};

// There is no bulk "list all payroll statuses" endpoint — only
// GET /payroll/records/:employeeId — so the Dashboard fetches every
// in-scope employee's record in parallel and keys the result by employee id.
export function usePayrollRecords(employeeIds: string[]) {
  const key = [...employeeIds].sort().join(",");
  const query = useQuery({
    queryKey: ["payrollRecords", key],
    queryFn: async () => {
      const entries = await Promise.all(
        employeeIds.map(
          async (id) => [id, await api.get<PayrollRecord>(`/payroll/records/${id}`)] as const,
        ),
      );
      return Object.fromEntries(entries) as Record<string, PayrollRecord>;
    },
    enabled: employeeIds.length > 0,
  });
  return { records: query.data ?? {}, isLoading: query.isLoading };
}
