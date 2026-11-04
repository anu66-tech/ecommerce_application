const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/\/$/, '');

async function requestStore(path, options = {}) {
  const response = await fetch(`${backendUrl}/store${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Backend data request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

export async function checkBackendHealth({ signal } = {}) {
  const response = await fetch(`${backendUrl}/health`, { signal });
  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status}).`);
  }

  const result = await response.json();
  if (result.status !== 'ok') {
    throw new Error('Backend returned an unexpected health response.');
  }

  return result;
}

export function initializeBackendStore(store) {
  return requestStore('/initialize', {
    method: 'PUT',
    body: JSON.stringify({ store }),
  });
}

export async function fetchProducts(filters = {}, { signal } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`${backendUrl}/products?${query}`, { signal });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Product request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

export function searchProducts(searchTerm, filters = {}, { signal } = {}) {
  return fetchProducts({ ...filters, q: searchTerm }, { signal });
}

export function saveBackendStoreValue(key, value) {
  return requestStore(`/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}
