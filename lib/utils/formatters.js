export function formatWeight(kg) {
  return `${(kg ?? 0).toFixed(2)} kg`;
}

export function formatDate(value) {
  if (!value) return '';
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  return d.toLocaleString();
}

export function maskEmail(email) {
  if (!email) return '';
  const [name, domain] = String(email).split('@');
  return `${name?.slice(0, 2)}***@${domain}`;
}


