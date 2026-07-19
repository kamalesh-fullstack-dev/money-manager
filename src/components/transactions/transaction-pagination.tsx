"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TransactionPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending || page <= 1}
        onClick={() => goToPage(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        Page {page} of {totalPages}
        {pending && <Loader2 className="size-3.5 animate-spin" />}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending || page >= totalPages}
        onClick={() => goToPage(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
