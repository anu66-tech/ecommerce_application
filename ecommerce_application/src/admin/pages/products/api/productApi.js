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

export function createProductApi(productData) {
  return requestApi('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  })
}

export function updateProductApi(id, productData) {
  return requestApi(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(productData),
  })
}

export function deleteProductApi(id) {
  return requestApi(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchCategoriesApi({ signal } = {}) {
  return requestApi('/categories', { signal })
}
