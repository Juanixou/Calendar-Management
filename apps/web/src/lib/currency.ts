const formatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}
