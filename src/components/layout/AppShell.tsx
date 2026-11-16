import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { HardDrive, Settings } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { BUSINESS_TYPE_LABEL } from "../../types";
import { getInventorySummary } from "../../lib/inventory";
import { cn } from "../../lib/utils";
import { Logo } from "../ui/PageHeader";
import { MOBILE_NAV_ITEMS, NAV_ITEMS } from "./nav";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function AppShell() {
  const { settings, products } = useStore();
  const { pathname } = useLocation();
  const summary = getInventorySummary(products, settings.expiryWarningDays);
  const businessType = BUSINESS_TYPE_LABEL[settings.businessType];

  return (
    <div className="min-h-dvh bg-slate-50">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-base focus:font-semibold focus:text-brand-900 focus:shadow-lg"
      >
        Ir al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[72px] shrink-0 items-center gap-2.5 border-b border-slate-200 px-5">
          <Logo />
          <div>
            <p className="text-base font-extrabold leading-tight tracking-tight text-slate-900">
              Tienda Clara
            </p>
            <p className="text-[13px] leading-tight text-slate-600">
              Tu inventario al día
            </p>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[13px] font-semibold text-slate-600">
              Tu negocio
            </p>
            <p className="mt-1 truncate text-base font-bold text-slate-900">
              {settings.businessName}
            </p>
            <p className="truncate text-sm text-slate-600">
              {businessType}
              {settings.city ? ` · ${settings.city}` : ""}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
              <span className="text-sm font-medium text-slate-700">
                {summary.totalProducts}{" "}
                {summary.totalProducts === 1 ? "producto" : "productos"}
              </span>
              {summary.attentionCount > 0 ? (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[13px] font-bold text-amber-900">
                  {summary.attentionCount} por revisar
                </span>
              ) : (
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[13px] font-bold text-brand-800">
                  Todo al día
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Principal">
          <p className="px-2 pb-2 text-[13px] font-semibold text-slate-600">
            Menú
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group flex h-12 items-center gap-3 rounded-lg px-3 text-[15px] font-semibold transition",
                    isActive
                      ? "bg-brand-800 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-brand-50" : "text-slate-600",
                      )}
                      strokeWidth={2}
                    />
                    <span>{item.label}</span>
                    {item.badge && summary.attentionCount > 0 ? (
                      <span
                        className={cn(
                          "ml-auto rounded px-1.5 py-0.5 text-xs font-bold tabular-nums",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-900",
                        )}
                      >
                        {summary.attentionCount}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2.5">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
            <p className="text-[13px] leading-snug text-slate-600">
              Todo se guarda en este celular. No se envía a internet.
            </p>
          </div>
        </div>
      </aside>

      <main id="main-content" className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm lg:hidden">
          <div className="flex h-16 items-center gap-3 px-4">
            <Logo size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold leading-tight text-slate-900">
                {settings.businessName}
              </p>
              <p className="truncate text-[13px] leading-tight text-slate-600">
                {businessType}
                {settings.city ? ` · ${settings.city}` : ""}
              </p>
            </div>
            <Link
              to="/configuracion"
              aria-label="Configuración"
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition",
                pathname === "/configuracion"
                  ? "border-brand-700 bg-brand-50 text-brand-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1120px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="grid grid-cols-5">
          {MOBILE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[62px] flex-col items-center justify-center gap-1 border-t-2 px-1 pb-1.5 pt-2 transition active:bg-slate-100",
                  isActive
                    ? "border-brand-800 text-brand-900"
                    : "border-transparent text-slate-700",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <item.icon
                      className="h-[22px] w-[22px]"
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    {item.badge && summary.attentionCount > 0 ? (
                      <span className="absolute -right-2.5 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-700 px-1 text-[11px] font-bold leading-none text-white">
                        {summary.attentionCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="whitespace-pre-line text-center text-[12px] font-semibold leading-[1.15]">
                    {item.shortLabel ?? item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
