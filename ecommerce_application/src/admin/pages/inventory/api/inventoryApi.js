import { requestApi } from '@/shared/api/client.js'

export function fetchInventoryApi(query = {}, { signal } = {}) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  return requestApi(`/inventory?${params}`, { signal })
}

export function updateInventoryStockApi(id, stock) {
  return requestApi(`/inventory/${encodeURIComponent(id)}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  })
}
