import type {
  Movement,
  MovementReason,
  Product,
  Settings,
  StockBatch,
  StoreData,
} from "../types";
import { addDays, toISODate } from "../lib/date";
import { uid } from "../lib/utils";

function expiryIn(days: number): string {
  return toISODate(addDays(new Date(), days));
}

export const DEFAULT_SETTINGS: Settings = {
  businessName: "Tienda Doña Rosa",
  businessType: "mixta",
  ownerName: "Doña Rosa",
  city: "Villavicencio",
  address: "Calle 15 # 8-42, Barrio La Esperanza",
  phone: "310 555 0182",
  expiryWarningDays: 30,
  showReorderSuggestions: true,
};

interface DemoLot {
  quantity: number;
  expiresAt: string | null;
}

type DemoProduct = Omit<Product, "id" | "createdAt" | "batches"> & {
  key: string;
  /** Permite simular varios lotes con vencimientos distintos. */
  lots?: DemoLot[];
};

const demoProducts: DemoProduct[] = [
  {
    key: "coca-15",
    name: "Coca-Cola 1.5 L",
    category: "Gaseosas",
    sku: "GAS-0001",
    purchasePrice: 5200,
    salePrice: 7000,
    quantity: 18,
    minStock: 6,
    unit: "un",
    expiresAt: expiryIn(120),
    icon: "🥤",
    lots: [
      { quantity: 10, expiresAt: expiryIn(60) },
      { quantity: 8, expiresAt: expiryIn(120) },
    ],
  },
  {
    key: "agua-cristal",
    name: "Agua Cristal 600 ml",
    category: "Bebidas",
    sku: "BEB-0001",
    purchasePrice: 1300,
    salePrice: 2000,
    quantity: 40,
    minStock: 12,
    unit: "un",
    expiresAt: expiryIn(180),
    icon: "💧",
  },
  {
    key: "poker",
    name: "Cerveza Poker 330 ml",
    category: "Cervezas",
    sku: "CER-0001",
    purchasePrice: 2100,
    salePrice: 3000,
    quantity: 24,
    minStock: 12,
    unit: "un",
    expiresAt: expiryIn(90),
    icon: "🍺",
    lots: [
      { quantity: 12, expiresAt: expiryIn(45) },
      { quantity: 12, expiresAt: expiryIn(90) },
    ],
  },
  {
    key: "aguila",
    name: "Cerveza Águila 330 ml",
    category: "Cervezas",
    sku: "CER-0002",
    purchasePrice: 2000,
    salePrice: 2800,
    quantity: 8,
    minStock: 12,
    unit: "un",
    expiresAt: expiryIn(60),
    icon: "🍺",
  },
  {
    key: "ron-medellin",
    name: "Ron Medellín 750 ml",
    category: "Licores",
    sku: "LIC-0001",
    purchasePrice: 52000,
    salePrice: 68000,
    quantity: 5,
    minStock: 3,
    unit: "bot",
    expiresAt: null,
    icon: "🥃",
  },
  {
    key: "aguardiente",
    name: "Aguardiente Néctar 750 ml",
    category: "Licores",
    sku: "LIC-0002",
    purchasePrice: 38000,
    salePrice: 49000,
    quantity: 3,
    minStock: 4,
    unit: "bot",
    expiresAt: null,
    icon: "🥃",
  },
  {
    key: "papas",
    name: "Papas Margarita 105 g",
    category: "Snacks",
    sku: "SNA-0001",
    purchasePrice: 3400,
    salePrice: 4500,
    quantity: 14,
    minStock: 6,
    unit: "un",
    expiresAt: expiryIn(45),
    icon: "🍿",
  },
  {
    key: "arroz",
    name: "Arroz Diana 1 kg",
    category: "Abarrotes",
    sku: "ABA-0001",
    purchasePrice: 4200,
    salePrice: 5300,
    quantity: 20,
    minStock: 8,
    unit: "un",
    expiresAt: expiryIn(240),
    icon: "🌾",
  },
  {
    key: "aceite",
    name: "Aceite de cocina Premier 1 L",
    category: "Abarrotes",
    sku: "ABA-0002",
    purchasePrice: 11000,
    salePrice: 13900,
    quantity: 6,
    minStock: 5,
    unit: "bot",
    expiresAt: expiryIn(150),
    icon: "🫒",
  },
  {
    key: "leche",
    name: "Leche Alquería 1 L",
    category: "Lácteos",
    sku: "LAC-0001",
    purchasePrice: 3800,
    salePrice: 4800,
    quantity: 9,
    minStock: 10,
    unit: "un",
    expiresAt: expiryIn(3),
    icon: "🥛",
    lots: [
      { quantity: 4, expiresAt: expiryIn(3) },
      { quantity: 5, expiresAt: expiryIn(12) },
    ],
  },
  {
    key: "pan",
    name: "Pan tajado Bimbo 460 g",
    category: "Abarrotes",
    sku: "ABA-0003",
    purchasePrice: 5800,
    salePrice: 7200,
    quantity: 2,
    minStock: 4,
    unit: "un",
    expiresAt: expiryIn(3),
    icon: "🍞",
  },
  {
    key: "yogurt",
    name: "Yogurt Alpina 1 L",
    category: "Lácteos",
    sku: "LAC-0002",
    purchasePrice: 7200,
    salePrice: 8900,
    quantity: 0,
    minStock: 5,
    unit: "un",
    expiresAt: null,
    icon: "🥣",
  },
  {
    key: "hit",
    name: "Jugo Hit 500 ml",
    category: "Bebidas",
    sku: "BEB-0002",
    purchasePrice: 2200,
    salePrice: 3000,
    quantity: 16,
    minStock: 6,
    unit: "un",
    expiresAt: expiryIn(20),
    icon: "🧃",
  },
  {
    key: "speed",
    name: "Energizante Speed 300 ml",
    category: "Bebidas",
    sku: "BEB-0003",
    purchasePrice: 2800,
    salePrice: 4000,
    quantity: 3,
    minStock: 6,
    unit: "un",
    expiresAt: expiryIn(70),
    icon: "⚡",
  },
  {
    key: "club",
    name: "Cerveza Club Dorada 330 ml",
    category: "Cervezas",
    sku: "CER-0003",
    purchasePrice: 2400,
    salePrice: 3200,
    quantity: 30,
    minStock: 12,
    unit: "un",
    expiresAt: expiryIn(100),
    icon: "🍻",
  },
  {
    key: "old-parr",
    name: "Old Parr 750 ml",
    category: "Licores",
    sku: "LIC-0003",
    purchasePrice: 110000,
    salePrice: 145000,
    quantity: 1,
    minStock: 2,
    unit: "bot",
    expiresAt: null,
    icon: "🥃",
  },
  {
    key: "smirnoff",
    name: "Smirnoff 700 ml",
    category: "Licores",
    sku: "LIC-0004",
    purchasePrice: 42000,
    salePrice: 56000,
    quantity: 4,
    minStock: 2,
    unit: "bot",
    expiresAt: expiryIn(300),
    icon: "🍸",
  },
  {
    key: "agua-mana",
    name: "Agua Maná 600 ml",
    category: "Bebidas",
    sku: "BEB-0004",
    purchasePrice: 1500,
    salePrice: 2300,
    quantity: 22,
    minStock: 8,
    unit: "un",
    expiresAt: expiryIn(200),
    icon: "💧",
  },
  {
    key: "fab",
    name: "Detergente Fab 900 g",
    category: "Aseo",
    sku: "ASE-0001",
    purchasePrice: 11500,
    salePrice: 14500,
    quantity: 4,
    minStock: 3,
    unit: "un",
    expiresAt: expiryIn(400),
    icon: "🧼",
  },
  {
    key: "jabon-rey",
    name: "Jabón Rey 300 g",
    category: "Aseo",
    sku: "ASE-0002",
    purchasePrice: 3200,
    salePrice: 4200,
    quantity: 12,
    minStock: 5,
    unit: "un",
    expiresAt: expiryIn(500),
    icon: "🧴",
  },
  {
    key: "chocolate-corona",
    name: "Chocolate Corona 500 g",
    category: "Abarrotes",
    sku: "ABA-0004",
    purchasePrice: 8900,
    salePrice: 11000,
    quantity: 5,
    minStock: 4,
    unit: "un",
    expiresAt: expiryIn(8),
    icon: "🍫",
  },
  {
    key: "galletas",
    name: "Galletas Festival",
    category: "Snacks",
    sku: "SNA-0002",
    purchasePrice: 1100,
    salePrice: 1600,
    quantity: 35,
    minStock: 10,
    unit: "un",
    expiresAt: expiryIn(14),
    icon: "🍪",
  },
  {
    key: "huevos",
    name: "Huevos AA x 30",
    category: "Abarrotes",
    sku: "ABA-0005",
    purchasePrice: 13500,
    salePrice: 16500,
    quantity: 7,
    minStock: 6,
    unit: "band",
    expiresAt: expiryIn(6),
    icon: "🥚",
  },
  {
    key: "queso",
    name: "Queso Campesino 250 g",
    category: "Lácteos",
    sku: "LAC-0003",
    purchasePrice: 6500,
    salePrice: 8500,
    quantity: 3,
    minStock: 4,
    unit: "un",
    expiresAt: expiryIn(-2),
    icon: "🧀",
  },
  {
    key: "chocolatina",
    name: "Chocolatina Jumbo",
    category: "Snacks",
    sku: "SNA-0003",
    purchasePrice: 1800,
    salePrice: 2600,
    quantity: 10,
    minStock: 6,
    unit: "un",
    expiresAt: expiryIn(-5),
    icon: "🍫",
  },
  {
    key: "salsa",
    name: "Salsa de tomate Fruco 200 g",
    category: "Abarrotes",
    sku: "ABA-0006",
    purchasePrice: 2800,
    salePrice: 3900,
    quantity: 18,
    minStock: 6,
    unit: "un",
    expiresAt: expiryIn(4),
    icon: "🥫",
  },
  {
    key: "costena",
    name: "Cerveza Costeñita 330 ml",
    category: "Cervezas",
    sku: "CER-0004",
    purchasePrice: 1900,
    salePrice: 2700,
    quantity: 0,
    minStock: 12,
    unit: "un",
    expiresAt: null,
    icon: "🍺",
  },
];

