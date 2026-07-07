export function formatCurrency(value, currency = 'TZS') {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-TZ').format(Number(value) || 0);
}
