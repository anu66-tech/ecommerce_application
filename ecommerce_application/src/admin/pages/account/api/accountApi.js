import {
  requestApi,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getTokenTimeRemaining,
} from '@/shared/api/client.js'

export { getAuthToken, setAuthToken, clearAuthToken, getTokenTimeRemaining }

export function fetchAuthSessionApi({ signal } = {}) {
  return requestApi('/auth/me', { signal })
}

export function adminLoginApi({ email, username, password }) {
  const mail = email || username
  return requestApi('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: mail, username: mail, password }),
  })
}

export function unifiedLoginApi({ email, username, password, role = 'auto' }) {
  const mail = email || username
  return requestApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: mail, username: mail, password, role }),
  })
}

export function logoutApi(type = 'admin') {
  return requestApi('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}
