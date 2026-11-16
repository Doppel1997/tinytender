import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppShell } from "./components/layout/AppShell";
import { ModalHost } from "./components/modals/ModalHost";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { Movements } from "./pages/Movements";
import { Alerts } from "./pages/Alerts";
import { SettingsPage } from "./pages/Settings";

// Recharts solo se carga al entrar a Estadísticas para aligerar la carga inicial.
const Stats = lazy(() =>
  import("./pages/Stats").then((module) => ({ default: module.Stats })),
);

function StatsFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
        Cargando estadísticas…
      </p>
    </div>
  );
}

export function App() {
  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="inventario" element={<Inventory />} />
          <Route path="movimientos" element={<Movements />} />
          <Route path="alertas" element={<Alerts />} />
          <Route
            path="estadisticas"
            element={
              <Suspense fallback={<StatsFallback />}>
                <Stats />
              </Suspense>
            }
          />
          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ModalHost />
    </>
  );
}
