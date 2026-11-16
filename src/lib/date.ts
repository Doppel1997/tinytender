const MS_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Convierte una fecha local a YYYY-MM-DD sin pasar por UTC. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Acepta YYYY-MM-DD (fecha local) o un ISO completo con hora.
 * Evita que `new Date("2026-01-10")` se interprete como UTC.
 */
export function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Días de calendario entre hoy y la fecha. Negativo si ya pasó. */
export function daysUntil(value: string): number {
  const target = startOfDay(parseDate(value));
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / MS_DAY);
}

const shortDateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function clean(value: string): string {
  return value.replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/** "16 nov" */
export function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? parseDate(value) : value;
  return clean(shortDateFormatter.format(date));
}

/** "16 nov 2026" */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? parseDate(value) : value;
  return clean(dateFormatter.format(date));
}

/** "lunes, 16 de noviembre de 2026" */
export function formatLongDate(value: string | Date = new Date()): string {
  const date = typeof value === "string" ? parseDate(value) : value;
  return clean(longDateFormatter.format(date));
}

/** "9:15 a. m." */
export function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  // No quitamos los puntos de "a. m." / "p. m.".
  return timeFormatter.format(date).replace(/\s+/g, " ").trim();
}

export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return formatShortDate(date);
}

export function dayLabel(value: string): string {
  const date = parseDate(value);
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / MS_DAY,
  );
  if (diff === 0) return "Hoy";
  if (diff === -1) return "Ayer";
  return formatLongDay(date);
}

function formatLongDay(date: Date): string {
  const formatted = clean(
    new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(date),
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export function expiryLabel(days: number): string {
  if (days < -1) return `Venció hace ${Math.abs(days)} días`;
  if (days === -1) return "Venció ayer";
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}
