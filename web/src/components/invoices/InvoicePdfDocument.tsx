"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Invoice } from "@/lib/invoices";
import { COMPANY_INFO } from "@/lib/invoices";

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  companyName: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  companyDetail: { fontSize: 8, color: "#64748b" },
  invoiceTitle: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  invoiceNumber: { fontSize: 11, fontWeight: 600, color: "#475569" },
  statusRow: { flexDirection: "row", marginTop: 8 },
  statusPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 8, fontWeight: 600, color: "#64748b" },

  // Two-column section
  twoCol: { flexDirection: "row", gap: 24, marginBottom: 24 },
  col: { flex: 1 },

  // Section cards
  sectionTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  billToName: { fontSize: 11, fontWeight: 600, marginBottom: 2 },
  billToDetail: { fontSize: 9, color: "#64748b" },

  // Info grid
  infoGrid: { gap: 6 },
  infoRow: { flexDirection: "row" },
  infoLabel: { width: "40%", fontSize: 8, color: "#94a3b8" },
  infoValue: { width: "60%", fontSize: 9 },
  infoMono: { fontSize: 9, fontFamily: "Courier" },

  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  tableHeaderCell: {
    padding: "6 6",
    fontSize: 7,
    fontWeight: 700,
    color: "#94a3b8",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "solid",
  },
  tableCell: { padding: "5 6", fontSize: 8 },
  tableCellMono: { padding: "5 6", fontSize: 8, fontFamily: "Courier" },
  tableCellRight: { padding: "5 6", fontSize: 8, textAlign: "right" },
  tableCellRightMoney: {
    padding: "5 6",
    fontSize: 8,
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
    marginBottom: 20,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  totalsRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  totalsLabel: { fontSize: 9, color: "#64748b" },
  totalsValue: { fontSize: 9, fontFamily: "Courier" },
  totalsLabelBold: { fontSize: 10, fontWeight: 700 },
  totalsValueBold: { fontSize: 10, fontWeight: 700, fontFamily: "Courier" },

  // Notes
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 12,
    marginBottom: 16,
  },
  notesText: { fontSize: 8, color: "#64748b" },

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
  footerText: { fontSize: 7, color: "#94a3b8" },
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
        {/* Header */}
        <View style={styles.header}>
          <View>
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
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>Draft Invoice</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bill To + Invoice Info */}
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

        {/* Line Items */}
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

        {/* Totals */}
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

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>
            {invoice.notes?.trim() || "No invoice notes."}
          </Text>
        </View>

        {/* Footer */}
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
