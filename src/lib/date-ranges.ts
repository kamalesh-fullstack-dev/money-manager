export type Period = "WEEKLY" | "MONTHLY" | "YEARLY";

function atUtcMidnight(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfWeek(date: Date) {
  const d = atUtcMidnight(date);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

// Transactions are stored as @db.Date (no time component), so ranges are
// computed in UTC to match how Prisma/Postgres compare them.
export function getPeriodRange(period: Period, referenceDate: Date = new Date()) {
  const ref = atUtcMidnight(referenceDate);

  if (period === "WEEKLY") {
    const start = startOfWeek(ref);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }

  if (period === "YEARLY") {
    const start = new Date(Date.UTC(ref.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(ref.getUTCFullYear() + 1, 0, 1));
    return { start, end };
  }

  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
  return { start, end };
}

// One period back from `referenceDate` - used for rollover calculations.
// Only ever steps back a single period (see plan: rollover is a one-period
// carryover, not a compounding chain).
export function getPreviousPeriodRange(period: Period, referenceDate: Date = new Date()) {
  const { start } = getPeriodRange(period, referenceDate);
  const dayBeforeStart = new Date(start);
  dayBeforeStart.setUTCDate(dayBeforeStart.getUTCDate() - 1);
  return getPeriodRange(period, dayBeforeStart);
}
