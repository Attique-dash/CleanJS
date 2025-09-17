export function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} is required`);
  return value.trim();
}

export function optionalString(value) {
  return typeof value === 'string' ? value.trim() : undefined;
}

export function requiredNumber(value, field) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`${field} must be a number`);
  return num;
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) throw new Error(`${field} must be one of ${allowed.join(', ')}`);
  return value;
}


