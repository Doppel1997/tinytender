import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Movement,
  MovementInput,
  Product,
  ProductInput,
  Settings,
  StockBatch,
  StoreData,
} from "../types";
import { MOVEMENT_REASONS, unitFor } from "../types";
import { createDemoData, DEFAULT_SETTINGS } from "../data/demo";
import { uid } from "../lib/utils";

export const STORAGE_KEY = "tienda-clara:data:v1";
const DATA_VERSION = 2;

function validQuantity(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function makeBatch(quantity: number, expiresAt: string | null): StockBatch {
  return {
    id: uid(),
    quantity,
    expiresAt,
    receivedAt: new Date().toISOString(),
  };
}

function normalizeBatches(raw: unknown, receivedAt: string): StockBatch[] {
  if (!Array.isArray(raw)) return [];
  const batches: StockBatch[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<StockBatch>;
    const quantity = validQuantity(candidate.quantity);
    if (quantity <= 0) continue;
    batches.push({
      id: typeof candidate.id === "string" ? candidate.id : uid(),
      quantity,
      expiresAt:
        typeof candidate.expiresAt === "string" ? candidate.expiresAt : null,
      receivedAt:
        typeof candidate.receivedAt === "string"
          ? candidate.receivedAt
          : receivedAt,
    });
  }
  return batches;
}

function nearestExpiry(batches: StockBatch[]): string | null {
  const dates = batches
    .filter((batch) => batch.quantity > 0 && batch.expiresAt)
    .map((batch) => batch.expiresAt as string)
    .sort();
  return dates[0] ?? null;
}

/** Garantiza que cantidad y vencimiento coincidan con los lotes. */
function syncProduct(
  product: Product,
  fallbackQuantity?: number,
  fallbackExpiry?: string | null,
): Product {
  if (product.batches.length === 0) {
    const quantity = Math.max(0, fallbackQuantity ?? product.quantity);
    return {
      ...product,
      quantity,
      expiresAt: quantity > 0 ? (fallbackExpiry ?? product.expiresAt) : null,
    };
  }
  const quantity = product.batches.reduce(
    (total, batch) => total + batch.quantity,
    0,
  );
  return { ...product, quantity, expiresAt: nearestExpiry(product.batches) };
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<Product>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    !candidate.name.trim()
  ) {
    return null;
  }
  const createdAt =
    typeof candidate.createdAt === "string"
      ? candidate.createdAt
      : new Date().toISOString();
  const quantity = Math.max(0, validQuantity(candidate.quantity));
  let batches = normalizeBatches(candidate.batches, createdAt);
  // Migración desde la versión 1: un solo lote con la cantidad y el vencimiento.
  if (batches.length === 0 && quantity > 0) {
    batches = [
      {
        id: uid(),
        quantity,
        expiresAt:
          typeof candidate.expiresAt === "string" ? candidate.expiresAt : null,
        receivedAt: createdAt,
      },
    ];
  }
  const product: Product = {
    id: candidate.id,
    name: candidate.name.trim(),
    category: (candidate.category ?? "Abarrotes") as Product["category"],
    sku: typeof candidate.sku === "string" ? candidate.sku : "",
    purchasePrice: Math.max(0, Number(candidate.purchasePrice) || 0),
    salePrice: Math.max(0, Number(candidate.salePrice) || 0),
    quantity: 0,
    minStock: Math.max(0, Math.floor(Number(candidate.minStock) || 0)),
    unit: (candidate.unit ?? "un") as Product["unit"],
    expiresAt: null,
    batches,
    icon: typeof candidate.icon === "string" ? candidate.icon : "📦",
    createdAt,
  };
  return syncProduct(product, quantity, candidate.expiresAt ?? null);
}

