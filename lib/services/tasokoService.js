import { TASOKO_ENDPOINTS, getTasokoHeaders } from '../config/tasoko';

export async function pushPackageToTasoko(baseUrl, apiToken, payload) {
  const res = await fetch(baseUrl + TASOKO_ENDPOINTS.packages, {
    method: 'POST',
    headers: getTasokoHeaders(apiToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Tasoko package push failed: ${res.status}`);
  return res.json();
}

export async function pushManifestToTasoko(baseUrl, apiToken, payload) {
  const res = await fetch(baseUrl + TASOKO_ENDPOINTS.manifests, {
    method: 'POST',
    headers: getTasokoHeaders(apiToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Tasoko manifest push failed: ${res.status}`);
  return res.json();
}


