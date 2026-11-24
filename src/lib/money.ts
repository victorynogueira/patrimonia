const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const compact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

/** Converte um valor digitado (1234,56 | 1.234,56 | 1234.56) em centavos inteiros. */
export function parseMoneyInput(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const raw = value.trim().replace(/[^\d.,-]/g, "");
  if (!raw) return 0;
  const negative = raw.startsWith("-");
  const digits = raw.replace("-", "");
  const hasComma = digits.includes(",");
  const normalized = hasComma
    ? digits.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+(\.\d{1,2})?$/.test(digits)
      ? digits.replace(/\.(?=\d{3}(\D|$))/g, "").replace(/\.(\d{1,2})$/, ".$1")
      : digits;
  const cents = Math.round(Number(normalized) * 100);
  return negative ? -cents : cents;
}

export function formatMoney(cents: number) {
  return brl.format(cents / 100);
}

export function formatMoneyCompact(cents: number) {
  return compact.format(cents / 100);
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`;
}

export function variationPercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}
