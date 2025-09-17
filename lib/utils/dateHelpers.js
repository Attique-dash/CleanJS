export function toISO(input) {
  if (!input) return new Date().toISOString();
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  return d.toISOString();
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}


