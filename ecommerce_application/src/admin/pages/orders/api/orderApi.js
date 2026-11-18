import { requestApi } from '@/shared/api/client.js'

export function fetchOrdersApi(query = {}, { signal } = {}) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  return requestApi(`/orders?${params}`, { signal })
}

export function updateOrderStatusApi(id, status) {
  return requestApi(`/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function fetchOrderByIdApi(id, { signal } = {}) {
  return requestApi(`/orders/${encodeURIComponent(id)}`, { signal })
}
