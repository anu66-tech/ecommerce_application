import {
  subscribeNewsletterApi,
  fetchProducts,
  fetchCategoriesApi,
} from '@/api/backend.js'

export { subscribeNewsletterApi }

export async function fetchHomeProductsApi(filters = { limit: 50 }, options = {}) {
  return fetchProducts(filters, options)
}

export async function fetchHomeCategoriesApi(options = {}) {
  return fetchCategoriesApi(options)
}
