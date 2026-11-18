import { requestApi } from '@/shared/api/client.js'

export function createOrderApi(orderData) {
  return requestApi('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}

export function clearCartApi() {
  return requestApi('/cart', {
    method: 'DELETE',
  })
}

export function fetchCartApi({ signal } = {}) {
  return requestApi('/cart', { signal })
}
