export function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function formatNumber(value: number, digits = 1) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
}
