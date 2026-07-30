import type { Conversation, Evidence, Message } from "@/lib/intelligence";
import {
  MOCK_ASSISTANT_CONTENT,
  MOCK_EVIDENCE,
} from "@/lib/mocks/intelligenceResponse";

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    title: "Payroll increase analysis",
    createdAt: Date.now() - 130_000,
    updatedAt: Date.now() - 120_000,
    preview:
      "Payroll increased this week primarily because more labor hours were recorded...",
  },
  {
    id: "conv-2",
    title: "Active loads overview",
    createdAt: Date.now() - 3_610_000,
    updatedAt: Date.now() - 3_600_000,
    preview: "Showing today's active loads across all locations...",
  },
  {
    id: "conv-3",
    title: "Top revenue customers",
    createdAt: Date.now() - 86_410_000,
    updatedAt: Date.now() - 86_400_000,
    preview: "Westgate Logistics generated the highest revenue this quarter...",
  },
  {
    id: "conv-4",
    title: "Overtime employee report",
    createdAt: Date.now() - 90_010_000,
    updatedAt: Date.now() - 90_000_000,
    preview: "Three employees recorded overtime exceeding 6 hours...",
  },
  {
    id: "conv-5",
    title: "Weekly productivity comparison",
    createdAt: Date.now() - 259_210_000,
    updatedAt: Date.now() - 259_200_000,
    preview: "Comparing productivity metrics with the previous week...",
  },
  {
    id: "conv-6",
    title: "Load status breakdown",
    createdAt: Date.now() - 432_010_000,
    updatedAt: Date.now() - 432_000_000,
    preview: "Breakdown of load statuses across all active shipments...",
  },
  {
    id: "conv-7",
    title: "Employee check-in summary",
    createdAt: Date.now() - 604_810_000,
    updatedAt: Date.now() - 604_800_000,
    preview: "Summary of employee check-ins for the past month...",
  },
];

// Seed transcripts so opening a past conversation from History shows a real
// exchange instead of a dead click. conv-1 reuses the full demo answer (and
// its evidence, below) since that's the one rich response the mock backend
// produces; the rest echo their own preview as a short assistant reply.
export const MOCK_CONVERSATION_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "conv-1-u",
      role: "user",
      content: "Why did payroll increase this week?",
      createdAt: Date.now() - 130_000,
    },
    {
      id: "conv-1-a",
      role: "assistant",
      content: MOCK_ASSISTANT_CONTENT,
      createdAt: Date.now() - 120_000,
    },
  ],
  "conv-2": [
    {
      id: "conv-2-u",
      role: "user",
      content: "Show me today's active loads.",
      createdAt: Date.now() - 3_610_000,
    },
    {
      id: "conv-2-a",
      role: "assistant",
      content:
        "Showing today's active loads across all locations. Twelve loads are currently active — four are awaiting crew assignment and two are nearing completion at Westgate Logistics.",
      createdAt: Date.now() - 3_600_000,
    },
  ],
  "conv-3": [
    {
      id: "conv-3-u",
      role: "user",
      content: "Which customer generated the highest revenue?",
      createdAt: Date.now() - 86_410_000,
    },
    {
      id: "conv-3-a",
      role: "assistant",
      content:
        "Westgate Logistics generated the highest revenue this quarter, driven by a steady volume of completed loads and a higher-than-average billing rate on their product types.",
      createdAt: Date.now() - 86_400_000,
    },
  ],
  "conv-4": [
    {
      id: "conv-4-u",
      role: "user",
      content: "Which employees worked overtime?",
      createdAt: Date.now() - 90_010_000,
    },
    {
      id: "conv-4-a",
      role: "assistant",
      content: `Three employees recorded overtime exceeding 6 hours this period, mostly on longer-than-average unload shifts.

**Overtime summary**

| Employee | Hours | Overtime |
| --- | --- | --- |
| Marcus Rivera | 48.5 | 8.5 |
| Sarah Chen | 46.2 | 6.2 |
| David Okonkwo | 44.0 | 0.0 |

Recommended follow-ups:

1. Review shift assignments for \`LD-2047\` and \`LD-2048\`.
2. Confirm overtime approvals were logged before payroll close.
3. Flag any crew nearing the weekly overtime threshold.

> Overtime concentrated in two locations — Westgate Logistics and Eastport Freight — suggests a staffing gap during peak unload windows rather than a company-wide trend.

- Consider redistributing shifts across the two busiest locations
- Cross-train additional crew for unload coverage
- Re-run this report after next week's schedule changes`,
      createdAt: Date.now() - 90_000_000,
    },
  ],
  "conv-5": [
    {
      id: "conv-5-u",
      role: "user",
      content: "Summarize operational performance for this week.",
      createdAt: Date.now() - 259_210_000,
    },
    {
      id: "conv-5-a",
      role: "assistant",
      content:
        "Comparing productivity metrics with the previous week, cases-per-hour improved by roughly 8%, largely from more consistent crew staffing across shifts.",
      createdAt: Date.now() - 259_200_000,
    },
  ],
  "conv-6": [
    {
      id: "conv-6-u",
      role: "user",
      content: "Give me a load status breakdown.",
      createdAt: Date.now() - 432_010_000,
    },
    {
      id: "conv-6-a",
      role: "assistant",
      content:
        "Breakdown of load statuses across all active shipments: most loads completed on schedule, with a small number voided due to customer cancellation.",
      createdAt: Date.now() - 432_000_000,
    },
  ],
  "conv-7": [
    {
      id: "conv-7-u",
      role: "user",
      content: "Which operations had the longest completion times?",
      createdAt: Date.now() - 604_810_000,
    },
    {
      id: "conv-7-a",
      role: "assistant",
      content:
        "Summary of employee check-ins for the past month: check-in times were consistent across most crews, with only minor delays on Monday morning shifts.",
      createdAt: Date.now() - 604_800_000,
    },
  ],
};

export const MOCK_EVIDENCE_BY_MESSAGE: Record<string, Evidence> = {
  "conv-1-a": MOCK_EVIDENCE,
};