/** PRNG con semilla para que los datos de demostración sean estables. */
function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function movementDate(daysAgo: number, random: () => number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() - daysAgo);
  if (daysAgo === 0) {
    date.setTime(now.getTime() - Math.round(25 + random() * 320) * 60_000);
  } else {
    date.setHours(8 + Math.floor(random() * 11), Math.floor(random() * 60));
  }
  return date.toISOString();
}

interface SaleProfile {
  key: string;
  count: number;
  min: number;
  max: number;
}

const SALE_PROFILES: SaleProfile[] = [
  { key: "poker", count: 12, min: 2, max: 8 },
  { key: "aguila", count: 10, min: 2, max: 6 },
  { key: "coca-15", count: 9, min: 1, max: 4 },
  { key: "agua-cristal", count: 8, min: 2, max: 6 },
  { key: "papas", count: 7, min: 1, max: 3 },
  { key: "leche", count: 5, min: 1, max: 3 },
  { key: "club", count: 5, min: 2, max: 6 },
  { key: "hit", count: 4, min: 1, max: 3 },
  { key: "galletas", count: 4, min: 1, max: 4 },
  { key: "ron-medellin", count: 3, min: 1, max: 2 },
  { key: "costena", count: 3, min: 2, max: 6 },
  { key: "aguardiente", count: 2, min: 1, max: 2 },
  { key: "arroz", count: 2, min: 1, max: 2 },
  { key: "huevos", count: 2, min: 1, max: 2 },
  { key: "speed", count: 2, min: 1, max: 3 },
  { key: "aceite", count: 1, min: 1, max: 2 },
  { key: "fab", count: 1, min: 1, max: 2 },
  { key: "salsa", count: 1, min: 1, max: 2 },
  { key: "queso", count: 1, min: 1, max: 1 },
  { key: "chocolatina", count: 1, min: 1, max: 2 },
];

