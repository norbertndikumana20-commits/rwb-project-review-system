/*
 * RWB Theme Provider — fetches app settings from /admin/settings
 * and applies theme colors as CSS custom properties on :root.
 *
 * Any admin can change colors in App Management → Appearance,
 * and the entire app updates instantly without a page reload.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api'

const ThemeContext = createContext({})

/**
 * Default theme values — used when settings haven't loaded yet
 * or when the user is not an admin.
 */
const DEFAULTS = {
  'app.theme.primary': '#1F3A5F',
  'app.theme.background': '#F7F6F3',
  'app.theme.accent': '#4A7C59',
  'app.theme.sidebar': '#0f1a2e',
}

/**
 * Maps app settings keys → CSS custom property names.
 * These override the Tailwind @theme defaults at runtime.
 */
const CSS_MAP = {
  'app.theme.primary':   '--color-accent',
  'app.theme.background':'--color-paper',
  'app.theme.accent':    '--color-sage',
  'app.theme.sidebar':   '--color-sidebar',
}

/**
 * Derive lighter/darker variants from a hex color for
 * the accent and sage families.
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function lighten(hex, amount = 0.9) {
  const { r, g, b } = hexToRgb(hex)
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  return `rgb(${lr},${lg},${lb})`
}

function darken(hex, amount = 0.2) {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

function applyTheme(settings) {
  const root = document.documentElement
  const vals = { ...DEFAULTS, ...settings }

  // Apply each mapped CSS variable
  for (const [key, cssVar] of Object.entries(CSS_MAP)) {
    const hex = vals[key] || DEFAULTS[key]
    if (hex) root.style.setProperty(cssVar, hex)
  }

  // Derive accent variants (primary color)
  const primary = vals['app.theme.primary'] || DEFAULTS['app.theme.primary']
  root.style.setProperty('--color-accent-dark', darken(primary, 0.2))
  root.style.setProperty('--color-accent-soft', lighten(primary, 0.9))

  // Derive brand from primary (auth surfaces use brand blue)
  root.style.setProperty('--color-brand', primary)
  root.style.setProperty('--color-brand-dark', darken(primary, 0.15))
  root.style.setProperty('--color-brand-soft', lighten(primary, 0.92))

  // Derive sage variants from accent color
  const accent = vals['app.theme.accent'] || DEFAULTS['app.theme.accent']
  root.style.setProperty('--color-sage-dark', darken(accent, 0.15))
  root.style.setProperty('--color-sage-light', lighten(accent, 0.88))

  // Derive water-blue from primary (auth pages)
  root.style.setProperty('--color-water-blue', primary)
  root.style.setProperty('--color-water-sky', lighten(primary, 0.15))
  root.style.setProperty('--color-water-sky-light', lighten(primary, 0.35))

  // Derive background variants
  const bg = vals['app.theme.background'] || DEFAULTS['app.theme.background']
  root.style.setProperty('--color-canvas', bg)
  root.style.setProperty('--color-paper-dark', darken(bg, 0.04))
  root.style.setProperty('--color-paper-darker', darken(bg, 0.08))

  // Set sidebar CSS variable (used in AppShell via style attribute)
  root.style.setProperty('--color-sidebar', vals['app.theme.sidebar'] || DEFAULTS['app.theme.sidebar'])
}

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Fetch settings once on mount — available to all authenticated users
    // but only admins can change them.
    let cancelled = false
    api('/admin/settings')
      .then((res) => {
        if (!cancelled) {
          const s = res?.settings || {}
          setSettings(s)
          applyTheme(s)
          setLoaded(true)
        }
      })
      .catch(() => {
        // Not authenticated or endpoint unavailable — use defaults
        if (!cancelled) {
          applyTheme(DEFAULTS)
          setLoaded(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Re-apply theme when settings change (e.g. after admin saves)
  function refresh(newSettings) {
    setSettings(newSettings)
    applyTheme(newSettings)
  }

  return (
    <ThemeContext.Provider value={{ settings, refresh, loaded }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
