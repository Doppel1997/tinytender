import type { LucideIcon } from "lucide-react";
import {
  Beer,
  CupSoda,
  Droplets,
  Milk,
  Package,
  Popcorn,
  SprayCan,
  Wheat,
  Wine,
} from "lucide-react";
import type { Category, Product } from "../types";
import { cn } from "../lib/utils";

interface ProductIconProps {
  product: Pick<Product, "category">;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

/** Iconografía única por categoría: sin emojis ni imágenes externas. */
export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Bebidas: Droplets,
  Cervezas: Beer,
  Licores: Wine,
  Gaseosas: CupSoda,
  Snacks: Popcorn,
  Abarrotes: Wheat,
  Lácteos: Milk,
  Aseo: SprayCan,
};

const BOX: Record<NonNullable<ProductIconProps["size"]>, string> = {
  xs: "h-8 w-8 rounded-lg",
  sm: "h-10 w-10 rounded-lg",
  md: "h-12 w-12 rounded-xl",
  lg: "h-16 w-16 rounded-xl",
};

const ICON: Record<NonNullable<ProductIconProps["size"]>, string> = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const TILE: Record<Category, string> = {
  Bebidas: "bg-sky-50 text-sky-700 ring-sky-200",
  Cervezas: "bg-amber-50 text-amber-800 ring-amber-200",
  Licores: "bg-violet-50 text-violet-700 ring-violet-200",
  Gaseosas: "bg-rose-50 text-rose-700 ring-rose-200",
  Snacks: "bg-orange-50 text-orange-700 ring-orange-200",
  Abarrotes: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  Lácteos: "bg-blue-50 text-blue-700 ring-blue-200",
  Aseo: "bg-teal-50 text-teal-700 ring-teal-200",
};

export function ProductIcon({
  product,
  size = "md",
  className,
}: ProductIconProps) {
  const Icon: LucideIcon = CATEGORY_ICON[product.category] ?? Package;
  return (
    <span
      className={cn(
        "grid shrink-0 select-none place-items-center ring-1 ring-inset",
        BOX[size],
        TILE[product.category] ?? "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={ICON[size]} strokeWidth={1.9} />
    </span>
  );
}
