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

// Calendar-aware date stepping, `count` periods forward (negative to step
// back). Unlike getPeriodRange, this does NOT snap to a bucket boundary -
// it preserves the day-of-month/month-of-year of `date`, which is what a
// recurring transaction's due date needs (e.g. "the 15th of every
// month"), clamping to the last valid day when a month is shorter (Jan 31
// + 1 month -> Feb 28/29, not an overflowed "Mar 3").
export function addPeriods(period: Period, date: Date, count: number): Date {
  const d = atUtcMidnight(date);

  if (period === "WEEKLY") {
    d.setUTCDate(d.getUTCDate() + count * 7);
    return d;
  }

  if (period === "YEARLY") {
    const day = d.getUTCDate();
    d.setUTCFullYear(d.getUTCFullYear() + count, d.getUTCMonth(), 1);
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, daysInMonth));
    return d;
  }

  const day = d.getUTCDate();
  d.setUTCFullYear(d.getUTCFullYear(), d.getUTCMonth() + count, 1);
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInMonth));
  return d;
}
