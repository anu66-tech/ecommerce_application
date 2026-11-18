import { requestApi } from '@/shared/api/client.js'

export function fetchProductByIdApi(id, { signal } = {}) {
  return requestApi(`/products/${encodeURIComponent(id)}`, { signal })
}

export function addToCartApi(productId, quantity = 1) {
  return requestApi('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })
}

export function addToWishlistApi(productId) {
  return requestApi('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
}
