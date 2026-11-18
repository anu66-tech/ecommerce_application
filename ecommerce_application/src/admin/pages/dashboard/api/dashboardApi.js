import {
  fetchOrdersApi,
  fetchProducts,
  fetchInventoryApi,
  fetchCategoriesApi,
} from '@/api/backend.js'

export {
  fetchOrdersApi,
  fetchProducts,
  fetchInventoryApi,
  fetchCategoriesApi,
}

export async function fetchDashboardOverviewApi(options = {}) {
  const [orders, products, inventory] = await Promise.all([
    fetchOrdersApi({}, options),
    fetchProducts({ limit: 100 }, options),
    fetchInventoryApi({}, options),
  ])
  return { orders, products, inventory }
}
