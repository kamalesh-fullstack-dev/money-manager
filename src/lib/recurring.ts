import { prisma } from "@/lib/prisma";
import { addPeriods, type Period } from "@/lib/date-ranges";

function todayUtcMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Called on every dashboard visit (see src/app/(dashboard)/layout.tsx) to
// materialize any recurring transactions that have come due since the
// user's last visit - catches up on missed periods in a loop rather than
// generating just one, since a user might not open the app for a while.
// There's no cron/background worker in this serverless setup, so
// "catch up on next visit" is the whole scheduling mechanism.
export async function processDueRecurringTransactions(userId: string) {
  const today = todayUtcMidnight();

  const due = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true, nextRunDate: { lte: today } },
  });

  for (const rt of due) {
    let cursor = rt.nextRunDate;
    const period = rt.frequency as Period;

    while (cursor <= today && (!rt.endDate || cursor <= rt.endDate)) {
      const next = addPeriods(period, cursor, 1);
      const pastEnd = rt.endDate ? next > rt.endDate : false;

      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId,
            accountId: rt.accountId,
            categoryId: rt.categoryId,
            type: rt.type,
            amount: rt.amount,
            date: cursor,
            note: rt.note,
          },
        }),
        prisma.recurringTransaction.update({
          where: { id: rt.id },
          data: { nextRunDate: next, isActive: pastEnd ? false : rt.isActive },
        }),
      ]);

      cursor = next;
      if (pastEnd) break;
    }
  }
}
