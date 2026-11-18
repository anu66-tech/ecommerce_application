import { requestApi } from '@/shared/api/client.js'

export function subscribeNewsletterApi(email) {
  return requestApi('/store/newsletter', {
    method: 'PUT',
    body: JSON.stringify({ value: email }),
  })
}

export function fetchHomeProductsApi(filters = { limit: 50 }, { signal } = {}) {
  const query = new URLSearchParams()
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return requestApi(`/products?${query}`, { signal })
}

export function fetchHomeCategoriesApi({ signal } = {}) {
  return requestApi('/categories', { signal })
}
