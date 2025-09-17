// Tasoko API client configuration

export const TASOKO_ENDPOINTS = {
  customers: '/tasoko/customers',
  packages: '/tasoko/packages',
  manifests: '/tasoko/manifest',
};

export function getTasokoHeaders(apiToken) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
  };
}


