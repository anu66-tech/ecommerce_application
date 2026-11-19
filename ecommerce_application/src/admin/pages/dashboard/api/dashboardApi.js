import { requestApi } from '@/shared/api/client.js'

// Strictly 1 API call to load complete dashboard overview data
export function fetchDashboardOverviewApi({ signal } = {}) {
  return requestApi('/store', { signal })
}