const SALE_NOTES = [
  "Venta en mostrador",
  "Pedido a domicilio",
  "Cliente del barrio",
  "Venta de la tarde",
  "Venta de la mañana",
];

const ENTRY_NOTES = [
  "Compra a proveedor",
  "Reposición de mercancía",
  "Llegada de pedido",
  "Compra al mayorista",
];

interface LossProfile {
  key: string;
  quantity: number;
  daysAgo: number;
  reason: MovementReason;
  note: string;
}

const LOSS_PROFILES: LossProfile[] = [
  {
    key: "queso",
    quantity: 1,
    daysAgo: 2,
    reason: "vencido",
    note: "Queso vencido, se sacó del inventario",
  },
  {
    key: "chocolatina",
    quantity: 3,
    daysAgo: 3,
    reason: "vencido",
    note: "Chocolatinas vencidas",
  },
  {
    key: "pan",
    quantity: 1,
    daysAgo: 1,
    reason: "vencido",
    note: "Pan vencido",
  },
  {
    key: "leche",
    quantity: 2,
    daysAgo: 10,
    reason: "danado",
    note: "Leche dañada por transporte",
  },
  {
    key: "salsa",
    quantity: 1,
    daysAgo: 15,
    reason: "danado",
    note: "Frasco roto",
  },
];

