export const CATEGORIES = [
  "Bebidas",
  "Cervezas",
  "Licores",
  "Gaseosas",
  "Snacks",
  "Abarrotes",
  "Lácteos",
  "Aseo",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = [
  { value: "un", label: "Unidad", short: "un" },
  { value: "bot", label: "Botella", short: "bot" },
  { value: "paq", label: "Paquete", short: "paq" },
  { value: "band", label: "Bandeja", short: "band" },
  { value: "caja", label: "Caja", short: "caja" },
] as const;

export type Unit = (typeof UNITS)[number]["value"];

export const UNIT_LABEL: Record<Unit, string> = {
  un: "unidad",
  bot: "botella",
  paq: "paquete",
  band: "bandeja",
  caja: "caja",
};

export const UNIT_PLURAL: Record<Unit, string> = {
  un: "unidades",
  bot: "botellas",
  paq: "paquetes",
  band: "bandejas",
  caja: "cajas",
};

/** Devuelve la unidad en singular o plural según la cantidad. */
export function unitFor(unit: Unit, quantity: number): string {
  return quantity === 1 ? UNIT_LABEL[unit] : UNIT_PLURAL[unit];
}

export type BusinessType = "tienda" | "licorera" | "mixta";

export const BUSINESS_TYPE_LABEL: Record<BusinessType, string> = {
  tienda: "Tienda de barrio",
  licorera: "Licorera",
  mixta: "Tienda y licorera",
};

/**
 * Un lote es mercancía del mismo producto que llegó junta y comparte fecha
 * de vencimiento. Un producto puede tener varios lotes con fechas distintas.
 */
export interface StockBatch {
  id: string;
  quantity: number;
  /** Fecha local YYYY-MM-DD. null cuando el lote no vence. */
  expiresAt: string | null;
  /** Fecha y hora en que llegó el lote (ISO 8601). */
  receivedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  /** Cantidad total disponible. Siempre coincide con la suma de los lotes. */
  quantity: number;
  minStock: number;
  unit: Unit;
  /** Vencimiento más próximo entre los lotes. Se mantiene sincronizado. */
  expiresAt: string | null;
  /** Lotes con su propia cantidad y vencimiento. */
  batches: StockBatch[];
  icon: string;
  createdAt: string;
}

export type MovementType = "entrada" | "salida";

export const MOVEMENT_REASONS = [
  "venta",
  "vencido",
  "danado",
  "perdido",
  "consumo",
  "otro",
] as const;

export type MovementReason = (typeof MOVEMENT_REASONS)[number];

export const MOVEMENT_REASON_LABEL: Record<MovementReason, string> = {
  venta: "Venta",
  vencido: "Producto vencido",
  danado: "Producto dañado",
  perdido: "Producto perdido",
  consumo: "Consumo del negocio",
  otro: "Otro motivo",
};

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  /** Fecha y hora en ISO 8601. */
  date: string;
  /** Motivo de la salida. No aplica a las entradas. */
  reason?: MovementReason;
  /** Precio de compra al momento del movimiento, para valorar pérdidas. */
  unitCost?: number;
  note?: string;
}

export interface Settings {
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  city: string;
  address: string;
  phone: string;
  expiryWarningDays: number;
  showReorderSuggestions: boolean;
}

export interface StoreData {
  version: number;
  products: Product[];
  movements: Movement[];
  settings: Settings;
  seededAt: string;
}

export interface ProductInput {
  name: string;
  category: Category;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  unit: Unit;
  expiresAt: string | null;
  icon: string;
}

export interface MovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  /** Vencimiento del lote que llega. Solo aplica a entradas. */
  expiresAt?: string | null;
  reason?: MovementReason;
  note?: string;
}

export interface CategoryMeta {
  tile: string;
  bar: string;
  text: string;
  defaultIcon: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Bebidas: {
    tile: "bg-sky-50 text-sky-700",
    bar: "bg-sky-500",
    text: "text-sky-800",
    defaultIcon: "💧",
  },
  Cervezas: {
    tile: "bg-amber-50 text-amber-800",
    bar: "bg-amber-500",
    text: "text-amber-800",
    defaultIcon: "🍺",
  },
  Licores: {
    tile: "bg-violet-50 text-violet-700",
    bar: "bg-violet-500",
    text: "text-violet-800",
    defaultIcon: "🥃",
  },
  Gaseosas: {
    tile: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
    text: "text-rose-800",
    defaultIcon: "🥤",
  },
  Snacks: {
    tile: "bg-orange-50 text-orange-700",
    bar: "bg-orange-500",
    text: "text-orange-800",
    defaultIcon: "🍿",
  },
  Abarrotes: {
    tile: "bg-yellow-50 text-yellow-800",
    bar: "bg-yellow-600",
    text: "text-yellow-900",
    defaultIcon: "🌾",
  },
  Lácteos: {
    tile: "bg-blue-50 text-blue-700",
    bar: "bg-blue-500",
    text: "text-blue-800",
    defaultIcon: "🥛",
  },
  Aseo: {
    tile: "bg-teal-50 text-teal-700",
    bar: "bg-teal-500",
    text: "text-teal-800",
    defaultIcon: "🧼",
  },
};

/** Se conserva por compatibilidad con datos antiguos; la interfaz usa iconos Lucide. */
export const ICON_OPTIONS = [
  "🥤",
  "💧",
  "🍺",
  "🍻",
  "🥃",
  "🍷",
  "🍸",
  "🧃",
  "⚡",
  "☕",
  "🍿",
  "🍪",
  "🍫",
  "🍬",
  "🌾",
  "🫒",
  "🥫",
  "🥛",
  "🧀",
  "🍞",
  "🥚",
  "🧼",
  "🧴",
  "🧻",
  "🛒",
  "📦",
];
