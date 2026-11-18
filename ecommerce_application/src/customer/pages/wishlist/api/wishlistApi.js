import { requestApi } from '@/shared/api/client.js'

export function fetchWishlistApi({ signal } = {}) {
  return requestApi('/wishlist', { signal })
}

export function addToWishlistApi(productId) {
  return requestApi('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
}

export function removeFromWishlistApi(productId) {
  return requestApi(`/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
}

export function syncWishlistApi(items) {
  return requestApi('/wishlist', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}
