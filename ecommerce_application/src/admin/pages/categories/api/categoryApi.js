import { requestApi } from '@/shared/api/client.js'

export function fetchCategoriesApi({ signal } = {}) {
  return requestApi('/categories', { signal })
}

export function createCategoryApi(category) {
  return requestApi('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  })
}

export function updateCategoryApi(id, category) {
  return requestApi(`/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  })
}

export function deleteCategoryApi(id) {
  return requestApi(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
