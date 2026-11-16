const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

/** "$ 7.000" — pesos colombianos, sin decimales. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Normaliza texto para búsquedas sin tildes ni mayúsculas. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
