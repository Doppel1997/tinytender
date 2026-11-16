import type { Category, Movement, Product, StockBatch } from "../types";
import { CATEGORY_META, UNIT_LABEL, UNIT_PLURAL } from "../types";
import {
  addDays,
  daysUntil,
  expiryLabel,
  formatDate,
  formatShortDate,
  parseDate,
  startOfDay,
  todayISO,
} from "./date";

export type ProductStatus =
  | "disponible"
  | "stock-bajo"
  | "agotado"
  | "por-vencer"
  | "vencido";

export interface ProductState {
  status: ProductStatus;
  daysToExpiry: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export const STATUS_META: Record<
  ProductStatus,
  { label: string; badge: string; dot: string; soft: string }
> = {
  disponible: {
    label: "Disponible",
    badge: "bg-brand-50 text-brand-800 ring-brand-200",
    dot: "bg-brand-600",
    soft: "bg-brand-50 text-brand-800",
  },
  "stock-bajo": {
    label: "Pocas unidades",
    badge: "bg-amber-50 text-amber-800 ring-amber-300",
    dot: "bg-amber-600",
    soft: "bg-amber-50 text-amber-900",
  },
  agotado: {
    label: "Agotado",
    badge: "bg-red-50 text-red-800 ring-red-300",
    dot: "bg-red-600",
    soft: "bg-red-50 text-red-800",
  },
  "por-vencer": {
    label: "Vence pronto",
    badge: "bg-orange-50 text-orange-800 ring-orange-300",
    dot: "bg-orange-600",
    soft: "bg-orange-50 text-orange-900",
  },
  vencido: {
    label: "Vencido",
    badge: "bg-red-100 text-red-900 ring-red-300",
    dot: "bg-red-700",
    soft: "bg-red-100 text-red-900",
  },
};

/**
 * Los lotes son la fuente de verdad de los vencimientos. `expiresAt` del
 * producto se mantiene sincronizado con el lote más próximo.
 */
export function getNearestExpiry(product: Product): string | null {
  const dates = product.batches
    .filter((batch) => batch.quantity > 0 && batch.expiresAt)
    .map((batch) => batch.expiresAt as string)
    .sort();
  if (dates.length > 0) return dates[0];
  return product.batches.length === 0 ? product.expiresAt : null;
}

export function getSortedBatches(product: Product): StockBatch[] {
  return [...product.batches]
    .filter((batch) => batch.quantity > 0)
    .sort((a, b) => {
      if (a.expiresAt && b.expiresAt) return a.expiresAt.localeCompare(b.expiresAt);
      if (a.expiresAt) return -1;
      if (b.expiresAt) return 1;
      return a.receivedAt.localeCompare(b.receivedAt);
    });
}

export function getExpiredUnits(product: Product): number {
  const today = todayISO();
  if (product.batches.length === 0) {
    return product.expiresAt && product.expiresAt < today ? product.quantity : 0;
  }
  return product.batches.reduce((total, batch) => {
    if (batch.expiresAt && batch.expiresAt < today) return total + batch.quantity;
    return total;
  }, 0);
}

export function getProductState(product: Product, warningDays: number): ProductState {
  const expiresAt = getNearestExpiry(product);
  const days = expiresAt ? daysUntil(expiresAt) : null;
  const isOutOfStock = product.quantity <= 0;
  const isExpired = days !== null && days < 0 && !isOutOfStock;
  const isExpiringSoon =
    days !== null && days >= 0 && days <= warningDays && !isOutOfStock;
  const isLowStock = !isOutOfStock && product.quantity <= product.minStock;

  let status: ProductStatus = "disponible";
  if (isOutOfStock) status = "agotado";
  else if (isExpired) status = "vencido";
  else if (isExpiringSoon) status = "por-vencer";
  else if (isLowStock) status = "stock-bajo";

  return {
    status,
    daysToExpiry: days,
    isLowStock,
    isOutOfStock,
    isExpiringSoon,
    isExpired,
  };
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
  attentionCount: number;
  inventoryValue: number;
  retailValue: number;
}

export function getInventorySummary(
  products: Product[],
  warningDays: number,
): InventorySummary {
  const summary: InventorySummary = {
    totalProducts: products.length,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringCount: 0,
    expiredCount: 0,
    attentionCount: 0,
    inventoryValue: 0,
    retailValue: 0,
  };

  let attention = 0;
  for (const product of products) {
    const state = getProductState(product, warningDays);
    summary.totalUnits += product.quantity;
    summary.inventoryValue += product.quantity * product.purchasePrice;
    summary.retailValue += product.quantity * product.salePrice;
    if (state.isLowStock) summary.lowStockCount += 1;
    if (state.isOutOfStock) summary.outOfStockCount += 1;
    if (state.isExpiringSoon) summary.expiringCount += 1;
    if (state.isExpired) summary.expiredCount += 1;
    if (
      state.isLowStock ||
      state.isOutOfStock ||
      state.isExpiringSoon ||
      state.isExpired
    ) {
      attention += 1;
    }
  }
  summary.attentionCount = attention;
  return summary;
}

export type AlertKind = "stock-bajo" | "agotado" | "por-vencer" | "vencido";

export interface AlertItem {
  product: Product;
  kind: AlertKind;
  daysToExpiry: number | null;
  reason: string;
}

export interface AlertGroups {
  lowStock: AlertItem[];
  outOfStock: AlertItem[];
  expiring: AlertItem[];
  expired: AlertItem[];
}

function lowStockAlert(product: Product): AlertItem {
  const unit = UNIT_LABEL[product.unit];
  const plural = UNIT_PLURAL[product.unit];
  return {
    product,
    kind: "stock-bajo",
    daysToExpiry: null,
    reason:
      product.quantity === 1
        ? `Queda 1 ${unit}. Es momento de comprar.`
        : `Quedan ${product.quantity} ${plural}. Es momento de comprar.`,
  };
}

function outOfStockAlert(product: Product): AlertItem {
  return {
    product,
    kind: "agotado",
    daysToExpiry: null,
    reason: "Ya no tienes unidades disponibles.",
  };
}

function expiryAlert(product: Product, days: number, expired: boolean): AlertItem {
  const nearest = getNearestExpiry(product);
  return {
    product,
    kind: expired ? "vencido" : "por-vencer",
    daysToExpiry: days,
    reason: expired
      ? nearest
        ? `Este producto ya venció (${formatDate(nearest)}). Sácalo del inventario.`
        : "Este producto ya venció. Sácalo del inventario."
      : `${expiryLabel(days)}${nearest ? ` (${formatDate(nearest)})` : ""}. Trata de venderlo primero.`,
  };
}

export function getAlertGroups(
  products: Product[],
  warningDays: number,
): AlertGroups {
  const lowStock: AlertItem[] = [];
  const outOfStock: AlertItem[] = [];
  const expiring: AlertItem[] = [];
  const expired: AlertItem[] = [];

  for (const product of products) {
    const state = getProductState(product, warningDays);
    // Cada producto aparece una sola vez, en el grupo más urgente.
    if (state.isOutOfStock) {
      outOfStock.push(outOfStockAlert(product));
    } else if (state.isExpired && state.daysToExpiry !== null) {
      expired.push(expiryAlert(product, state.daysToExpiry, true));
    } else if (state.isExpiringSoon && state.daysToExpiry !== null) {
      expiring.push(expiryAlert(product, state.daysToExpiry, false));
    } else if (state.isLowStock) {
      lowStock.push(lowStockAlert(product));
    }
  }

  lowStock.sort((a, b) => {
    const ratioA = a.product.quantity / Math.max(a.product.minStock, 1);
    const ratioB = b.product.quantity / Math.max(b.product.minStock, 1);
    return ratioA - ratioB;
  });
  outOfStock.sort((a, b) => a.product.name.localeCompare(b.product.name, "es"));
  expiring.sort((a, b) => (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0));
  expired.sort((a, b) => (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0));

  return { lowStock, outOfStock, expiring, expired };
}

const URGENT_RANK: Record<AlertKind, number> = {
  vencido: 0,
  agotado: 1,
  "stock-bajo": 2,
  "por-vencer": 3,
};

export function getUrgentAlerts(
  products: Product[],
  warningDays: number,
): AlertItem[] {
  const items: AlertItem[] = [];
  for (const product of products) {
    const state = getProductState(product, warningDays);
    if (state.isExpired && state.daysToExpiry !== null) {
      items.push(expiryAlert(product, state.daysToExpiry, true));
    } else if (state.isOutOfStock) {
      items.push(outOfStockAlert(product));
    } else if (state.isExpiringSoon && state.daysToExpiry !== null) {
      items.push(expiryAlert(product, state.daysToExpiry, false));
    } else if (state.isLowStock) {
      items.push(lowStockAlert(product));
    }
  }

  return items.sort((a, b) => {
    const rank = URGENT_RANK[a.kind] - URGENT_RANK[b.kind];
    if (rank !== 0) return rank;
    if (a.kind === "vencido" || a.kind === "por-vencer") {
      return (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0);
    }
    if (a.kind === "stock-bajo") {
      const ratioA = a.product.quantity / Math.max(a.product.minStock, 1);
      const ratioB = b.product.quantity / Math.max(b.product.minStock, 1);
      return ratioA - ratioB;
    }
    return a.product.name.localeCompare(b.product.name, "es");
  });
}

export function getReorderAmount(product: Product): number {
  const target = Math.max(product.minStock * 2, 6);
  return Math.max(target - product.quantity, 0);
}

export function getMargin(purchasePrice: number, salePrice: number): number {
  if (salePrice <= 0) return 0;
  return Math.round(((salePrice - purchasePrice) / salePrice) * 100);
}

export function isWithinDays(iso: string, days: number): boolean {
  const cutoff = startOfDay(addDays(new Date(), -(days - 1))).getTime();
  return new Date(iso).getTime() >= cutoff;
}

export interface MovedProduct {
  key: string;
  name: string;
  quantity: number;
  product?: Product;
}

export function getTopMovedProducts(
  movements: Movement[],
  products: Product[],
  days: number,
  type: "entrada" | "salida" = "salida",
  limit = 5,
  options: { salesOnly?: boolean } = {},
): MovedProduct[] {
  const totals = new Map<string, MovedProduct>();
  for (const movement of movements) {
    if (movement.type !== type || !isWithinDays(movement.date, days)) continue;
    if (options.salesOnly && (movement.reason ?? "venta") !== "venta") continue;
    const current = totals.get(movement.productId);
    if (current) {
      current.quantity += movement.quantity;
    } else {
      totals.set(movement.productId, {
        key: movement.productId,
        name: movement.productName,
        quantity: movement.quantity,
        product: products.find((p) => p.id === movement.productId),
      });
    }
  }
  return [...totals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export interface RotationItem {
  product: Product;
  quantity: number;
}

export function getLowRotationProducts(
  products: Product[],
  movements: Movement[],
  days: number,
  limit = 5,
): RotationItem[] {
  const totals = new Map<string, number>();
  for (const movement of movements) {
    if (movement.type !== "salida" || !isWithinDays(movement.date, days)) {
      continue;
    }
    if ((movement.reason ?? "venta") !== "venta") continue;
    totals.set(
      movement.productId,
      (totals.get(movement.productId) ?? 0) + movement.quantity,
    );
  }
  return products
    .map((product) => ({
      product,
      quantity: totals.get(product.id) ?? 0,
    }))
    .sort((a, b) => {
      if (a.quantity !== b.quantity) return a.quantity - b.quantity;
      return a.product.name.localeCompare(b.product.name, "es");
    })
    .slice(0, limit);
}

export interface LossSummary {
  movements: number;
  units: number;
  value: number;
}

/** Salidas que no son venta: vencidos, dañados, perdidos y consumo interno. */
export function getLossSummary(movements: Movement[], days?: number): LossSummary {
  let count = 0;
  let units = 0;
  let value = 0;
  for (const movement of movements) {
    if (movement.type !== "salida") continue;
    if ((movement.reason ?? "venta") === "venta") continue;
    if (typeof days === "number" && !isWithinDays(movement.date, days)) continue;
    count += 1;
    units += movement.quantity;
    value += movement.quantity * (movement.unitCost ?? 0);
  }
  return { movements: count, units, value };
}

export interface MovementBucket {
  label: string;
  entradas: number;
  salidas: number;
}

export function getMovementBuckets(
  movements: Movement[],
  days: number,
): MovementBucket[] {
  const size = days <= 7 ? 1 : days <= 30 ? 5 : 15;
  const bucketCount = Math.ceil(days / size);
  const today = startOfDay(new Date());
  const base = addDays(today, -(bucketCount * size - 1));

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = addDays(base, index * size);
    const end = addDays(start, size);
    const endInclusive = addDays(end, -1);
    let label = formatShortDate(start);
    if (size > 1) {
      const sameMonth =
        start.getMonth() === endInclusive.getMonth() &&
        start.getFullYear() === endInclusive.getFullYear();
      label = sameMonth
        ? `${start.getDate()}–${formatShortDate(endInclusive)}`
        : `${formatShortDate(start)}–${formatShortDate(endInclusive)}`;
    }
    return { start, end, label, entradas: 0, salidas: 0 };
  });

  for (const movement of movements) {
    const date = parseDate(movement.date);
    const bucket = buckets.find(
      (item) => date >= item.start && date < item.end,
    );
    if (!bucket) continue;
    if (movement.type === "entrada") bucket.entradas += movement.quantity;
    else bucket.salidas += movement.quantity;
  }

  return buckets.map(({ label, entradas, salidas }) => ({
    label,
    entradas,
    salidas,
  }));
}

export interface CategoryBreakdown {
  category: Category;
  products: number;
  units: number;
  value: number;
  barClass: string;
}

export function getCategoryBreakdown(products: Product[]): CategoryBreakdown[] {
  const map = new Map<Category, CategoryBreakdown>();
  for (const product of products) {
    const current = map.get(product.category) ?? {
      category: product.category,
      products: 0,
      units: 0,
      value: 0,
      barClass: CATEGORY_META[product.category].bar,
    };
    current.products += 1;
    current.units += product.quantity;
    current.value += product.quantity * product.purchasePrice;
    map.set(product.category, current);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function getPeriodTotals(
  movements: Movement[],
  days: number,
): { entradas: number; salidas: number; movements: number } {
  let entradas = 0;
  let salidas = 0;
  let count = 0;
  for (const movement of movements) {
    if (!isWithinDays(movement.date, days)) continue;
    count += 1;
    if (movement.type === "entrada") entradas += movement.quantity;
    else salidas += movement.quantity;
  }
  return { entradas, salidas, movements: count };
}
