import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <span className="font-display text-3xl font-extrabold tracking-wide text-primary uppercase">
        Money Manager
      </span>
      <div className="w-full max-w-sm">
        <div className="hazard-stripe mb-4 h-2 w-full" />
        {children}
      </div>
    </div>
  );
}
