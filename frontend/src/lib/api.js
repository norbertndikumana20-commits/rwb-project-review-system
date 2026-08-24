const TOKEN_KEY = 'rwb.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/**
 * Thin fetch wrapper. Throws ApiError with the server's message on failure.
 * Pass a FormData instance as `body` to send multipart (Content-Type is then
 * left for the browser to set, including the boundary).
 */
export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const isForm = body instanceof FormData
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (res.status === 401 && !path.startsWith('/auth/')) {
    // Session expired/revoked mid-use — sign out centrally and return to the gate.
    setToken(null)
    window.location.assign('/signin')
    throw new ApiError('Session expired. Please sign in again.', 401)
  }

  if (!res.ok) {
    throw new ApiError(data?.message || res.statusText || 'Request failed', res.status)
  }
  return data
}

/** Fetches a binary resource (e.g. an attachment) as a Blob, authenticated. */
export async function apiBlob(path) {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let message = res.statusText || 'Request failed'
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      /* non-JSON body */
    }
    throw new ApiError(message, res.status)
  }
  return res.blob()
}
