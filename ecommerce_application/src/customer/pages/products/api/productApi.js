import { requestApi } from '@/shared/api/client.js'

export async function fetchProducts(filters = {}, { signal } = {}) {
  const query = new URLSearchParams()
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return requestApi(`/products?${query}`, { signal })
}

export function searchProducts(searchTerm, filters = {}, { signal } = {}) {
  return fetchProducts({ ...filters, q: searchTerm }, { signal })
}

export function fetchProductByIdApi(id, { signal } = {}) {
  return requestApi(`/products/${encodeURIComponent(id)}`, { signal })
}

export function fetchCategoriesApi({ signal } = {}) {
  return requestApi('/categories', { signal })
}
