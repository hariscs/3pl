import type { LoadCrewAssignment } from "@/lib/types";

/** The browser's current local time as "HH:MM" — the same convention as
 * clockIn/clockOut/breakStart/breakEnd. Callers send this explicitly rather
 * than letting the mock handler compute its own, so a clock event reflects
 * the acting user's wall clock, not a simulated server clock. */
export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesBetween(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

/** Worked minutes for an assignment that has clocked out: clock-out minus
 * clock-in minus every completed break. An open break, or clockOut at or
 * before clockIn, safely contributes nothing rather than going negative. */
export function getAssignmentWorkedMinutes(
  assignment: LoadCrewAssignment,
): number {
  if (!assignment.clockIn || !assignment.clockOut) return 0;
  const total = minutesBetween(assignment.clockIn, assignment.clockOut);
  if (total <= 0) return 0;
  const breakMinutes = assignment.breaks.reduce((sum, b) => {
    if (!b.breakEnd) return sum;
    return sum + Math.max(0, minutesBetween(b.breakStart, b.breakEnd));
  }, 0);
  return Math.max(0, total - breakMinutes);
}

/** Live worked minutes for the "Working for Xh Ym" display — handles an
 * assignment that's still clocked in or currently on break. */
export function getAssignmentLiveElapsedMinutes(
  assignment: LoadCrewAssignment,
  nowHHMM: string,
): number {
  if (!assignment.clockIn) return 0;
  if (assignment.status === "clocked_out" || assignment.status === "removed") {
    return getAssignmentWorkedMinutes(assignment);
  }
  const total = Math.max(0, minutesBetween(assignment.clockIn, nowHHMM));
  let breakMinutes = 0;
  for (const b of assignment.breaks) {
    breakMinutes += Math.max(
      0,
      minutesBetween(b.breakStart, b.breakEnd ?? nowHHMM),
    );
  }
  return Math.max(0, total - breakMinutes);
}

/** Elapsed minutes of an assignment's currently-open break, or null if none
 * is open — used for "extended break" exception detection on the Dashboard. */
export function getOpenBreakMinutes(
  assignment: LoadCrewAssignment,
  nowHHMM: string,
): number | null {
  const openBreak = assignment.breaks.find((b) => !b.breakEnd);
  if (!openBreak) return null;
  return Math.max(0, minutesBetween(openBreak.breakStart, nowHHMM));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

// --- Sequence guards, enforced identically client-side and in the mock
// handler before committing a mutation ---

export function clockOutBlockedReason(
  assignment: LoadCrewAssignment,
): string | null {
  if (assignment.status === "on_break") {
    return "Resolve the active break before clocking out.";
  }
  if (assignment.status !== "clocked_in") {
    return "This crew member is not clocked in.";
  }
  return null;
}

export function startBreakBlockedReason(
  assignment: LoadCrewAssignment,
): string | null {
  if (assignment.status !== "clocked_in") {
    return "Clock in before starting a break.";
  }
  if (assignment.breaks.some((b) => !b.breakEnd)) {
    return "A break is already in progress.";
  }
  return null;
}

export function endBreakBlockedReason(
  assignment: LoadCrewAssignment,
): string | null {
  if (assignment.status !== "on_break") {
    return "No break is currently in progress.";
  }
  return null;
}