interface EntryProfile {
  key: string;
  quantity: number;
  daysAgo: number;
}

const ENTRY_PROFILES: EntryProfile[] = [
  { key: "poker", quantity: 36, daysAgo: 2 },
  { key: "coca-15", quantity: 24, daysAgo: 4 },
  { key: "agua-cristal", quantity: 48, daysAgo: 6 },
  { key: "aguila", quantity: 24, daysAgo: 9 },
  { key: "papas", quantity: 18, daysAgo: 12 },
  { key: "club", quantity: 36, daysAgo: 16 },
  { key: "leche", quantity: 18, daysAgo: 21 },
  { key: "hit", quantity: 24, daysAgo: 28 },
  { key: "galletas", quantity: 30, daysAgo: 35 },
  { key: "ron-medellin", quantity: 6, daysAgo: 44 },
  { key: "coca-15", quantity: 24, daysAgo: 52 },
];

function buildBatches(item: DemoProduct, createdAt: string): StockBatch[] {
  const lots =
    item.lots ??
    (item.quantity > 0
      ? [{ quantity: item.quantity, expiresAt: item.expiresAt }]
      : []);
  return lots
    .filter((lot) => lot.quantity > 0)
    .map((lot) => ({
      id: uid(),
      quantity: lot.quantity,
      expiresAt: lot.expiresAt,
      receivedAt: createdAt,
    }));
}

export function createDemoData(): StoreData {
  const random = mulberry32(20261116);
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - 95);

  const products: Product[] = demoProducts.map((item, index) => {
    const { key, lots, ...rest } = item;
    void key;
    void lots;
    const created = new Date(createdAt);
    created.setDate(created.getDate() + index);
    const createdAtIso = created.toISOString();
    const batches = buildBatches(item, createdAtIso);
    const quantity = batches.reduce((total, batch) => total + batch.quantity, 0);
    const expiryDates = batches
      .map((batch) => batch.expiresAt)
      .filter((value): value is string => Boolean(value))
      .sort();
    return {
      ...rest,
      id: `demo-${item.key}`,
      createdAt: createdAtIso,
      batches,
      quantity,
      expiresAt: expiryDates[0] ?? null,
    };
  });

  const byKey = new Map<string, Product>();
  for (const product of products) {
    byKey.set(product.id.replace("demo-", ""), product);
  }

  const movements: Movement[] = [];
  const recentOffsets = [
    0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28,
    31, 34, 38, 42, 46, 50, 54, 58,
  ];

  for (const profile of SALE_PROFILES) {
    const product = byKey.get(profile.key);
    if (!product) continue;
    for (let index = 0; index < profile.count; index += 1) {
      const offset =
        recentOffsets[Math.floor(random() * recentOffsets.length)] ?? 0;
      const quantity =
        profile.min + Math.floor(random() * (profile.max - profile.min + 1));
      movements.push({
        id: uid(),
        productId: product.id,
        productName: product.name,
        type: "salida",
        quantity,
        date: movementDate(offset, random),
        reason: "venta",
        unitCost: product.purchasePrice,
        note: SALE_NOTES[Math.floor(random() * SALE_NOTES.length)],
      });
    }
  }

  for (const profile of LOSS_PROFILES) {
    const product = byKey.get(profile.key);
    if (!product) continue;
    movements.push({
      id: uid(),
      productId: product.id,
      productName: product.name,
      type: "salida",
      quantity: profile.quantity,
      date: movementDate(profile.daysAgo, random),
      reason: profile.reason,
      unitCost: product.purchasePrice,
      note: profile.note,
    });
  }

  for (const profile of ENTRY_PROFILES) {
    const product = byKey.get(profile.key);
    if (!product) continue;
    movements.push({
      id: uid(),
      productId: product.id,
      productName: product.name,
      type: "entrada",
      quantity: profile.quantity,
      date: movementDate(profile.daysAgo, random),
      note: ENTRY_NOTES[Math.floor(random() * ENTRY_NOTES.length)],
    });
  }

  movements.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    version: 2,
    products,
    movements,
    settings: { ...DEFAULT_SETTINGS },
    seededAt: new Date().toISOString(),
  };
}
