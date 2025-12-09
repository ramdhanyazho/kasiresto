const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export function formatIDR(value: number) {
  return formatter.format(value);
}

export function formatDate(value: string | number | Date) {
  const date = new Date(value);
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
