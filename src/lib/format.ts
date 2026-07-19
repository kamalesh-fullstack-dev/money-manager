const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  AUD: "en-AU",
  CAD: "en-CA",
  SGD: "en-SG",
  AED: "ar-AE",
};

export function formatCurrency(amount: number | string, currency = "USD") {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

export function getCurrencySymbol(currency = "USD") {
  const parts = new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "en-US", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

export function formatMonthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// `start`/`end` are the [start, end) range from getPeriodRange - `end` is
// exclusive (the first day of the *next* period), so the displayed range
// for weekly uses end minus one day as the inclusive last day.
export function formatPeriodLabel(
  period: "WEEKLY" | "MONTHLY" | "YEARLY",
  start: Date,
  end: Date,
) {
  if (period === "YEARLY") {
    return String(start.getUTCFullYear());
  }

  if (period === "WEEKLY") {
    const lastDay = new Date(end);
    lastDay.setUTCDate(lastDay.getUTCDate() - 1);
    const dateOpts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    };
    const startLabel = start.toLocaleDateString("en-US", dateOpts);
    const endLabel = lastDay.toLocaleDateString("en-US", dateOpts);
    return `${startLabel} – ${endLabel}`;
  }

  return start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
