// Invoice types and in-memory mock store.

export type InvoiceStatus = "draft";

// ── Company info (placeholder — will become company settings) ────

export const COMPANY_INFO = {
  name: "Dockmaster",
  byline: "3PL Work",
  address: ["123 Warehouse Drive", "Charlotte, NC"],
  phone: "(704) 555-0100",
  email: "billing@dockmaster.app",
} as const;

export type InvoiceLineItem = {
  id: string;
  loadId: string;
  ticketNumber: number;
  completedAt: string;
  locationName: string;
  productTypeName: string;
  containerNumber: string | null;
  caseCount: number | null;
  description: string;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  createdByName: string;
};

// ── In-memory store ───────────────────────────────────────────────

const invoices: Invoice[] = [];
let invoiceSeq = 1;

export function getNextInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const num = String(invoiceSeq).padStart(4, "0");
  invoiceSeq++;
  return `INV-${year}-${num}`;
}

export function addInvoice(invoice: Invoice): void {
  invoices.push(invoice);
}

export function getInvoices(): Invoice[] {
  return invoices;
}

export function getInvoice(id: string): Invoice | undefined {
  return invoices.find((inv) => inv.id === id);
}
