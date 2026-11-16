import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCircle2,
  PackageMinus,
  PackageX,
  TriangleAlert,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useUI } from "../context/UIContext";
import {
  getAlertGroups,
  getExpiredUnits,
  type AlertItem,
  type AlertKind,
} from "../lib/inventory";
import { unitFor } from "../types";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { ProductIcon } from "../components/ProductIcon";

interface AlertSection {
  kind: AlertKind;
  title: string;
  message: string;
  icon: LucideIcon;
  tile: string;
  bar: string;
  items: AlertItem[];
  primaryLabel: string;
}

export function Alerts() {
  const { products, settings } = useStore();
  const { openMovementForm, openProductDetail } = useUI();

  const groups = getAlertGroups(products, settings.expiryWarningDays);
  const allSections: AlertSection[] = [
    {
      kind: "vencido",
      title: "Productos vencidos",
      message: "Sácalos del inventario para no confundirlos con lo que sí puedes vender.",
      icon: TriangleAlert,
      tile: "bg-red-100 text-red-800",
      bar: "bg-red-700",
      items: groups.expired,
      primaryLabel: "Sacar del inventario",
    },
    {
      kind: "agotado",
      title: "Productos agotados",
      message: "Ya no tienes unidades disponibles.",
      icon: PackageX,
      tile: "bg-red-50 text-red-700",
      bar: "bg-red-500",
      items: groups.outOfStock,
      primaryLabel: "Recibir mercancía",
    },
    {
      kind: "stock-bajo",
      title: "Productos con pocas unidades",
      message: "Es momento de comprar para no quedarte sin mercancía.",
      icon: PackageMinus,
      tile: "bg-amber-50 text-amber-800",
      bar: "bg-amber-500",
      items: groups.lowStock,
      primaryLabel: "Recibir mercancía",
    },
    {
      kind: "por-vencer",
      title: "Productos próximos a vencer",
      message: "Trata de venderlos primero.",
      icon: CalendarClock,
      tile: "bg-orange-50 text-orange-800",
      bar: "bg-orange-500",
      items: groups.expiring,
      primaryLabel: "Ver producto",
    },
  ];
  const sections = allSections.filter((section) => section.items.length > 0);

  const total = sections.reduce((sum, section) => sum + section.items.length, 0);

  const handlePrimary = (section: AlertSection, item: AlertItem) => {
    if (section.kind === "vencido") {
      const expired = getExpiredUnits(item.product);
      openMovementForm("salida", item.product.id, {
        reason: "vencido",
        quantity: expired > 0 ? expired : item.product.quantity,
      });
      return;
    }
    if (section.kind === "agotado" || section.kind === "stock-bajo") {
      openMovementForm("entrada", item.product.id);
      return;
    }
    openProductDetail(item.product.id);
  };

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle="Lo que necesitas revisar para no perder mercancía."
      />

      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p className="mb-4 text-base font-medium text-slate-800">
            {total === 1
              ? "1 producto necesita tu atención."
              : `${total} productos necesitan tu atención.`}
          </p>

          <div className="space-y-5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.kind} aria-labelledby={`alert-${section.kind}`}>
                  <div className="mb-2 flex items-start gap-3">
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                        section.tile,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2
                        id={`alert-${section.kind}`}
                        className="text-lg font-extrabold leading-tight text-slate-900"
                      >
                        {section.title}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {section.message}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold tabular-nums text-slate-800">
                      {section.items.length}
                    </span>
                  </div>

                  <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-300 bg-white">
                    {section.items.map((item) => {
                      const batchExpiry =
                        item.daysToExpiry !== null
                          ? item.daysToExpiry
                          : null;
                      return (
                        <li key={item.product.id} className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <ProductIcon product={item.product} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-bold leading-snug text-slate-900">
                                {item.product.name}
                              </p>
                              <p className="mt-0.5 text-sm leading-snug text-slate-700">
                                {item.reason}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Tienes {item.product.quantity}{" "}
                                {unitFor(
                                  item.product.unit,
                                  item.product.quantity,
                                )}
                                {batchExpiry !== null && batchExpiry >= 0
                                  ? ` · quedan ${batchExpiry} ${
                                      batchExpiry === 1 ? "día" : "días"
                                    }`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
                            <Button
                              size="sm"
                              variant={
                                section.kind === "vencido"
                                  ? "danger"
                                  : section.kind === "por-vencer"
                                    ? "outline"
                                    : "secondary"
                              }
                              onClick={() => handlePrimary(section, item)}
                            >
                              {section.primaryLabel}
                            </Button>
                            {section.primaryLabel !== "Ver producto" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  openProductDetail(item.product.id)
                                }
                              >
                                Ver producto
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-brand-200 bg-brand-50 px-5 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-xl bg-white text-brand-800 ring-1 ring-brand-200">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h2 className="mt-3 text-xl font-extrabold text-brand-900">
        Todo está al día
      </h2>
      <p className="mt-1 max-w-sm text-base leading-relaxed text-brand-900">
        No tienes productos vencidos, agotados, con pocas unidades ni próximos a
        vencer.
      </p>
    </div>
  );
}
