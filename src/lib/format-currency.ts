/** "9,750.00 ETB" -- the one money-formatting function, so every tab shows figures the same way. */
export function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
