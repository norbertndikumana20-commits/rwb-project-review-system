import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Bell,
  FileCheck2,
  FolderKanban,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'

const NAV = {
  base: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Project Track', icon: FolderKanban },
    { to: '/reviews', label: 'Reviews', icon: FileCheck2 },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ],
  adminOnly: [
    { to: '/app-management', label: 'App Management', icon: SlidersHorizontal },
  ],
  bottom: [
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/profile', label: 'Profile', icon: User },
  ],
}

const ROLE_LABELS = {
  ADMIN: 'System Administrator',
  EXTERNAL_USER: 'External User',
  REVIEWER: 'Reviewer',
  DIVISION_MANAGER: 'Division Manager',
  SUPER_REVIEWER: 'Super Reviewer',
}

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Project Track',
  '/reviews': 'Reviews',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/reports': 'Reports',
  '/app-management': 'App Management',
  '/users': 'Users',
  '/branding': 'Branding',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function NavItems({ unread, msgUnread, onNavigate, isAdmin }) {
  const items = [...NAV.base, ...(isAdmin ? NAV.adminOnly : [])]
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
      {items.map((item) => {
        const badge = item.to === '/notifications' ? unread : item.to === '/messages' ? msgUnread : 0
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive ? 'bg-white/[0.12] text-white shadow-[inset_3px_0_0_0_rgba(255,255,255,0.8)]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 font-mono text-[10px] font-semibold text-ink-900" aria-live="polite">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function AppShell({ children }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [msgUnread, setMsgUnread] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([api('/notifications?limit=50'), api('/messages/unread-count')])
      .then(([list, msgCount]) => {
        if (!cancelled) {
          if (Array.isArray(list)) setUnread(list.filter((n) => !n.read).length)
          if (typeof msgCount === 'number') setMsgUnread(msgCount)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const isAdmin = user?.role === 'ADMIN'
  const section = ROUTE_TITLES[location.pathname]
    || (location.pathname.startsWith('/projects/') ? 'Project' : null)
    || 'Ledger'
  const statusTone = user?.accountStatus === 'ACTIVE' ? 'text-sage' : 'text-amber'

  const sidebar = (
    <div className="flex h-full flex-col text-paper" style={{ backgroundColor: 'var(--color-sidebar, #0f1a2e)' }}>
      {/* Brand */}
      <div className="border-b border-white/10 px-5 pb-5 pt-6">
        <div className="flex items-center justify-center">
          <img
            src="/assets/rwb-logo-horizontal.png"
            alt="RWB Review — Project Review System"
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="mt-4 rounded-lg bg-white/[0.07] px-3.5 py-3">
          <p className="truncate text-[13px] font-semibold text-white">{user?.organizationName}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-white/50">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.05em]">
              <span className={`h-1.5 w-1.5 rounded-full ${user?.accountStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={user?.accountStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                {user?.accountStatus === 'ACTIVE' ? 'Active' : 'Pending'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <NavItems unread={unread} msgUnread={msgUnread} onNavigate={() => setMobileOpen(false)} isAdmin={isAdmin} />

      {/* Bottom nav */}
      <div className="border-t border-paper/10 px-3 py-3">
        {NAV.bottom.map((item) => (            <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive ? 'bg-white/[0.12] text-white shadow-[inset_3px_0_0_0_rgba(255,255,255,0.8)]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-all hover:bg-red-500/15 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  )

  const handleMobileEscape = useCallback((e) => {
    if (e.key === 'Escape') setMobileOpen(false)
  }, [])

  useEffect(() => {
    if (mobileOpen) document.addEventListener('keydown', handleMobileEscape)
    return () => document.removeEventListener('keydown', handleMobileEscape)
  }, [mobileOpen, handleMobileEscape])

  return (
    <div className="min-h-screen bg-paper">
      {/* Skip navigation — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{sidebar}</aside>

      {/* Mobile sidebar with animation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="absolute inset-y-0 left-0 w-64 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute -right-11 top-4 rounded-md bg-ink p-2 text-paper"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-2 text-ink-700 hover:bg-ink/5 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted" aria-label="Breadcrumb">
                <span className="text-accent">RWB</span>
                <span className="mx-1.5">/</span>
                <span className="text-ink">{section}</span>
              </nav>
            </div>
            {/* Name + avatar — clickable, opens the profile. */}
            <Link
              to="/profile"
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all hover:bg-ink/5"
              aria-label={`Open profile for ${user?.fullName}`}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0f5fa8] to-[#1a2332] font-sans text-sm font-bold text-white shadow-md ring-2 ring-[#0f5fa8]/20 transition-transform group-hover:scale-105"
                aria-hidden="true"
              >
                {initials(user?.fullName)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[200px] truncate text-sm font-semibold text-ink group-hover:text-[#0f5fa8]">
                  {user?.fullName}
                </p>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#0f5fa8]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-[#0f5fa8]">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
