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

export function customerLoginApi({ email, password }) {
  return requestApi('/auth/customer/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function customerRegisterApi({ name, email, password }) {
  return requestApi('/auth/customer/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function updateCustomerProfileApi(profileData) {
  return requestApi('/auth/customer/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

export function logoutApi(type = 'customer') {
  return requestApi('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}
