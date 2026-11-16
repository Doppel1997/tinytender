import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCircle2,
  PackageMinus,
  PackageX,
  TriangleAlert,
} from "lucide-react";
import type { Product } from "../types";
import {
  getProductState,
  STATUS_META,
  type ProductStatus,
} from "../lib/inventory";
import { cn } from "../lib/utils";
import { useStore } from "../context/StoreContext";

interface StatusBadgeProps {
  product: Product;
  className?: string;
}

const STATUS_ICON: Record<ProductStatus, LucideIcon> = {
  disponible: CheckCircle2,
  "stock-bajo": PackageMinus,
  agotado: PackageX,
  "por-vencer": CalendarClock,
  vencido: TriangleAlert,
};

export function StatusBadge({ product, className }: StatusBadgeProps) {
  const { settings } = useStore();
  const state = getProductState(product, settings.expiryWarningDays);
  const meta = STATUS_META[state.status];
  const Icon = STATUS_ICON[state.status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[13px] font-semibold ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}
