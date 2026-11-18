export function makeId(prefix = 'id') {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`
}

export function checkoutUrl(productId, quantity = 1, fromCart = false) {
  const params = new URLSearchParams({
    buyNow: productId,
    quantity: String(quantity),
  })
  if (fromCart) params.set('fromCart', '1')
  return `/checkout/address?${params.toString()}`
}
