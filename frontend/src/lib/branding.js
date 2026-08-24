import { api } from './api'

/**
 * Fetches the active admin-managed branding images for a surface.
 * kind = 'LANDING' (public landing slideshow) or 'AUTH' (auth-page background).
 * Public endpoint — no session required. Never throws; callers get [] on failure
 * so the pages degrade gracefully (CSS-only backdrop).
 */
export async function fetchBranding(kind) {
  try {
    const list = await api(`/branding?kind=${encodeURIComponent(kind)}`)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}
