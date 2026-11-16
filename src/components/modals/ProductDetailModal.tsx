import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  Package,
  Pencil,
  ShoppingBag,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { Movement } from "../../types";
import { MOVEMENT_REASON_LABEL, UNIT_LABEL, UNIT_PLURAL, unitFor } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/SectionCard";
import { ProductIcon } from "../ProductIcon";
import { StatusBadge } from "../StatusBadge";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { useUI } from "../../context/UIContext";
import {
  getExpiredUnits,
  getMargin,
  getProductState,
  getSortedBatches,
} from "../../lib/inventory";
import { formatCurrency } from "../../lib/format";
import { cn } from "../../lib/utils";
import {
  daysUntil,
  expiryLabel,
  formatDate,
  formatTime,
  relativeTime,
} from "../../lib/date";

interface ProductDetailModalProps {
  productId: string;
  onClose: () => void;
}

function movementLabel(movement: Movement): string {
  if (movement.type === "entrada") return "Llegó mercancía";
  return MOVEMENT_REASON_LABEL[movement.reason ?? "venta"];
}

export function ProductDetailModal({
  productId,
  onClose,
}: ProductDetailModalProps) {
  const { products, movements, settings, deleteProduct } = useStore();
  const { pushToast } = useToast();
  const { openProductForm, openMovementForm, openConfirm } = useUI();

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return (
      <Modal open onClose={onClose} title="Producto no encontrado">
        <EmptyState
          icon={ShoppingBag}
          title="Este producto ya no está"
          description="Puede que lo hayas eliminado de tu tienda."
          action={<Button onClick={onClose}>Cerrar</Button>}
        />
      </Modal>
    );
  }

  const state = getProductState(product, settings.expiryWarningDays);
  const margin = getMargin(product.purchasePrice, product.salePrice);
  const expiredUnits = getExpiredUnits(product);
  const batches = getSortedBatches(product);
  const productMovements = movements.filter(
    (movement) => movement.productId === product.id,
  );
  const recentMovements = productMovements.slice(0, 4);
  const unitPlural = UNIT_PLURAL[product.unit];

  const handleDelete = () => {
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

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      description={`${product.category}${product.sku ? ` · ${product.sku}` : ""}`}
      headerExtra={<ProductIcon product={product} size="sm" />}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">
              Cantidad disponible
            </p>
            <p className="mt-0.5 text-[34px] font-extrabold leading-none tabular-nums text-slate-900">
              {product.quantity}
              <span className="ml-2 text-base font-semibold text-slate-600">
                {unitFor(product.unit, product.quantity)}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Te avisamos cuando queden {product.minStock} o menos.
            </p>
          </div>
          <StatusBadge product={product} />
        </div>

        {expiredUnits > 0 ? (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
            <div className="flex gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-red-900">
                  {expiredUnits === 1
                    ? `1 ${UNIT_LABEL[product.unit]} ya venció`
                    : `${expiredUnits} ${unitPlural} ya vencieron`}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-red-800">
                  Este producto ya venció. Sácalo del inventario para no
                  confundirlo con lo que sí puedes vender.
                  {product.purchasePrice > 0
                    ? ` Pérdida estimada: ${formatCurrency(
                        expiredUnits * product.purchasePrice,
                      )}.`
                    : ""}
                </p>
                <Button
                  variant="danger"
                  className="mt-3 w-full sm:w-auto"
                  onClick={() =>
                    openMovementForm("salida", product.id, {
                      reason: "vencido",
                      quantity: expiredUnits,
                    })
                  }
                >
                  Sacar del inventario
                </Button>
              </div>
            </div>
          </div>
        ) : state.isExpiringSoon && state.daysToExpiry !== null ? (
          <div className="rounded-xl border border-orange-300 bg-orange-50 p-4">
            <p className="text-base font-bold text-orange-900">
              {expiryLabel(state.daysToExpiry)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-orange-800">
              Trata de venderlo primero. Si no se vende a tiempo, regístralo como
              producto vencido.
            </p>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Package className="h-4 w-4 text-slate-600" />
              Lotes y vencimientos
            </h3>
            {batches.length > 1 ? (
              <span className="text-sm text-slate-600">
                {batches.length} lotes
              </span>
            ) : null}
          </div>

          {batches.length === 0 ? (
            <p className="rounded-lg bg-slate-100 px-3.5 py-3 text-sm text-slate-700">
              No hay unidades disponibles.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-300">
              {batches.map((batch, index) => {
                const days = batch.expiresAt ? daysUntil(batch.expiresAt) : null;
                const expired = days !== null && days < 0;
                return (
                  <li
                    key={batch.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900">
                        {batch.quantity} {unitFor(product.unit, batch.quantity)}
                        <span className="ml-1.5 text-sm font-normal text-slate-600">
                          {batches.length > 1 ? `· lote ${index + 1}` : ""}
                        </span>
                      </p>
                      <p
                        className={cn(
                          "text-sm",
                          expired ? "font-semibold text-red-700" : "text-slate-600",
                        )}
                      >
                        {batch.expiresAt
                          ? `Vence: ${formatDate(batch.expiresAt)}${
                              days !== null ? ` · ${expiryLabel(days)}` : ""
                            }`
                          : "No vence"}
                      </p>
                    </div>
                    <CalendarDays
                      className={cn(
                        "h-5 w-5 shrink-0",
                        expired ? "text-red-700" : "text-slate-500",
                      )}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            size="lg"
            onClick={() => openMovementForm("entrada", product.id)}
          >
            <ArrowDownToLine className="h-5 w-5" />
            Recibir mercancía
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => openMovementForm("salida", product.id)}
            disabled={product.quantity <= 0}
          >
            <ArrowUpFromLine className="h-5 w-5" />
            Registrar salida
          </Button>
          <Button variant="outline" onClick={() => openProductForm(product)}>
            <Pencil className="h-4 w-4" />
            Editar producto
          </Button>
          <Button variant="dangerGhost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Eliminar producto
          </Button>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-800">
            Precios (opcional)
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-slate-600">Compra</p>
              <p className="font-semibold tabular-nums text-slate-900">
                {product.purchasePrice > 0
                  ? formatCurrency(product.purchasePrice)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-600">Venta</p>
              <p className="font-semibold tabular-nums text-slate-900">
                {product.salePrice > 0 ? formatCurrency(product.salePrice) : "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-600">Ganancia</p>
              <p
                className={cn(
                  "font-semibold tabular-nums",
                  margin >= 0 ? "text-brand-800" : "text-red-700",
                )}
              >
                {product.purchasePrice > 0 && product.salePrice > 0
                  ? formatCurrency(product.salePrice - product.purchasePrice)
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Últimas entradas y salidas
            </h3>
            <span className="text-sm text-slate-600">
              {productMovements.length} en total
            </span>
          </div>
          {recentMovements.length > 0 ? (
            <ul className="space-y-1">
              {recentMovements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center gap-3 rounded-lg px-1 py-2"
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      movement.type === "entrada"
                        ? "bg-brand-50 text-brand-800"
                        : "bg-amber-50 text-amber-800",
                    )}
                  >
                    {movement.type === "entrada" ? (
                      <ArrowDownToLine className="h-4 w-4" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-slate-900">
                      {movementLabel(movement)} · {movement.quantity}{" "}
                      {unitFor(product.unit, movement.quantity)}
                    </p>
                    <p className="truncate text-[13px] text-slate-600">
                      {relativeTime(movement.date)} · {formatTime(movement.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[15px] font-bold tabular-nums",
                      movement.type === "entrada"
                        ? "text-brand-800"
                        : "text-amber-800",
                    )}
                  >
                    {movement.type === "entrada" ? "+" : "−"}
                    {movement.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-slate-100 px-3.5 py-3 text-sm text-slate-700">
              Todavía no hay entradas ni salidas de este producto.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
