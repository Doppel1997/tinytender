import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  LayoutDashboard,
  Package,
  Settings,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/inventario", label: "Productos", icon: Package },
  {
    to: "/movimientos",
    label: "Entradas y salidas",
    shortLabel: "Entradas\ny salidas",
    icon: ArrowLeftRight,
  },
  { to: "/alertas", label: "Alertas", icon: BellRing, badge: true },
  {
    to: "/estadisticas",
    label: "Cómo va mi negocio",
    shortLabel: "Cómo va\nmi negocio",
    icon: BarChart3,
  },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(
  (item) => item.to !== "/configuracion",
);
