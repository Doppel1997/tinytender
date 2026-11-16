import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CalendarClock,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import type { Category, Product } from "../types";
import { CATEGORIES, unitFor } from "../types";
import { useStore } from "../context/StoreContext";
import { useUI } from "../context/UIContext";
import { useToast } from "../context/ToastContext";
import {
  getNearestExpiry,
  getProductState,
  getSortedBatches,
  type ProductStatus,
} from "../lib/inventory";
import { normalizeText } from "../lib/format";
import { daysUntil, formatDate, expiryLabel } from "../lib/date";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/SectionCard";
import { ProductIcon } from "../components/ProductIcon";
import { StatusBadge } from "../components/StatusBadge";

type Availability =
  | "todos"
  | "con-unidades"
  | "pocas"
  | "agotados"
  | "vencen-pronto"
  | "vencidos";

const AVAILABILITY_OPTIONS: Array<{ value: Availability; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "con-unidades", label: "Con unidades" },
  { value: "pocas", label: "Pocas unidades" },
  { value: "agotados", label: "Agotados" },
  { value: "vencen-pronto", label: "Próximos a vencer" },
  { value: "vencidos", label: "Vencidos" },
];

const STATUS_ORDER: Record<ProductStatus, number> = {
  vencido: 0,
  agotado: 1,
  "stock-bajo": 2,
  "por-vencer": 3,
  disponible: 4,
};

export function Inventory() {
  const { products, settings, deleteProduct } = useStore();
  const { openProductForm, openProductDetail, openMovementForm, openConfirm } =
    useUI();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "todas">("todas");
  const [availability, setAvailability] = useState<Availability>("todos");

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    return products
      .filter((product) => {
        if (term && !normalizeText(product.name).includes(term)) return false;
        if (category !== "todas" && product.category !== category) return false;
        const state = getProductState(product, settings.expiryWarningDays);
        switch (availability) {
          case "con-unidades":
            return product.quantity > 0;
          case "pocas":
            return state.isLowStock;
          case "agotados":
            return state.isOutOfStock;
          case "vencen-pronto":
            return state.isExpiringSoon;
          case "vencidos":
            return state.isExpired;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const stateA = getProductState(a, settings.expiryWarningDays);
        const stateB = getProductState(b, settings.expiryWarningDays);
        const order = STATUS_ORDER[stateA.status] - STATUS_ORDER[stateB.status];
        if (order !== 0) return order;
        return a.name.localeCompare(b.name, "es");
      });
  }, [products, query, category, availability, settings.expiryWarningDays]);

  const hasFilters =
    query.trim() !== "" || category !== "todas" || availability !== "todos";

  const clearFilters = () => {
    setQuery("");
    setCategory("todas");
    setAvailability("todos");
  };

  const handleDelete = (product: Product) => {
    openConfirm({
      title: "¿Eliminar este producto?",
      description: `«${product.name}» saldrá de tu lista de productos. Su historial de entradas y salidas se conserva. Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      tone: "danger",
      onConfirm: () => {
        deleteProduct(product.id);
        pushToast({
          title: "Producto eliminado",
          description: `${product.name} salió de tu tienda.`,
        });
      },
    });
  };

  const expiryText = (product: Product): string | null => {
    const expiresAt = getNearestExpiry(product);
    if (!expiresAt) return null;
    const days = daysUntil(expiresAt);
    return `${expiryLabel(days)} · ${formatDate(expiresAt)}`;
  };

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Todo lo que tienes en tu tienda."
        actions={
          <Button size="lg" onClick={() => openProductForm()}>
            <Plus className="h-5 w-5" />
            Agregar producto
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar producto por nombre"
            className="pl-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="filter-category"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Categoría
            </label>
            <Select
              id="filter-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as Category | "todas")
              }
            >
              <option value="todas">Todas</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label
              htmlFor="filter-availability"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Disponibilidad
            </label>
            <Select
              id="filter-availability"
              value={availability}
              onChange={(event) =>
                setAvailability(event.target.value as Availability)
              }
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-sm font-medium text-slate-700" aria-live="polite">
            {filtered.length}{" "}
            {filtered.length === 1 ? "producto" : "productos"}
            {hasFilters ? " con estos filtros" : " en tu tienda"}
          </p>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Quitar filtros
            </Button>
          ) : null}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tu tienda está vacía"
          description="Agrega tu primer producto para saber cuánto tienes y cuándo comprar más."
          action={
            <Button size="lg" onClick={() => openProductForm()}>
              <Plus className="h-5 w-5" />
              Agregar producto
            </Button>
          }
          className="mt-5"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos productos"
          description="Prueba con otro nombre o cambia los filtros."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Quitar filtros
              </Button>
            ) : undefined
          }
          className="mt-5"
        />
      ) : (
        <>
          <ul className="mt-4 space-y-2.5 md:hidden">
            {filtered.map((product) => {
              const expiry = expiryText(product);
              const batchCount = getSortedBatches(product).length;
              return (
                <li
                  key={product.id}
                  className="rounded-xl border border-slate-300 bg-white p-4"
                >
                  <button
                    type="button"
                    onClick={() => openProductDetail(product.id)}
                    className="flex w-full items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    <ProductIcon product={product} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold leading-snug text-slate-900">
                        {product.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[26px] font-extrabold leading-none tabular-nums text-slate-900">
                          {product.quantity}
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                          {unitFor(product.unit, product.quantity)}
                        </span>
                      </span>
                      {expiry ? (
                        <span className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
                          <CalendarClock className="h-4 w-4 shrink-0" />
                          <span>{expiry}</span>
                        </span>
                      ) : null}
                      {batchCount > 1 ? (
                        <span className="mt-0.5 block text-sm text-slate-600">
                          {batchCount} lotes con fechas distintas
                        </span>
                      ) : null}
                    </span>
                    <StatusBadge product={product} />
                  </button>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openMovementForm("entrada", product.id)}
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      Recibir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProductDetail(product.id)}
                    >
                      Ver producto
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Editar ${product.name}`}
                      onClick={() => openProductForm(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="dangerGhost"
                      aria-label={`Eliminar ${product.name}`}
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-300 bg-white md:block">
            <table className="w-full text-left">
              <caption className="sr-only">
                Productos de tu tienda con cantidad disponible, estado y
                vencimiento
              </caption>
              <thead className="border-b border-slate-300 bg-slate-50">
                <tr className="text-sm font-semibold text-slate-700">
                  <th scope="col" className="px-4 py-3">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cantidad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Vencimiento
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <th scope="row" className="px-4 py-3 font-normal">
                      <div className="flex items-center gap-3">
                        <ProductIcon product={product} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {product.category}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="text-lg font-bold tabular-nums text-slate-900">
                        {product.quantity}
                      </span>{" "}
                      <span className="text-sm text-slate-600">
                        {unitFor(product.unit, product.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge product={product} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {expiryText(product) ?? "No vence"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Ver ${product.name}`}
                          title="Ver producto"
                          onClick={() => openProductDetail(product.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Recibir mercancía de ${product.name}`}
                          title="Recibir mercancía"
                          onClick={() =>
                            openMovementForm("entrada", product.id)
                          }
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Editar ${product.name}`}
                          title="Editar producto"
                          onClick={() => openProductForm(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="dangerGhost"
                          aria-label={`Eliminar ${product.name}`}
                          title="Eliminar producto"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
