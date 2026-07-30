"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { COMPANY_INFO } from "@/lib/invoices";
import type { EmployeePayroll } from "@/lib/payroll";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
    paddingBottom: 16,
  },
  company: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 8, fontWeight: 500, color: "#94a3b8" },
  title: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  period: { fontSize: 10, color: "#64748b", marginBottom: 20 },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
  },
  tableHeaderCell: {
    padding: "6 8",
    fontSize: 7,
    fontWeight: 600,
    color: "#64748b",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "solid",
  },
  tableCell: { padding: "5 8", fontSize: 9 },
  tableCellRight: { padding: "5 8", fontSize: 9, textAlign: "right" },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 9, color: "#64748b" },
  footerBold: { fontSize: 9, fontWeight: 700, color: "#0f172a" },
  genDate: { textAlign: "right", fontSize: 7, color: "#94a3b8", marginTop: 24 },
  money: { fontWeight: 700 },
  colEmployee: { width: "21%" },
  colCategory: { width: "12%" },
  colLocation: { width: "14%" },
  colLoads: { width: "8%", textAlign: "right" },
  colHours: { width: "9%", textAlign: "right" },
  colBase: { width: "9%", textAlign: "right" },
  colOvertime: { width: "9%", textAlign: "right" },
  colProduction: { width: "9%", textAlign: "right" },
  colTotal: { width: "9%", textAlign: "right" },
});

function safeNum(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

function fmtMoney(v: number) {
  return `$${safeNum(v).toFixed(2)}`;
}

function fmtHours(v: number) {
  return `${safeNum(v).toFixed(1)}h`;
}

type Props = {
  title: string;
  subtitle?: string;
  rows: EmployeePayroll[];
  locationName: (id: string) => string;
};

export function PayrollPdfDocument({
  title,
  subtitle,
  rows,
  locationName,
}: Props) {
  const totalPay = rows.reduce((s, r) => s + safeNum(r.totalPay), 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.header}>
          <Text style={styles.company}>{COMPANY_INFO.name}</Text>
          <Text style={styles.subtitle}>{COMPANY_INFO.byline}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.period}>{subtitle}</Text> : null}

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colEmployee]}>
              Employee
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colCategory]}>
              Category
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colLocation]}>
              Location
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colLoads]}>Loads</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Hours</Text>
            <Text style={[styles.tableHeaderCell, styles.colBase]}>Base</Text>
            <Text style={[styles.tableHeaderCell, styles.colOvertime]}>OT</Text>
            <Text style={[styles.tableHeaderCell, styles.colProduction]}>
              Prod
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Rows */}
          {rows.map((r) => (
            <View style={styles.tableRow} key={r.employee.id}>
              <Text style={[styles.tableCell, styles.colEmployee]}>
                {r.employee.name}
              </Text>
              <Text style={[styles.tableCell, styles.colCategory]}>
                {r.employee.category ?? "\u2014"}
              </Text>
              <Text style={[styles.tableCell, styles.colLocation]}>
                {locationName(r.employee.locationId)}
              </Text>
              <Text style={[styles.tableCellRight, styles.colLoads]}>
                {String(r.entries.length)}
              </Text>
              <Text style={[styles.tableCellRight, styles.colHours]}>
                {fmtHours(r.totalHours)}
              </Text>
              <Text style={[styles.tableCellRight, styles.colBase]}>
                {fmtMoney(r.regularPay)}
              </Text>
              <Text style={[styles.tableCellRight, styles.colOvertime]}>
                {fmtMoney(r.overtimePay)}
              </Text>
              <Text style={[styles.tableCellRight, styles.colProduction]}>
                {fmtMoney(r.productionPay)}
              </Text>
              <Text
                style={[styles.tableCellRight, styles.colTotal, styles.money]}
              >
                {fmtMoney(r.totalPay)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Total employees: {rows.length}</Text>
          <Text style={styles.footerBold}>Total pay: {fmtMoney(totalPay)}</Text>
        </View>

        {/* Generation date */}
        <Text style={styles.genDate}>
          Generated on{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </Page>
    </Document>
  );
}