function normalizeMovement(
  raw: unknown,
  productsById: Map<string, Product>,
): Movement | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<Movement>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.productId !== "string" ||
    typeof candidate.productName !== "string" ||
    (candidate.type !== "entrada" && candidate.type !== "salida")
  ) {
    return null;
  }
  const quantity = validQuantity(candidate.quantity);
  if (quantity <= 0) return null;
  const product = productsById.get(candidate.productId);
  const reason =
    candidate.type === "salida" &&
    typeof candidate.reason === "string" &&
    (MOVEMENT_REASONS as readonly string[]).includes(candidate.reason)
      ? (candidate.reason as Movement["reason"])
      : candidate.type === "salida"
        ? "venta"
        : undefined;
  return {
    id: candidate.id,
    productId: candidate.productId,
    productName: candidate.productName,
    type: candidate.type,
    quantity,
    date:
      typeof candidate.date === "string"
        ? candidate.date
        : new Date().toISOString(),
    reason,
    unitCost:
      typeof candidate.unitCost === "number"
        ? Math.max(0, candidate.unitCost)
        : product?.purchasePrice,
    note:
      typeof candidate.note === "string" && candidate.note.trim()
        ? candidate.note.trim()
        : undefined,
  };
}

function normalizeStoredData(raw: unknown): StoreData | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<StoreData>;
  if (
    (candidate.version !== 1 && candidate.version !== DATA_VERSION) ||
    !Array.isArray(candidate.products) ||
    !Array.isArray(candidate.movements) ||
    !candidate.settings ||
    typeof candidate.settings !== "object"
  ) {
    return null;
  }
  const products = candidate.products
    .map(normalizeProduct)
    .filter((product): product is Product => Boolean(product));
  const byId = new Map(products.map((product) => [product.id, product]));
  const movements = candidate.movements
    .map((movement) => normalizeMovement(movement, byId))
    .filter((movement): movement is Movement => Boolean(movement))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return {
    version: DATA_VERSION,
    products,
    movements,
    settings: { ...DEFAULT_SETTINGS, ...candidate.settings },
    seededAt: candidate.seededAt ?? new Date().toISOString(),
  };
}

export function loadStore(): StoreData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = normalizeStoredData(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // Datos corruptos o almacenamiento no disponible: usamos la demo.
  }
  return createDemoData();
}

export type MovementResult =
  | { ok: true; movement: Movement; newStock: number }
  | { ok: false; error: string };

