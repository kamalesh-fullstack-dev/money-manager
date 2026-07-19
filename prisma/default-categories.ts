export const DEFAULT_CATEGORIES: {
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}[] = [
  { name: "Salary", type: "INCOME", color: "#22c55e", icon: "banknote" },
  { name: "Other Income", type: "INCOME", color: "#84cc16", icon: "plus-circle" },
  { name: "Food & Dining", type: "EXPENSE", color: "#f97316", icon: "utensils" },
  { name: "Groceries", type: "EXPENSE", color: "#f59e0b", icon: "shopping-cart" },
  { name: "Transport", type: "EXPENSE", color: "#3b82f6", icon: "car" },
  { name: "Rent", type: "EXPENSE", color: "#ef4444", icon: "home" },
  { name: "Utilities", type: "EXPENSE", color: "#06b6d4", icon: "zap" },
  { name: "Shopping", type: "EXPENSE", color: "#ec4899", icon: "shopping-bag" },
  { name: "Entertainment", type: "EXPENSE", color: "#a855f7", icon: "film" },
  { name: "Health", type: "EXPENSE", color: "#14b8a6", icon: "heart-pulse" },
  { name: "Other", type: "EXPENSE", color: "#6b7280", icon: "more-horizontal" },
];
