import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
} from "lucide-react";
import type { Movement, MovementType } from "../types";
import { MOVEMENT_REASON_LABEL, unitFor } from "../types";
import { useStore } from "../context/StoreContext";
import { useUI } from "../context/UIContext";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/SectionCard";
import { Segmented } from "../components/ui/Segmented";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { ProductIcon } from "../components/ProductIcon";
import { dayLabel, formatTime, relativeTime } from "../lib/date";
import { cn } from "../lib/utils";

type TypeFilter = "todas" | MovementType;

function movementTitle(movement: Movement): string {
  if (movement.type === "entrada") return "Llegó mercancía";
  return MOVEMENT_REASON_LABEL[movement.reason ?? "venta"];
}

export function Movements() {
  const { movements, products } = useStore();
  const { openMovementForm } = useUI();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todas");
  const [productFilter, setProductFilter] = useState("todos");

  const filtered = useMemo(() => {
    return movements.filter((movement) => {
      if (typeFilter !== "todas" && movement.type !== typeFilter) return false;
      if (productFilter !== "todos" && movement.productId !== productFilter) {
        return false;
      }
      return true;
    });
  }, [movements, typeFilter, productFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Movement[]>();
    for (const movement of filtered) {
      const label = dayLabel(movement.date);
      const list = map.get(label) ?? [];
      list.push(movement);
      map.set(label, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const entryCount = movements.filter((item) => item.type === "entrada").length;
  const exitCount = movements.filter((item) => item.type === "salida").length;
  const hasFilters = typeFilter !== "todas" || productFilter !== "todos";
  const productsWithMovements = useMemo(() => {
    const ids = new Set(movements.map((movement) => movement.productId));
    return products
      .filter((product) => ids.has(product.id))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [products, movements]);

  return (
    <div>
      <PageHeader
        title="Entradas y salidas"
        subtitle="Lo que llegó y lo que salió de tu tienda."
        actions={
          <>
            <Button size="lg" onClick={() => openMovementForm("entrada")}>
              <ArrowDownToLine className="h-5 w-5" />
              Recibir mercancía
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => openMovementForm("salida")}
            >
              <ArrowUpFromLine className="h-5 w-5" />
              Registrar salida
            </Button>
          </>
        }
      />

      <div className="space-y-3">
        <Segmented
          value={typeFilter}
          onChange={setTypeFilter}
          ariaLabel="Filtrar por tipo"
          options={[
            { value: "todas", label: "Todas" },
            { value: "entrada", label: "Entradas", count: entryCount },
            { value: "salida", label: "Salidas", count: exitCount },
          ]}
        />

        <div>
          <label
            htmlFor="movement-product-filter"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Producto
          </label>
          <Select
            id="movement-product-filter"
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
          >
            <option value="todos">Todos los productos</option>
            {productsWithMovements.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {movements.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Todavía no has registrado nada"
          description="Cuando llegue o salga mercancía, anótala aquí para saber siempre cuánto te queda."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => openMovementForm("entrada")}>
                <ArrowDownToLine className="h-4 w-4" />
                Recibir mercancía
              </Button>
              <Button
                variant="outline"
                onClick={() => openMovementForm("salida")}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Registrar salida
              </Button>
            </div>
          }
          className="mt-5"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No hay resultados"
          description="No encontramos entradas o salidas con ese filtro. Prueba con otro producto o con «Todas»."
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setTypeFilter("todas");
                  setProductFilter("todos");
                }}
              >
                Quitar filtros
              </Button>
            ) : undefined
          }
          className="mt-5"
        />
      ) : (
        <div className="mt-4 space-y-5">
          {grouped.map(([label, items]) => (
            <section key={label} aria-label={label}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">
                {label}
              </h2>
              <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-300 bg-white">
                {items.map((movement) => {
                  const product = products.find(
                    (item) => item.id === movement.productId,
                  );
                  const isEntry = movement.type === "entrada";
                  return (
                    <li
                      key={movement.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      {product ? (
                        <ProductIcon product={product} size="xs" />
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                          <Package className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold leading-snug text-slate-900">
                          {movement.productName}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-600">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              isEntry ? "text-brand-800" : "text-amber-800",
                            )}
                          >
                            {isEntry ? (
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpFromLine className="h-3.5 w-3.5" />
                            )}
                            {movementTitle(movement)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatTime(movement.date)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{relativeTime(movement.date)}</span>
                        </p>
                        {movement.note ? (
                          <p className="mt-0.5 truncate text-sm text-slate-600">
                            {movement.note}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-lg font-bold tabular-nums leading-tight",
                            isEntry ? "text-brand-800" : "text-amber-800",
                          )}
                        >
                          {isEntry ? "+" : "−"}
                          {movement.quantity}
                        </p>
                        <p className="text-[13px] text-slate-600">
                          {product
                            ? unitFor(product.unit, movement.quantity)
                            : movement.quantity === 1
                              ? "unidad"
                              : "unidades"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
