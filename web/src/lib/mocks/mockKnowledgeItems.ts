export type KnowledgeItem = {
    id: string;
    title: string;
    type: string;
    category: string;
    status: "Published" | "Draft" | "Needs Review";
    owner: string;
    effectiveDate: string;
    lastReviewedAt: string;
    description: string;
};

export const MOCK_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
    // ── Company ──────────────────────────────────────────
    {
        id: "ki-co-1",
        title: "Company Overview & Org Structure",
        type: "Document",
        category: "Company",
        status: "Published",
        owner: "Administration",
        effectiveDate: "2025-01-01",
        lastReviewedAt: "2025-06-01",
        description: "Summary of company history, mission, values, and current organizational chart with reporting lines.",
    },
    {
        id: "ki-co-2",
        title: "Code of Conduct",
        type: "Policy",
        category: "Company",
        status: "Published",
        owner: "HR Department",
        effectiveDate: "2025-02-01",
        lastReviewedAt: "2025-05-10",
        description: "Expected workplace behavior, anti-harassment policy, and disciplinary procedures.",
    },

    // ── Employees ────────────────────────────────────────
    {
        id: "ki-emp-1",
        title: "Employee Handbook",
        type: "Policy",
        category: "Employees",
        status: "Published",
        owner: "HR Department",
        effectiveDate: "2025-01-15",
        lastReviewedAt: "2025-06-01",
        description: "Comprehensive employee guidelines covering conduct, benefits, and workplace policies.",
    },
    {
        id: "ki-emp-2",
        title: "Onboarding Checklist",
        type: "Procedure",
        category: "Employees",
        status: "Published",
        owner: "HR Department",
        effectiveDate: "2025-01-15",
        lastReviewedAt: "2025-04-20",
        description: "Step-by-step onboarding workflow for new warehouse and office staff including equipment, training, and paperwork.",
    },

    // ── Operations ───────────────────────────────────────
    {
        id: "ki-op-1",
        title: "Load Management Workflow",
        type: "Procedure",
        category: "Operations",
        status: "Published",
        owner: "Operations",
        effectiveDate: "2025-02-10",
        lastReviewedAt: "2025-05-22",
        description: "End-to-end process for receiving, staging, loading, and dispatching freight across warehouse zones.",
    },
    {
        id: "ki-op-2",
        title: "Shift Scheduling Guidelines",
        type: "Policy",
        category: "Operations",
        status: "Draft",
        owner: "Operations",
        effectiveDate: "2025-06-01",
        lastReviewedAt: "2025-05-30",
        description: "Rules for crew shift assignments, break rotations, overtime eligibility, and shift-swap procedures.",
    },

    // ── Locations ────────────────────────────────────────
    {
        id: "ki-loc-1",
        title: "Main Warehouse Location Guide",
        type: "Procedure",
        category: "Locations",
        status: "Draft",
        owner: "Operations",
        effectiveDate: "2025-04-10",
        lastReviewedAt: "2025-05-20",
        description: "Layout, zones, and operational procedures for the primary warehouse facility.",
    },
    {
        id: "ki-loc-2",
        title: "Satellite Yard Operating Notes",
        type: "Plain Text",
        category: "Locations",
        status: "Published",
        owner: "Operations",
        effectiveDate: "2025-03-05",
        lastReviewedAt: "2025-06-02",
        description: "Operational notes and access instructions for the satellite storage yard and overflow parking area.",
    },

    // ── Payroll & Billing ────────────────────────────────
    {
        id: "ki-pb-1",
        title: "Overtime Policy",
        type: "Policy",
        category: "Payroll & Billing",
        status: "Published",
        owner: "Finance",
        effectiveDate: "2025-03-01",
        lastReviewedAt: "2025-05-15",
        description: "Rules and rates governing overtime pay, eligibility, and approval workflows.",
    },
    {
        id: "ki-pb-2",
        title: "Invoice Generation Standards",
        type: "Document",
        category: "Payroll & Billing",
        status: "Needs Review",
        owner: "Finance",
        effectiveDate: "2025-04-01",
        lastReviewedAt: "2025-06-05",
        description: "Standard invoice templates, line-item descriptions, and billing codes for customer accounts.",
    },

    // ── Customer SOPs ────────────────────────────────────
    {
        id: "ki-sop-1",
        title: "Westgate Logistics Handling SOP",
        type: "PDF",
        category: "Customer SOPs",
        status: "Published",
        owner: "Account Management",
        effectiveDate: "2025-01-20",
        lastReviewedAt: "2025-05-01",
        description: "Special handling instructions, packaging requirements, and delivery windows for Westgate Logistics shipments.",
    },
    {
        id: "ki-sop-2",
        title: "Eastport Freight Compliance Requirements",
        type: "Plain Text",
        category: "Customer SOPs",
        status: "Draft",
        owner: "Account Management",
        effectiveDate: "2025-05-15",
        lastReviewedAt: "2025-06-01",
        description: "Regulatory compliance notes, customs documentation requirements, and hazardous material handling for Eastport Freight.",
    },
];