interface StoreContextValue {
  products: Product[];
  movements: Movement[];
  settings: Settings;
  addProduct: (input: ProductInput) => Product;
  updateProduct: (id: string, input: ProductInput) => Product | null;
  deleteProduct: (id: string) => void;
  addMovement: (input: MovementInput) => MovementResult;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
  clearInventory: () => void;
  getProduct: (id: string) => Product | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** Consume primero los lotes que vencen antes (PEPS/FEFO). */
function consumeBatches(
  batches: StockBatch[],
  quantity: number,
): StockBatch[] {
  let remaining = quantity;
  const sorted = [...batches].sort((a, b) => {
    if (a.expiresAt && b.expiresAt) return a.expiresAt.localeCompare(b.expiresAt);
    if (a.expiresAt) return -1;
    if (b.expiresAt) return 1;
    return a.receivedAt.localeCompare(b.receivedAt);
  });
  const next: StockBatch[] = [];
  for (const batch of sorted) {
    if (remaining <= 0) {
      next.push(batch);
      continue;
    }
    if (batch.quantity <= remaining) {
      remaining -= batch.quantity;
    } else {
      next.push({ ...batch, quantity: batch.quantity - remaining });
      remaining = 0;
    }
  }
  return next;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(loadStore);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Si el navegador bloquea LocalStorage, la app sigue funcionando en memoria.
    }
  }, [data]);

  const addProduct = useCallback((input: ProductInput): Product => {
    const batches =
      input.quantity > 0
        ? [makeBatch(input.quantity, input.expiresAt)]
        : [];
    const product: Product = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
      quantity: input.quantity,
      expiresAt: input.quantity > 0 ? input.expiresAt : null,
      batches,
    };
    setData((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
    return product;
  }, []);

  const updateProduct = useCallback(
    (id: string, input: ProductInput): Product | null => {
      const current = data.products.find((product) => product.id === id);
      if (!current) return null;

      let batches = current.batches;
      if (input.quantity > current.quantity) {
        batches = [
          ...batches,
          makeBatch(input.quantity - current.quantity, input.expiresAt),
        ];
      } else if (input.quantity < current.quantity) {
        batches = consumeBatches(batches, current.quantity - input.quantity);
      } else if (
        input.expiresAt !== current.expiresAt &&
        batches.filter((batch) => batch.quantity > 0).length <= 1
      ) {
        batches = batches.map((batch) => ({
          ...batch,
          expiresAt: input.expiresAt,
        }));
      }

      const updated: Product = syncProduct(
        {
          ...current,
          ...input,
          quantity: input.quantity,
          expiresAt: input.expiresAt,
          batches,
        },
        input.quantity,
        input.expiresAt,
      );

      setData((prev) => ({
        ...prev,
        products: prev.products.map((product) =>
          product.id === id ? updated : product,
        ),
        movements: prev.movements.map((movement) =>
          movement.productId === id
            ? { ...movement, productName: input.name }
            : movement,
        ),
      }));
      return updated;
    },
    [data.products],
  );

  const deleteProduct = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
  }, []);

  const addMovement = useCallback(
    (input: MovementInput): MovementResult => {
      const product = data.products.find((item) => item.id === input.productId);
      if (!product) {
        return { ok: false, error: "Selecciona un producto válido." };
      }

      const quantity = Math.floor(input.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return {
          ok: false,
          error: "La cantidad debe ser mayor que cero.",
        };
      }

      if (input.type === "salida" && quantity > product.quantity) {
        return {
          ok: false,
          error: `Solo tienes ${product.quantity} ${unitFor(
            product.unit,
            product.quantity,
          )}.`,
        };
      }

      const newStock =
        product.quantity + (input.type === "entrada" ? quantity : -quantity);
      const batches =
        input.type === "entrada"
          ? [...product.batches, makeBatch(quantity, input.expiresAt ?? null)]
          : consumeBatches(product.batches, quantity);

      const movement: Movement = {
        id: uid(),
        productId: product.id,
        productName: product.name,
        type: input.type,
        quantity,
        date: input.date,
        reason:
          input.type === "salida" ? (input.reason ?? "venta") : undefined,
        unitCost: product.purchasePrice,
        note: input.note?.trim() || undefined,
      };

      setData((prev) => ({
        ...prev,
        products: prev.products.map((item) =>
          item.id === product.id
            ? syncProduct(
                { ...item, batches, quantity: newStock },
                newStock,
                input.type === "entrada"
                  ? (input.expiresAt ?? item.expiresAt)
                  : item.expiresAt,
              )
            : item,
        ),
        movements: [movement, ...prev.movements],
      }));

      return { ok: true, movement, newStock };
    },
    [data.products],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setData(createDemoData());
  }, []);

  const clearInventory = useCallback(() => {
    setData((prev) => ({
      ...prev,
      products: [],
      movements: [],
    }));
  }, []);

  const getProduct = useCallback(
    (id: string) => data.products.find((product) => product.id === id),
    [data.products],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      products: data.products,
      movements: data.movements,
      settings: data.settings,
      addProduct,
      updateProduct,
      deleteProduct,
      addMovement,
      updateSettings,
      resetDemo,
      clearInventory,
      getProduct,
    }),
    [
      data.products,
      data.movements,
      data.settings,
      addProduct,
      updateProduct,
      deleteProduct,
      addMovement,
      updateSettings,
      resetDemo,
      clearInventory,
      getProduct,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore debe usarse dentro de StoreProvider.");
  }
  return context;
}
