import type { Evidence, IntelligenceResponse } from "@/lib/intelligence";

const RESPONSE_ID = "resp-demo-001";
const CONVERSATION_ID = "conv-demo-001";

export const MOCK_ASSISTANT_CONTENT = `Payroll increased this week primarily because more labor hours were recorded across active loads. The largest contribution came from overtime and longer unload durations at two locations.

The available records indicate that the increase was driven by a combination of additional crew assignments, more completed loads, and employees remaining clocked in longer than the previous period.

Looking at the breakdown, three employees — Marcus Rivera, Sarah Chen, and David Okonkwo — accounted for the majority of the additional hours. Marcus logged 48.5 hours including 8.5 hours of overtime, while Sarah recorded 46.2 hours with 6.2 hours of overtime.

The two most time-intensive loads this week were LD-2047 at Westgate Logistics and LD-2048 at Eastport Freight, which together required more than 10 hours of unloading time. This is roughly 30% higher than the average for the previous four weeks.

Payroll policy and labor SOP documents are available in the evidence panel for reference. A payroll export CSV and a load activity spreadsheet are also attached for deeper analysis.

You may want to review scheduling for next week to see if any adjustments can help distribute hours more evenly across the crew.`;

export const MOCK_EVIDENCE: Evidence = {
  sources: [
    {
      id: "src-payroll",
      type: "payroll",
      label: "Payroll records",
      status: "available",
    },
    {
      id: "src-loads",
      type: "loads",
      label: "Load records",
      status: "available",
    },
    {
      id: "src-time",
      type: "time",
      label: "Employee time entries",
      status: "available",
    },
  ],
  records: [
    {
      id: "rec-payroll-1",
      recordType: "payroll_summary",
      title: "Weekly payroll summary",
      subtitle: "Week 29 · $12,480 total",
    },
    {
      id: "rec-load-1",
      recordType: "load",
      title: "Load #LD-2047 · Completed",
      subtitle: "Westgate Logistics · 4.2 hrs",
    },
    {
      id: "rec-load-2",
      recordType: "load",
      title: "Load #LD-2048 · Completed",
      subtitle: "Eastport Freight · 5.8 hrs",
    },
    {
      id: "rec-time-1",
      recordType: "time_entry",
      title: "Marcus Rivera · 48.5 hrs",
      subtitle: "Including 8.5 hrs overtime",
    },
    {
      id: "rec-time-2",
      recordType: "time_entry",
      title: "Sarah Chen · 46.2 hrs",
      subtitle: "Including 6.2 hrs overtime",
    },
    {
      id: "rec-time-3",
      recordType: "time_entry",
      title: "David Okonkwo · 44.0 hrs",
      subtitle: "No overtime recorded",
    },
  ],
  documents: [
    { id: "doc-1", name: "Payroll Policy 2025.pdf", fileType: "pdf" },
    { id: "doc-2", name: "Warehouse Labor SOP v4.2.pdf", fileType: "pdf" },
  ],
  attachments: [
    { id: "att-1", name: "Weekly Payroll Export.csv", fileType: "csv" },
    { id: "att-2", name: "Load Activity Report.xlsx", fileType: "xlsx" },
  ],
};

export const MOCK_RESPONSE: IntelligenceResponse = {
  id: RESPONSE_ID,
  conversationId: CONVERSATION_ID,
  status: "complete",
  createdAt: Date.now(),
  message: {
    id: "msg-assistant-001",
    role: "assistant",
    content: MOCK_ASSISTANT_CONTENT,
    createdAt: Date.now(),
  },
  evidence: MOCK_EVIDENCE,
  metadata: {
    requestId: "req-demo-001",
    responseTimeMs: 1420,
    generatedAt: Date.now(),
    demo: true,
  },
};
