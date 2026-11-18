import { requestApi } from '@/shared/api/client.js'

export function fetchDashboardOrdersApi(query = {}, { signal } = {}) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  return requestApi(`/orders?${params}`, { signal })
}

export function fetchDashboardProductsApi(filters = {}, { signal } = {}) {
  const query = new URLSearchParams()
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  return requestApi(`/products?${query}`, { signal })
}

export function fetchDashboardInventoryApi(query = {}, { signal } = {}) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  return requestApi(`/inventory?${params}`, { signal })
}

export async function fetchDashboardOverviewApi(options = {}) {
  const [orders, products, inventory] = await Promise.all([
    fetchDashboardOrdersApi({}, options),
    fetchDashboardProductsApi({ limit: 100 }, options),
    fetchDashboardInventoryApi({}, options),
  ])
  return { orders, products, inventory }
}
