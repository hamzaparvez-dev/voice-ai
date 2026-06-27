import { BRAND } from "@/constants/branding";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  inverse = false,
  mark = false,
}: {
  className?: string;
  inverse?: boolean;
  mark?: boolean;
}) {
  if (mark) {
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground select-none",
          className,
        )}
        aria-label={BRAND.name}
      >
        GS
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-block select-none font-semibold tracking-tight",
        inverse ? "text-zinc-50" : "text-foreground",
        className,
      )}
      aria-label={BRAND.name}
    >
      {BRAND.name}
    </span>
  );
}
