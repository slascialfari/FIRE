const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatEUR(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return currencyFormatter.format(value);
}

export function formatEURCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return compactCurrencyFormatter.format(value);
}
