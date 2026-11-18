export const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/\/$/, '')

// ----------------- JWT Token & Session Management (1 Hour) -----------------
export function getAuthToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('jwt_token')
      const expiresAt = Number(window.localStorage.getItem('jwt_expires_at') || 0)
      if (token && expiresAt && Date.now() > expiresAt) {
        clearAuthToken()
        window.dispatchEvent(new CustomEvent('session-expired', { detail: { reason: '1-hour timeout' } }))
        return null
      }
      return token
    }
  } catch (e) {
    console.warn('Error reading auth token:', e)
  }
  return null
}

export function setAuthToken(token, expiresInSeconds = 3600) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        const expiresAt = Date.now() + expiresInSeconds * 1000
        window.localStorage.setItem('jwt_token', token)
        window.localStorage.setItem('jwt_expires_at', String(expiresAt))
      } else {
        clearAuthToken()
      }
    }
  } catch (e) {
    console.warn('Error saving auth token:', e)
  }
}

export function clearAuthToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('jwt_token')
      window.localStorage.removeItem('jwt_expires_at')
    }
  } catch (err) {
    void err
  }
}

export function getTokenTimeRemaining() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const expiresAt = Number(window.localStorage.getItem('jwt_expires_at') || 0)
      if (!expiresAt) return 0
      return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    }
  } catch (err) {
    void err
  }
  return 0
}

const inflightRequests = new Map()

// ----------------- HTTP Client with Interceptor Pipeline -----------------
class InterceptorManager {
  constructor() {
    this.handlers = []
  }

  use(fulfilled, rejected) {
    this.handlers.push({ fulfilled, rejected })
    return this.handlers.length - 1
  }

  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null
    }
  }
}

export const apiClient = {
  interceptors: {
    request: new InterceptorManager(),
    response: new InterceptorManager(),
  },

  async request(path, options = {}) {
    let config = { path, ...options }

    // 1. Run Request Interceptors
    for (const handler of this.interceptors.request.handlers) {
      if (handler?.fulfilled) {
        config = await handler.fulfilled(config)
      }
    }

    // 2. In-flight Deduplication Guard for concurrent GET requests
    const method = (config.method || 'GET').toUpperCase()
    const isGet = method === 'GET'
    const authHeader = config.headers?.Authorization || 'anon'
    const cacheKey = isGet ? `${authHeader}:${config.path}` : null

    if (cacheKey && inflightRequests.has(cacheKey)) {
      return inflightRequests.get(cacheKey)
    }

    const fetchPromise = (async () => {
      let response
      try {
        response = await fetch(`${backendUrl}${config.path}`, config)
      } catch (networkError) {
        let transformedError = networkError
        for (const handler of this.interceptors.response.handlers) {
          if (handler?.rejected) {
            transformedError = (await handler.rejected(transformedError).catch((e) => e)) || transformedError
          }
        }
        throw transformedError
      }

      // 3. Run Response Interceptors (success & HTTP error handling)
      let result = response
      for (const handler of this.interceptors.response.handlers) {
        if (!response.ok && handler?.rejected) {
          result = await handler.rejected(result)
        } else if (response.ok && handler?.fulfilled) {
          result = await handler.fulfilled(result)
        }
      }

      return result
    })()

    if (cacheKey) {
      if (config.signal) {
        config.signal.addEventListener('abort', () => {
          inflightRequests.delete(cacheKey)
        }, { once: true })
      }
      inflightRequests.set(cacheKey, fetchPromise)
      fetchPromise.finally(() => {
        inflightRequests.delete(cacheKey)
      })
    }

    return fetchPromise
  },
}

// [REQUEST INTERCEPTOR]: Attach Authorization Token, Content-Type & Cache Headers
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...config.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return {
    ...config,
    headers,
    cache: config.cache ?? 'no-store',
  }
})

// [RESPONSE INTERCEPTOR 1]: Global 401 Unauthorized / Session Timeout Handling
apiClient.interceptors.response.use(
  (response) => response,
  (responseOrError) => {
    if (responseOrError?.status === 401) {
      clearAuthToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('session-expired', { detail: { reason: 'unauthorized' } })
        )
      }
    }
    return responseOrError
  }
)

// [RESPONSE INTERCEPTOR 2]: Unpack JSON or Throw Formatted API Error
apiClient.interceptors.response.use(
  async (response) => {
    return response.json()
  },
  async (responseOrError) => {
    if (responseOrError && typeof responseOrError.text === 'function') {
      const detail = await responseOrError.text()
      const err = new Error(`API request failed (${responseOrError.status}): ${detail}`)
      err.status = responseOrError.status
      throw err
    }
    throw responseOrError
  }
)

export async function requestApi(path, options = {}) {
  return apiClient.request(path, options)
}

export async function checkBackendHealth({ signal } = {}) {
  const response = await fetch(`${backendUrl}/health`, { signal, cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status}).`)
  }

  const result = await response.json()
  if (result.status !== 'ok') {
    throw new Error('Backend returned an unexpected health response.')
  }

  return result
}

// ----------------- Store bootstrap -----------------
export function initializeBackendStore(store) {
  return requestApi('/store/initialize', {
    method: 'PUT',
    body: JSON.stringify({ store }),
  })
}

export function saveBackendStoreValue(key, value) {
  return requestApi(`/store/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  })
}
