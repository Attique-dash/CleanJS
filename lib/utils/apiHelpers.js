export function ok(data) {
  return { success: true, data };
}

export function fail(error, code) {
  return { success: false, error: String(error), code };
}

export function parseQueryInt(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}


