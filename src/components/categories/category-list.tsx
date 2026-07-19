"use client";

import { deleteCategory } from "@/app/(dashboard)/settings/actions";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { Badge } from "@/components/ui/badge";

export type CategoryRecord = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  isDefault: boolean;
};

function CategoryGroup({ title, categories }: { title: string; categories: CategoryRecord[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex flex-col divide-y rounded-md border">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm">{category.name}</span>
              {category.isDefault && (
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            {!category.isDefault && (
              <DeleteConfirmButton
                description={`Delete "${category.name}"? Transactions using it will keep their amount but lose the category tag.`}
                onDelete={() => deleteCategory(category.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryList({ categories }: { categories: CategoryRecord[] }) {
  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="flex flex-col gap-4">
      <CategoryGroup title="Income categories" categories={income} />
      <CategoryGroup title="Expense categories" categories={expense} />
    </div>
  );
}
