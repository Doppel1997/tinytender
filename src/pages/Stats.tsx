import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleDollarSign,
  Info,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "../context/StoreContext";
import { useUI } from "../context/UIContext";
import {
  getInventorySummary,
  getLossSummary,
  getLowRotationProducts,
  getMovementBuckets,
  getPeriodTotals,
  getTopMovedProducts,
} from "../lib/inventory";
import { formatCurrency, formatNumber } from "../lib/format";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/SectionCard";
import { Segmented } from "../components/ui/Segmented";
import { ProductIcon } from "../components/ProductIcon";

type Period = "7" | "30" | "90";

const PERIOD_DAYS: Record<Period, number> = { "7": 7, "30": 30, "90": 90 };

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "brand" | "amber" | "neutral" | "red";
}

const TONE: Record<MetricProps["tone"], { tile: string; value: string }> = {
  brand: { tile: "bg-brand-50 text-brand-800", value: "text-brand-900" },
  amber: { tile: "bg-amber-50 text-amber-800", value: "text-amber-900" },
  neutral: { tile: "bg-slate-100 text-slate-700", value: "text-slate-900" },
  red: { tile: "bg-red-50 text-red-700", value: "text-red-800" },
};

function Metric({ icon: Icon, label, value, detail, tone }: MetricProps) {
  const style = TONE[tone];
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4">
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-lg",
          style.tile,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-2.5 text-sm font-medium text-slate-700">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-[22px] font-extrabold leading-tight tabular-nums sm:text-[26px]",
          style.value,
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-sm leading-snug text-slate-600">{detail}</p>
    </div>
  );
}

export function Stats() {
  const { products, movements, settings } = useStore();
  const { openProductForm } = useUI();
  const [period, setPeriod] = useState<Period>("30");
  const days = PERIOD_DAYS[period];

  const summary = getInventorySummary(products, settings.expiryWarningDays);
  const totals = getPeriodTotals(movements, days);
  const losses = getLossSummary(movements, days);
  const top = getTopMovedProducts(movements, products, days, "salida", 5, {
    salesOnly: true,
  });
  const low = getLowRotationProducts(products, movements, days, 5);
  const chartData = getMovementBuckets(movements, days);
  const periodLabel =
    days === 7 ? "los últimos 7 días" : `los últimos ${days} días`;

  if (products.length === 0) {
    return (
      <div>
        <PageHeader title="Cómo va mi negocio" />
        <EmptyState
          icon={Package}
          title="Todavía no hay información"
          description="Agrega productos y registra entradas y salidas. Aquí verás un resumen sencillo de tu tienda."
          action={
            <Button size="lg" onClick={() => openProductForm()}>
              Agregar producto
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cómo va mi negocio"
        subtitle="Un resumen sencillo de lo que pasa en tu tienda."
      />

      <Segmented
        value={period}
        onChange={setPeriod}
        ariaLabel="Elegir periodo"
        options={[
          { value: "7", label: "7 días" },
          { value: "30", label: "30 días" },
          { value: "90", label: "90 días" },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Metric
          icon={ArrowDownToLine}
          label="Recibiste"
          value={`${formatNumber(totals.entradas)}`}
          detail={`unidades en ${periodLabel}`}
          tone="brand"
        />
        <Metric
          icon={ArrowUpFromLine}
          label="Salieron"
          value={`${formatNumber(totals.salidas)}`}
          detail="unidades del inventario"
          tone="amber"
        />
        <Metric
          icon={CircleDollarSign}
          label="Mercancía disponible"
          value={formatCurrency(summary.inventoryValue)}
          detail={`${summary.totalProducts} productos · ${formatNumber(
            summary.totalUnits,
          )} unidades`}
          tone="neutral"
        />
        <Metric
          icon={TrendingDown}
          label="Pérdidas registradas"
          value={formatCurrency(losses.value)}
          detail={
            losses.units > 0
              ? `${losses.units} ${
                  losses.units === 1 ? "unidad" : "unidades"
                } · ${losses.movements} ${
                  losses.movements === 1 ? "registro" : "registros"
                }`
              : "Sin pérdidas en este periodo"
          }
          tone="red"
        />
      </div>

      <div className="mt-3 flex gap-2.5 rounded-xl border border-slate-300 bg-slate-50 p-3.5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
        <p className="text-sm leading-relaxed text-slate-700">
          Una salida no siempre es una venta. Solo contamos como ventas las que
          registraste con el motivo «Venta». Las demás se muestran como
          pérdidas.
        </p>
      </div>

      <section aria-labelledby="trend-title" className="mt-7">
        <h2
          id="trend-title"
          className="text-xl font-extrabold tracking-tight text-slate-900"
        >
          Entradas y salidas
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Cuántas unidades entraron y salieron en {periodLabel}.
        </p>
        <div
          className="mt-3 rounded-xl border border-slate-300 bg-white p-3 sm:p-4"
          role="img"
          aria-label={`Gráfico de entradas y salidas en ${periodLabel}. Recibiste ${totals.entradas} unidades y salieron ${totals.salidas} unidades.`}
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#475569" }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 14 }} />
                <Bar
                  dataKey="entradas"
                  name="Entradas"
                  fill="#166534"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="salidas"
                  name="Salidas"
                  fill="#b45309"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="top-title">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-800" />
            <h2
              id="top-title"
              className="text-xl font-extrabold tracking-tight text-slate-900"
            >
              Lo que más sale
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            Productos que vendiste más en {periodLabel}.
          </p>
          {top.length === 0 ? (
            <p className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-4 text-sm text-slate-700">
              Todavía no hay ventas registradas en este periodo.
            </p>
          ) : (
            <ol className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-300 bg-white">
              {top.map((item, index) => (
                <li
                  key={item.key}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="w-5 shrink-0 text-sm font-bold tabular-nums text-slate-600">
                    {index + 1}
                  </span>
                  {item.product ? (
                    <ProductIcon product={item.product} size="xs" />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      <Boxes className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-slate-900">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-[15px] font-bold tabular-nums text-slate-900">
                    {item.quantity}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="low-title">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-800" />
            <h2
              id="low-title"
              className="text-xl font-extrabold tracking-tight text-slate-900"
            >
              Lo que menos sale
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            Productos que casi no se han vendido en {periodLabel}.
          </p>
          <ol className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-300 bg-white">
            {low.map((item) => (
              <li
                key={item.product.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <ProductIcon product={item.product} size="xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-slate-900">
                    {item.product.name}
                  </span>
                  <span className="block text-sm text-slate-600">
                    {item.quantity === 0
                      ? "Sin ventas en este periodo"
                      : `${item.quantity} ${
                          item.quantity === 1 ? "unidad vendida" : "unidades vendidas"
                        }`}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-slate-600">
                  Tienes {item.product.quantity}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-slate-600">
        Los valores en pesos son estimaciones calculadas con los precios que
        registraste. No son ingresos ni información contable.
        {summary.totalProducts > 0
          ? ` Tienes ${summary.totalProducts} productos diferentes.`
          : ""}
      </p>
    </div>
  );
}
