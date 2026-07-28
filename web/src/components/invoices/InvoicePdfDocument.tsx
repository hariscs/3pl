"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Invoice } from "@/lib/invoices";
import { COMPANY_INFO } from "@/lib/invoices";

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.5,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  headerLeft: {},
  headerRight: {
    width: 160,
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 3,
  },
  companyDetail: { fontSize: 9, color: "#475569", lineHeight: 1.5 },

  invoiceTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f172a",
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    marginTop: 8,
    marginBottom: 12,
  },
  statusPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-end",
  },
  statusText: { fontSize: 9, fontWeight: 600, color: "#475569" },

  // Two-column section
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 24 },
  col: { flex: 1 },

  // Section headings
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  billToName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 3,
  },
  billToDetail: { fontSize: 10, color: "#475569", lineHeight: 1.4 },

  // Info grid
  infoGrid: { gap: 7 },
  infoRow: { flexDirection: "row" },
  infoLabel: { width: "40%", fontSize: 9, color: "#475569" },
  infoValue: { width: "60%", fontSize: 10, color: "#0f172a" },
  infoMono: { fontSize: 10, fontFamily: "Courier", color: "#0f172a" },

  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
  },
  tableHeaderCell: {
    padding: "8 8",
    fontSize: 8,
    fontWeight: 700,
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "solid",
  },
  tableCell: { padding: "8 8", fontSize: 9 },
  tableCellMono: { padding: "8 8", fontSize: 9, fontFamily: "Courier" },
  tableCellRight: { padding: "8 8", fontSize: 9, textAlign: "right" },
  tableCellRightMoney: {
    padding: "8 8",
    fontSize: 9,
    textAlign: "right",
    fontWeight: 700,
  },

  // Column widths
  colLoad: { width: "9%" },
  colCompleted: { width: "11%" },
  colLocation: { width: "12%" },
  colProductType: { width: "12%" },
  colContainer: { width: "9%" },
  colCases: { width: "7%", textAlign: "right" },
  colDescription: { width: "25%" },
  colAmount: { width: "10%", textAlign: "right" },

  // Totals
  totalsContainer: {
    alignSelf: "flex-end",
    width: "35%",
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
  },
  totalsRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalsLabel: { fontSize: 10, color: "#475569" },
  totalsValue: { fontSize: 10, fontFamily: "Courier", color: "#0f172a" },
  totalsLabelBold: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  totalsValueBold: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "Courier",
    color: "#0f172a",
  },

  // Notes
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 14,
    marginBottom: 16,
  },
  notesText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#64748b" },
});

// ── Helpers ─────────────────────────────────────────────────────

function dateFmt(iso?: string | null): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  const m = d.toLocaleDateString("en-US", { month: "short" });
  return `${m} ${d.getDate()}, ${d.getFullYear()}`;
}

function billingPeriodFmt(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}\u2013${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${sMonth} ${s.getDate()} \u2013 ${eMonth} ${e.getDate()}, ${e.getFullYear()}`;
}

function money(v: number): string {
  return `$${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
}

// ── Component ───────────────────────────────────────────────────

type Props = {
  invoice: Invoice;
};

export function InvoicePdfDocument({ invoice }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* ── HEADER ──────────────────────────────────── */}
        <View style={styles.header}>
          {/* Left: Company info */}
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyDetail}>{COMPANY_INFO.byline}</Text>
            {COMPANY_INFO.address.map((line) => (
              <Text key={line} style={styles.companyDetail}>
                {line}
              </Text>
            ))}
            <Text style={styles.companyDetail}>{COMPANY_INFO.phone}</Text>
            <Text style={styles.companyDetail}>{COMPANY_INFO.email}</Text>
          </View>

          {/* Right: Title → Number → Badge */}
          <View style={styles.headerRight}>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.invoiceTitle}>Invoice</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Draft Invoice</Text>
            </View>
          </View>
        </View>

        {/* ── BILL TO + INVOICE INFO ──────────────────── */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.billToName}>{invoice.customerName}</Text>
            <Text style={styles.billToDetail}>Address not available.</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Invoice Information</Text>
            <View style={styles.infoGrid}>
              <InfoPair
                label="Invoice Number"
                value={invoice.invoiceNumber}
                mono
              />
              <InfoPair
                label="Invoice Date"
                value={dateFmt(invoice.invoiceDate)}
              />
              <InfoPair label="Due Date" value={dateFmt(invoice.dueDate)} />
              <InfoPair
                label="Billing Period"
                value={billingPeriodFmt(
                  invoice.billingPeriodStart,
                  invoice.billingPeriodEnd,
                )}
              />
              <InfoPair label="Created By" value={invoice.createdByName} />
              <InfoPair label="Created At" value={dateFmt(invoice.createdAt)} />
            </View>
          </View>
        </View>

        {/* ── LINE ITEMS TABLE ───────────────────────── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colLoad]}>Load</Text>
            <Text style={[styles.tableHeaderCell, styles.colCompleted]}>
              Completed
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colLocation]}>
              Location
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colProductType]}>
              Product Type
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colContainer]}>
              Container
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colCases]}>Cases</Text>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>
              Amount
            </Text>
          </View>
          {invoice.lineItems.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.tableCellMono, styles.colLoad]}>
                #{item.ticketNumber}
              </Text>
              <Text style={[styles.tableCell, styles.colCompleted]}>
                {item.completedAt}
              </Text>
              <Text style={[styles.tableCell, styles.colLocation]}>
                {item.locationName}
              </Text>
              <Text style={[styles.tableCell, styles.colProductType]}>
                {item.productTypeName}
              </Text>
              <Text style={[styles.tableCellMono, styles.colContainer]}>
                {item.containerNumber ?? "\u2014"}
              </Text>
              <Text style={[styles.tableCellRight, styles.colCases]}>
                {item.caseCount ?? "\u2014"}
              </Text>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCellRightMoney, styles.colAmount]}>
                {money(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ──────────────────────────────────── */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{money(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalsRowBold}>
            <Text style={styles.totalsLabelBold}>Total</Text>
            <Text style={styles.totalsValueBold}>{money(invoice.total)}</Text>
          </View>
        </View>

        {/* ── NOTES ───────────────────────────────────── */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>
            {invoice.notes?.trim() || "No invoice notes."}
          </Text>
        </View>

        {/* ── FOOTER ──────────────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{invoice.invoiceNumber}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber }) => `Page ${pageNumber}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// ── Info pair helper ─────────────────────────────────────────────

function InfoPair({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={mono ? styles.infoMono : styles.infoValue}>{value}</Text>
    </View>
  );
}
