import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Package,
  PackageMinus,
  PackageX,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useUI } from "../context/UIContext";
import {
  getAlertGroups,
  getExpiredUnits,
  getInventorySummary,
  getTopMovedProducts,
  type AlertItem,
  type AlertKind,
} from "../lib/inventory";
import { formatLongDate, greeting } from "../lib/date";
import { formatCurrency } from "../lib/format";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { ProductIcon } from "../components/ProductIcon";

interface AttentionSection {
  kind: AlertKind;
  title: string;
  icon: LucideIcon;
  tile: string;
  items: AlertItem[];
}

export function Dashboard() {
  const { products, movements, settings } = useStore();
  const { openMovementForm, openProductDetail } = useUI();

  const groups = getAlertGroups(products, settings.expiryWarningDays);
  const summary = getInventorySummary(products, settings.expiryWarningDays);
  const topSales = getTopMovedProducts(movements, products, 30, "salida", 1, {
    salesOnly: true,
  });
  const topProduct = topSales[0];

  const allSections: AttentionSection[] = [
    {
      kind: "vencido",
      title: "Productos vencidos",
      icon: TriangleAlert,
      tile: "bg-red-100 text-red-800",
      items: groups.expired,
    },
    {
      kind: "agotado",
      title: "Productos agotados",
      icon: PackageX,
      tile: "bg-red-50 text-red-700",
      items: groups.outOfStock,
    },
    {
      kind: "stock-bajo",
      title: "Productos con pocas unidades",
      icon: PackageMinus,
      tile: "bg-amber-50 text-amber-800",
      items: groups.lowStock,
    },
    {
      kind: "por-vencer",
      title: "Productos próximos a vencer",
      icon: CalendarClock,
      tile: "bg-orange-50 text-orange-800",
      items: groups.expiring,
    },
  ];
  const sections = allSections.filter((section) => section.items.length > 0);

  const attentionTotal = sections.reduce(
    (total, section) => total + section.items.length,
    0,
  );

  const handlePrimaryAction = (item: AlertItem) => {
    if (item.kind === "vencido") {
      const expired = getExpiredUnits(item.product);
      openMovementForm("salida", item.product.id, {
        reason: "vencido",
        quantity: expired > 0 ? expired : item.product.quantity,
      });
      return;
    }
    if (item.kind === "agotado" || item.kind === "stock-bajo") {
      openMovementForm("entrada", item.product.id);
      return;
    }
    openProductDetail(item.product.id);
  };

  const actionLabel = (kind: AlertKind) => {
    if (kind === "vencido") return "Sacar del inventario";
    if (kind === "agotado" || kind === "stock-bajo") return "Recibir mercancía";
    return "Ver producto";
  };

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-brand-800">
          {settings.businessName}
        </p>
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[32px]">
          ¡{greeting()}
          {settings.ownerName ? `, ${settings.ownerName}` : ""}!
        </h1>
        <p className="mt-1 text-[15px] text-slate-700">
          {formatLongDate()}
        </p>
      </header>

      <section aria-labelledby="home-actions-title">
        <h2
          id="home-actions-title"
          className="text-[22px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl"
        >
          ¿Qué necesitas hacer hoy?
        </h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => openMovementForm("entrada")}
            className="flex min-h-[80px] items-center gap-3.5 rounded-xl bg-brand-800 px-4 py-3.5 text-left text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 active:bg-brand-950"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/15">
              <ArrowDownToLine className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold leading-tight">
                Llegó mercancía
              </span>
              <span className="mt-0.5 block text-sm text-brand-50">
                Anota lo que recibiste
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => openMovementForm("salida")}
            className="flex min-h-[80px] items-center gap-3.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3.5 text-left transition hover:border-amber-400 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-amber-700 text-white">
              <ArrowUpFromLine className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold leading-tight text-amber-950">
                Salió mercancía
              </span>
              <span className="mt-0.5 block text-sm text-amber-900">
                Anota lo que salió
              </span>
            </span>
          </button>

          <Link
            to="/inventario"
            className="flex min-h-[80px] items-center gap-3.5 rounded-xl border-2 border-slate-300 bg-white px-4 py-3.5 text-left transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
              <Package className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold leading-tight text-slate-900">
                Revisar productos
              </span>
              <span className="mt-0.5 block text-sm text-slate-600">
                Mira qué tienes y qué falta
              </span>
            </span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="attention-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2
            id="attention-title"
            className="text-xl font-extrabold tracking-tight text-slate-900"
          >
            Necesitan tu atención
          </h2>
          {attentionTotal > 0 ? (
            <p className="text-sm font-medium text-slate-600">
              {attentionTotal}{" "}
              {attentionTotal === 1 ? "producto" : "productos"} por revisar
            </p>
          ) : null}
        </div>

        {sections.length === 0 ? (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-brand-800" />
            <div>
              <p className="text-base font-bold text-brand-900">
                Todo está al día
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-brand-900">
                No tienes productos vencidos, agotados ni por vencer.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {sections.map((section) => {
              const Icon = section.icon;
              const visible = section.items.slice(0, 3);
              return (
                <div
                  key={section.kind}
                  className="overflow-hidden rounded-xl border border-slate-300 bg-white"
                >
                  <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                        section.tile,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="min-w-0 flex-1 text-base font-bold text-slate-900">
                      {section.title}
                    </h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums text-slate-800">
                      {section.items.length}
                    </span>
                  </div>

                  <ul className="divide-y divide-slate-200">
                    {visible.map((item) => (
                      <li key={item.product.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <ProductIcon product={item.product} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold leading-snug text-slate-900">
                              {item.product.name}
                            </p>
                            <p className="mt-0.5 text-sm leading-snug text-slate-600">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 pl-11">
                          <Button
                            size="sm"
                            variant={
                              item.kind === "vencido" ? "danger" : "secondary"
                            }
                            onClick={() => handlePrimaryAction(item)}
                          >
                            {actionLabel(item.kind)}
                          </Button>
                          {item.kind !== "por-vencer" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openProductDetail(item.product.id)}
                            >
                              Ver producto
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {section.items.length > visible.length ? (
                    <Link
                      to="/alertas"
                      className="flex min-h-[48px] items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold text-brand-900 transition hover:bg-slate-100"
                    >
                      Ver los {section.items.length} productos
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  ) : null}
                </div>
              );
            })}

            <Link
              to="/alertas"
              className="flex min-h-[52px] items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-4 text-[15px] font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Ver todas las alertas
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="secondary-title">
        <h2
          id="secondary-title"
          className="text-base font-bold text-slate-700"
        >
          Para revisar con calma
        </h2>
        <div className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Link
            to="/estadisticas"
            className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-slate-900">
                Valor de tu mercancía
              </span>
              <span className="block text-sm text-slate-600">
                Lo que tienes disponible hoy
              </span>
            </span>
            <span className="shrink-0 text-[15px] font-bold tabular-nums text-slate-900">
              {formatCurrency(summary.inventoryValue)}
            </span>
          </Link>

          <Link
            to="/estadisticas"
            className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-slate-900">
                Lo que más se vende
              </span>
              <span className="block truncate text-sm text-slate-600">
                {topProduct
                  ? topProduct.name
                  : "Todavía no hay ventas registradas"}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
          </Link>

          <Link
            to="/movimientos"
            className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-slate-900">
                Entradas y salidas
              </span>
              <span className="block text-sm text-slate-600">
                Mira todo lo que has registrado
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
          </Link>
        </div>
      </section>
    </div>
  );
}
