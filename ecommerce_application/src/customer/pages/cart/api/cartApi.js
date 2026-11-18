import { requestApi } from '@/shared/api/client.js'

export function fetchCartApi({ signal } = {}) {
  return requestApi('/cart', { signal })
}

export function addToCartApi(productId, quantity = 1) {
  return requestApi('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
}

export function updateCartQuantityApi(productId, quantity) {
  return requestApi(`/cart/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })
}

export function removeFromCartApi(productId) {
  return requestApi(`/cart/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
}

export function syncCartApi(items) {
  return requestApi('/cart', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export function clearCartApi() {
  return requestApi('/cart', {
    method: 'DELETE',
  })
}
