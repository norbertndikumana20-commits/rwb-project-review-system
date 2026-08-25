/*
 * ─────────────────────────────────────────────────────────────────────────
 * APP MANAGEMENT — Admin-only control panel
 *
 * Tabs: Users | Branding | Appearance | Security | System | Email | Support
 *
 * Polished with:
 *   - Animated toggle switches (framer-motion)
 *   - Color-coded section headers with icons
 *   - Unsaved changes indicator
 *   - Better visual hierarchy across all tabs
 *   - Interactive preset cards with live color preview
 *   - Warning styling for destructive actions
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowDown, ArrowUp, Ban, CheckCircle2, Eye, EyeOff, ImagePlus,
  Info, Key, Palette, Phone, Pencil, Shield, Mail, Server, Trash2,
  UserPlus, Users, X, AlertTriangle, PhoneCall, Save, Globe,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { api } from '../lib/api'
import { useFocusTrap } from '../hooks/useFocusTrap'
import AppShell from '../components/AppShell'
import { Alert, Button, Card, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'
import { StaggerContainer, StaggerItem } from '../components/AnimatedPage'

/* ── Constants ──────────────────────────────────────────────────────── */

const ROLES = {
  ADMIN: 'System Administrator',
  DIVISION_MANAGER: 'Division Manager',
  REVIEWER: 'Reviewer',
  SUPER_REVIEWER: 'Super Reviewer',
  EXTERNAL_USER: 'External User',
}

const TABS = [
  { id: 'users', label: 'Users', icon: Users, color: '#1F3A5F', description: 'Manage accounts, approvals, and roles' },
  { id: 'branding', label: 'Branding', icon: ImagePlus, color: '#7B2CBF', description: 'Landing slides and auth backgrounds' },
  { id: 'appearance', label: 'Appearance', icon: Palette, color: '#0077B6', description: 'Theme colors and visual identity' },
  { id: 'security', label: 'Security', icon: Shield, color: '#B34A4A', description: 'Password policy and session controls' },
  { id: 'system', label: 'System', icon: Server, color: '#D99A3F', description: 'Maintenance mode and system info' },
  { id: 'email', label: 'Email', icon: Mail, color: '#4A7C59', description: 'SMTP server and delivery settings' },
  { id: 'support', label: 'Support', icon: Phone, color: '#5A189A', description: 'Contact numbers and support email' },
]

const THEME_COLORS = [
  { key: 'app.theme.primary', label: 'Primary Color', hint: 'Buttons, links, active nav', icon: '🎨' },
  { key: 'app.theme.background', label: 'Background Color', hint: 'Page background', icon: '🖼️' },
  { key: 'app.theme.accent', label: 'Accent Color', hint: 'Success states, secondary accent', icon: '✨' },
  { key: 'app.theme.sidebar', label: 'Sidebar Color', hint: 'Navigation sidebar', icon: '📐' },
]

/* ── Animated Toggle Switch ─────────────────────────────────────────── */

function Toggle({ checked, onChange, label, hint, disabled, warning }) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border p-4 transition-all ${disabled ? 'opacity-60' : 'hover:bg-ink-50/30 cursor-pointer'} ${warning && checked ? 'border-amber/40 bg-amber-light/10' : 'border-line'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? (warning ? 'bg-amber' : 'bg-accent') : 'bg-ink/20'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] text-muted leading-relaxed">{hint}</p>}
        {warning && checked && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-dark">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {warning}
          </p>
        )}
      </div>
    </label>
  )
}

/* ── Section Header with Icon ───────────────────────────────────────── */

function SectionHeader({ icon: Icon, title, description, color = '#1F3A5F' }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-[12px] text-muted leading-relaxed">{description}</p>}
      </div>
    </div>
  )
}

/* ── Enhanced Radio Group ───────────────────────────────────────────── */

function RadioGroup({ name, options, value, onChange, columns = 1 }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <motion.label
          key={opt.value}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
            value === opt.value
              ? 'border-accent bg-accent-soft shadow-sm ring-1 ring-accent/20'
              : 'border-line hover:border-ink/20 hover:bg-ink-50/30'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 accent-accent"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">{opt.label}</p>
            {opt.hint && <p className="mt-0.5 text-[11px] text-muted truncate">{opt.hint}</p>}
          </div>
        </motion.label>
      ))}
    </div>
  )
}

/* ── Enhanced Checkbox ──────────────────────────────────────────────── */

function Checkbox({ checked, onChange, label, hint }) {
  return (
    <motion.label
      whileHover={{ scale: 1.005 }}
      className="flex items-start gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-ink-50/30 cursor-pointer"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded accent-accent"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted leading-relaxed">{hint}</p>}
      </div>
    </motion.label>
  )
}

/* ── Enhanced Color Input ───────────────────────────────────────────── */

function ColorInput({ label, value, onChange, icon }) {
  return (
    <motion.label
      whileHover={{ scale: 1.01 }}
      className="flex items-center gap-3 rounded-xl border border-line p-3 transition-all hover:border-ink/20 hover:bg-ink-50/30 cursor-pointer"
    >
      <div className="relative">
        <input
          type="color"
          value={value || '#1F3A5F'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border-2 border-line p-0.5 transition-colors hover:border-accent"
          aria-label={label}
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-surface shadow-sm" style={{ backgroundColor: value || '#1F3A5F' }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="font-mono text-[11px] text-muted">{value || '#1F3A5F'}</p>
      </div>
      {icon && <span className="text-lg" aria-hidden="true">{icon}</span>}
    </motion.label>
  )
}

/* ── Unsaved Changes Banner ─────────────────────────────────────────── */

function UnsavedBanner({ hasChanges, onSave, saving }) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <div className="flex items-center justify-between rounded-xl border border-amber/30 bg-amber-light/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber animate-pulse" />
              <p className="text-sm font-medium text-amber-dark">You have unsaved changes</p>
            </div>
            <Button onClick={onSave} disabled={saving} className="text-sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving…' : 'Save Now'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── User Edit Modal ────────────────────────────────────────────────── */

function UserEditModal({ user, onClose, onSaved }) {
  const isEdit = !!user
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.role || 'EXTERNAL_USER')
  const [org, setOrg] = useState(user?.organizationName || '')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const trapRef = useFocusTrap(onClose)

  async function submit(e) {
    e.preventDefault()
    if (!fullName.trim()) return
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api(`/admin/users/${user.id}`, {
          method: 'PUT',
          body: { fullName: fullName.trim(), role, organizationName: org.trim() || null, password: password.trim() || null },
        })
      } else {
        await api('/admin/users', {
          method: 'POST',
          body: { fullName: fullName.trim(), email: email.trim(), password, role, organizationName: org.trim() || null },
        })
      }
      toast.success(isEdit ? 'User updated.' : 'User created.')
      onSaved()
    } catch (err) {
      setError(err.message || 'Save failed.')
      setSaving(false)
    }
  }

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-lg rounded-2xl bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{isEdit ? 'Edit User' : 'New User'}</h2>
            <p className="mt-0.5 text-[12px] text-muted">{isEdit ? 'Update account details' : 'Create an account directly'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-700 hover:bg-ink/5 transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-5 px-6 py-5" noValidate>
          {error && <Alert kind="error">{error}</Alert>}

          <Field label="Full Name" id="ue-name">
            <input id="ue-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} autoFocus />
          </Field>

          {!isEdit && (
            <Field label="Email Address" id="ue-email">
              <input id="ue-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </Field>
          )}

          <Field label={isEdit ? 'Reset Password (leave blank to keep)' : 'Password'} id="ue-pw" hint="Minimum 12 characters">
            <div className="relative">
              <input
                id="ue-pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep' : '••••••••••••'}
                className={`${inputClass} pr-11`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-700/60 hover:text-accent transition-colors" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>

          <div>
            <p className={`${labelCls} mb-2`}>Role</p>
            <RadioGroup
              name="ue-role"
              value={role}
              onChange={setRole}
              columns={2}
              options={Object.entries(ROLES).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <Field label="Organization" id="ue-org">
            <input id="ue-org" value={org} onChange={(e) => setOrg(e.target.value)} className={inputClass} />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !fullName.trim()}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * TABS
 * ═══════════════════════════════════════════════════════════════════════ */

/* ── Users Tab ──────────────────────────────────────────────────────── */

function UsersTab() {
  const { user } = useAuth()
  const [users, setUsers] = useState(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([api('/admin/users'), api('/admin/users/pending')])
      setUsers(u); setPending(p)
    } catch (err) { setError(err.message) }
  }, [])

  useEffect(() => { load() }, [load])

  const [confirmModal, setConfirmModal] = useState(null)

  async function act(u, action) {
    if (action === 'disable' || action === 'enable') {
      setConfirmModal({ user: u, action })
      return
    }
    try {
      await api(`/admin/users/${u.id}/${action}`, { method: 'POST' })
      toast.success(`${u.fullName} ${action}d.`)
      load()
    } catch (err) { setError(err.message) }
  }

  async function executeConfirmed() {
    if (!confirmModal) return
    const { user: u, action } = confirmModal
    try {
      if (action === 'delete') {
        await api(`/admin/users/${u.id}`, { method: 'DELETE' })
        toast.success(`${u.fullName} has been permanently deleted.`)
      } else {
        await api(`/admin/users/${u.id}/${action}`, { method: 'POST' })
        const labels = { enable: 'enabled', disable: 'disabled', reject: 'rejected' }
        toast.success(`${u.fullName} ${labels[action] || action}.`)
      }
      setConfirmModal(null)
      load()
    } catch (err) { setError(err.message) }
  }

  async function remove(u) {
    setConfirmModal({ user: u, action: 'delete' })
  }

  const filtered = (users || [])
    .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u) => !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const order = { PENDING_ADMIN_REVIEW: 0, PENDING_EMAIL_VERIFICATION: 1, ACTIVE_FIRST_PROJECT_REQUIRED: 2, ACTIVE: 3, DISABLED: 4 }
      return (order[a.accountStatus] ?? 5) - (order[b.accountStatus] ?? 5)
    })

  return (
    <div className="space-y-6">
      {error && <Alert kind="error">{error}</Alert>}

      {/* Pending approvals */}
      {pending && pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 border-amber/30">
            <SectionHeader icon={AlertTriangle} title={`Pending Approvals (${pending.length})`} description="Review and approve new registration requests" color="#D99A3F" />
            <div className="space-y-2">
              {pending.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-xl border border-amber/20 bg-amber-light/10 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber-dark">
                      {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{u.fullName}</p>
                      <p className="text-[11px] text-muted">{u.email} · {u.organizationName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" className="px-3 py-1.5 text-xs" onClick={() => act(u, 'approve')}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Activate Account
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => {
                      setConfirmModal({ user: u, action: 'reject' })
                    }}>
                      <Ban className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
            aria-label="Search users"
          />
          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['ALL', ...Object.keys(ROLES)].map((r) => (
            <motion.button
              key={r}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRoleFilter(r)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                roleFilter === r ? 'bg-accent text-white shadow-sm' : 'border border-line text-muted hover:bg-ink-50'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : ROLES[r]?.split(' ')[0]}
            </motion.button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setModal({ mode: 'create' })} className="text-sm">
            <UserPlus className="h-4 w-4" aria-hidden="true" /> New User
          </Button>
        </div>
      </div>

      {/* User table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className={`border-b border-line bg-surface-muted/50 ${labelCls}`}>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-xs font-bold text-accent">
                        {u.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-ink">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-700/75">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase text-accent">
                      {ROLES[u.role]?.split(' ')[0] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      u.accountStatus === 'ACTIVE' ? 'bg-sage-light/60 text-sage-dark' :
                      u.accountStatus === 'ACTIVE_FIRST_PROJECT_REQUIRED' ? 'bg-blue-100 text-blue-700' :
                      u.accountStatus === 'DISABLED' ? 'bg-brick-light/40 text-brick' :
                      u.accountStatus === 'PENDING_ADMIN_REVIEW' ? 'bg-amber-light/60 text-amber-dark ring-1 ring-amber/30' :
                      u.accountStatus === 'PENDING_EMAIL_VERIFICATION' ? 'bg-gray-100 text-gray-600' :
                      'bg-amber-light/50 text-amber-dark'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        u.accountStatus === 'ACTIVE' ? 'bg-sage' :
                        u.accountStatus === 'ACTIVE_FIRST_PROJECT_REQUIRED' ? 'bg-blue-500' :
                        u.accountStatus === 'DISABLED' ? 'bg-brick' :
                        u.accountStatus === 'PENDING_ADMIN_REVIEW' ? 'bg-amber animate-pulse' :
                        u.accountStatus === 'PENDING_EMAIL_VERIFICATION' ? 'bg-gray-400' : 'bg-amber'
                      }`} />
                      {u.accountStatus === 'PENDING_ADMIN_REVIEW' ? '⏳ Pending Review' :
                       u.accountStatus === 'PENDING_EMAIL_VERIFICATION' ? '✉️ Email Pending' :
                       u.accountStatus === 'ACTIVE_FIRST_PROJECT_REQUIRED' ? '🆕 First Project' :
                       u.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.accountStatus === 'PENDING_ADMIN_REVIEW' && (
                        <Button variant="success" className="h-8 px-2.5 text-xs" onClick={() => act(u, 'approve')}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                        </Button>
                      )}
                      <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => setModal({ mode: 'edit', user: u })} aria-label={`Edit ${u.fullName}`}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      {['ACTIVE', 'DISABLED'].includes(u.accountStatus) && (
                        <Button variant={u.accountStatus === 'DISABLED' ? 'primary' : 'secondary'} className="h-8 px-2.5 text-xs" onClick={() => act(u, u.accountStatus === 'DISABLED' ? 'enable' : 'disable')}>
                          {u.accountStatus === 'DISABLED' ? <><CheckCircle2 className="h-3.5 w-3.5" /> Enable</> : <><Ban className="h-3.5 w-3.5" /> Disable</>}
                        </Button>
                      )}
                      <Button variant="danger" className="h-8 px-2.5 text-xs" onClick={() => remove(u)} aria-label={`Delete ${u.fullName}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">No users match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && <UserEditModal user={modal.mode === 'edit' ? modal.user : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}

      {/* Confirmation dialog for destructive actions */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                confirmModal.action === 'delete' || confirmModal.action === 'reject' ? 'bg-brick-light/40 text-brick' :
                confirmModal.action === 'disable' ? 'bg-amber-light/50 text-amber-dark' :
                'bg-sage-light/60 text-sage-dark'
              }`}>
                {confirmModal.action === 'delete' ? <Trash2 className="h-6 w-6" /> :
                 confirmModal.action === 'disable' ? <Ban className="h-6 w-6" /> :
                 <CheckCircle2 className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {confirmModal.action === 'delete' ? 'Delete User' :
                   confirmModal.action === 'disable' ? 'Disable User' :
                   confirmModal.action === 'reject' ? 'Reject Registration' : 'Enable User'}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {confirmModal.action === 'delete' ? (
                    <>Are you sure you want to permanently delete <strong>{confirmModal.user.fullName}</strong>? This action cannot be undone and all their data will be lost.</>
                  ) : confirmModal.action === 'disable' ? (
                    <>Are you sure you want to disable <strong>{confirmModal.user.fullName}</strong>? They will no longer be able to sign in.</>
                  ) : confirmModal.action === 'reject' ? (
                    <>Are you sure you want to reject the registration of <strong>{confirmModal.user.fullName}</strong> ({confirmModal.user.email})? They will need to register again.</>
                  ) : (
                    <>Are you sure you want to enable <strong>{confirmModal.user.fullName}</strong>? They will regain access to the system.</>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                variant={confirmModal.action === 'delete' || confirmModal.action === 'reject' ? 'danger' : confirmModal.action === 'disable' ? 'primary' : 'success'}
                onClick={executeConfirmed}
              >
                {confirmModal.action === 'delete' ? 'Yes, Delete User' :
                 confirmModal.action === 'disable' ? 'Yes, Disable' :
                 confirmModal.action === 'reject' ? 'Yes, Reject' : 'Yes, Enable'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ── Branding Tab ──────────────────────────────────────────────────── */
function BrandingTab() {
  const [images, setImages] = useState({ LANDING: [], AUTH: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [uploadKind, setUploadKind] = useState('LANDING')
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [captions, setCaptions] = useState({})
  const [busy, setBusy] = useState({})

  const KINDS = [
    { value: 'LANDING', label: 'Landing Slideshow', hint: 'Full-bleed hero slides on the public landing page.' },
    { value: 'AUTH', label: 'Auth Backgrounds', hint: 'Subtle backdrop images behind the sign-in / registration cards.' },
  ]

  function fmtBytes(n) {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
    return `${(n / (1024 * 1024)).toFixed(1)} MB`
  }

  const refresh = useCallback(async () => {
    try {
      const [landing, auth] = await Promise.all([
        api('/admin/branding?kind=LANDING'),
        api('/admin/branding?kind=AUTH'),
      ])
      setImages({ LANDING: landing || [], AUTH: auth || [] })
      setCaptions((prev) => {
        const next = { ...prev }
        for (const list of [landing || [], auth || []]) {
          for (const img of list) if (next[img.id] === undefined) next[img.id] = img.caption || ''
        }
        return next
      })
    } catch (err) {
      setError(err.message || 'Unable to load branding images.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleUpload(e) {
    e.preventDefault()
    if (!uploadFile) { setError('Choose an image file to upload.'); return }
    setUploading(true); setError(''); setNotice('')
    try {
      const body = new FormData()
      body.append('file', uploadFile)
      body.append('kind', uploadKind)
      if (uploadCaption.trim()) body.append('caption', uploadCaption.trim())
      await api('/admin/branding', { method: 'POST', body })
      setUploadFile(null); setUploadCaption(''); e.target.reset?.()
      setNotice('Image uploaded.')
      window.setTimeout(() => setNotice(''), 4000)
      await refresh()
    } catch (err) { setError(err.message || 'Upload failed.') }
    finally { setUploading(false) }
  }

  async function patch(id, payload) {
    setBusy((b) => ({ ...b, [id]: true }))
    try { await api(`/admin/branding/${id}`, { method: 'PATCH', body: payload }); await refresh(); return true }
    catch (err) { setError(err.message || 'Update failed.'); return false }
    finally { setBusy((b) => ({ ...b, [id]: false })) }
  }

  async function move(id, dir) {
    const kind = [...images.LANDING, ...images.AUTH].find((x) => x.id === id)?.slideKind
    if (!kind) return
    const arr = images[kind]; const i = arr.findIndex((x) => x.id === id); const j = i + dir
    if (i < 0 || j < 0 || j >= arr.length) return
    const a = arr[i]; const b = arr[j]
    setBusy((x) => ({ ...x, [id]: true }))
    try {
      await api(`/admin/branding/${a.id}`, { method: 'PATCH', body: { sortOrder: b.sortOrder } })
      await api(`/admin/branding/${b.id}`, { method: 'PATCH', body: { sortOrder: a.sortOrder } })
      await refresh()
    } catch (err) { setError(err.message || 'Reorder failed.') }
    finally { setBusy((x) => ({ ...x, [id]: false })) }
  }

  async function remove(id) {
    if (!window.confirm('Delete this image?')) return
    setBusy((x) => ({ ...x, [id]: true }))
    try {
      await api(`/admin/branding/${id}`, { method: 'DELETE' })
      setNotice('Image deleted.'); window.setTimeout(() => setNotice(''), 4000)
      await refresh()
    } catch (err) { setError(err.message || 'Delete failed.') }
    finally { setBusy((x) => ({ ...x, [id]: false })) }
  }

  function renderRow(img, index, list) {
    const isFirst = index === 0; const isLast = index === list.length - 1
    return (
      <motion.li
        key={img.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${img.active ? 'border-line bg-surface' : 'border-line/50 bg-surface opacity-70'}`}
      >
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-paper-darker sm:w-40">
          <img src={img.url} alt={img.caption || img.fileName} className="h-full w-full object-cover" />
          {!img.active && <span className="absolute left-2 top-2 rounded-md bg-ink/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">Hidden</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-ink" title={img.fileName}>{img.fileName}</p>
            <span className="shrink-0 rounded-md bg-surface-muted px-2 py-0.5 font-mono text-[11px] text-muted">{fmtBytes(img.sizeBytes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <input className={`${inputClass} py-2`} placeholder="Caption…" value={captions[img.id] ?? ''} onChange={(e) => setCaptions((c) => ({ ...c, [img.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); patch(img.id, { caption: (captions[img.id] || '').trim() }) } }} />
            <Button variant="secondary" className="px-2.5 py-2 text-xs" onClick={() => patch(img.id, { caption: (captions[img.id] || '').trim() })} disabled={busy[img.id]}>Save</Button>
          </div>
          <p className="text-[11px] text-muted">Slide {index + 1} of {list.length}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <Button variant="secondary" className="px-2" onClick={() => move(img.id, -1)} disabled={busy[img.id] || isFirst} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
          <Button variant="secondary" className="px-2" onClick={() => move(img.id, 1)} disabled={busy[img.id] || isLast} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
          <Button variant={img.active ? 'secondary' : 'success'} className="px-2" onClick={() => patch(img.id, { active: !img.active })} disabled={busy[img.id]}>{img.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
          <Button variant="danger" className="px-2" onClick={() => remove(img.id)} disabled={busy[img.id]}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </motion.li>
    )
  }

  return (
    <div className="space-y-6">
      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <Card className="p-6">
        <SectionHeader icon={ImagePlus} title="Upload Image" description="JPEG, PNG, WebP or GIF. Landing slides show full-bleed; auth backgrounds render dimmed behind the login cards." color="#7B2CBF" />
        <form onSubmit={handleUpload} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Surface" id="bk-kind">
            <select id="bk-kind" className={inputClass} value={uploadKind} onChange={(e) => setUploadKind(e.target.value)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </Field>
          <Field label="Caption (optional)" id="bk-caption">
            <input id="bk-caption" className={inputClass} placeholder="e.g. Nyungwe Waterfall" value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} />
          </Field>
          <Field label="Image file" id="bk-file">
            <input id="bk-file" type="file" required accept="image/jpeg,image/png,image/webp,image/gif" className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white file:transition-colors file:hover:bg-accent-dark`} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          </Field>
          <div className="md:col-span-3"><Button type="submit" disabled={uploading || !uploadFile}>{uploading ? 'Uploading…' : 'Upload image'}</Button></div>
        </form>
      </Card>

      {loading ? (
        <div className="py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
          <p className="mt-3 text-sm text-muted">Loading images…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {KINDS.map((kind) => {
            const list = images[kind.value] || []
            return (
              <Card key={kind.value} className="p-5">
                <h3 className="text-sm font-semibold text-ink">{kind.label}</h3>
                <p className="mt-1 text-[12px] text-muted">{kind.hint}</p>
                {list.length === 0 ? (
                  <div className="mt-4 rounded-xl border-2 border-dashed border-line bg-paper p-8 text-center">
                    <ImagePlus className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
                    <p className="mt-2 text-sm font-medium text-ink-700">No images yet</p>
                    <p className="mt-1 text-[13px] text-muted">Upload one above.</p>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">{list.map((img, i) => renderRow(img, i, list))}</ul>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Appearance Tab ─────────────────────────────────────────────────── */

function AppearanceTab({ settings, setSettings, saving, onSave, hasChanges, setHasChanges }) {
  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    setHasChanges(true)
  }

  const PRESETS = [
    { name: 'Ocean Blue', primary: '#1F3A5F', background: '#F7F6F3', accent: '#4A7C59', sidebar: '#1A2332', emoji: '🌊' },
    { name: 'Fresh Aqua', primary: '#0077B6', background: '#F0F7FA', accent: '#06D6A0', sidebar: '#023047', emoji: '💧' },
    { name: 'Forest Green', primary: '#2D6A4F', background: '#F5F5F0', accent: '#40916C', sidebar: '#1B4332', emoji: '🌿' },
    { name: 'Royal Purple', primary: '#5A189A', background: '#F8F5FF', accent: '#7B2CBF', sidebar: '#240046', emoji: '👑' },
    { name: 'Warm Earth', primary: '#9C6644', background: '#FFF8F0', accent: '#CC8B65', sidebar: '#5C3D2E', emoji: '🌍' },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Palette} title="Theme Presets" description="Select a preset to quickly change the app's look and feel." color="#0077B6" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PRESETS.map((preset) => (
            <motion.button
              key={preset.name}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                update('app.theme.primary', preset.primary)
                update('app.theme.background', preset.background)
                update('app.theme.accent', preset.accent)
                update('app.theme.sidebar', preset.sidebar)
                toast.success(`Applied "${preset.name}" theme.`)
              }}
              className="group rounded-xl border border-line p-4 text-left transition-all hover:border-accent hover:shadow-lg"
            >
              <div className="flex gap-1.5 mb-3">
                <span className="h-7 w-7 rounded-lg shadow-sm" style={{ backgroundColor: preset.primary }} />
                <span className="h-7 w-7 rounded-lg shadow-sm" style={{ backgroundColor: preset.accent }} />
                <span className="h-7 w-7 rounded-lg shadow-sm" style={{ backgroundColor: preset.sidebar }} />
              </div>
              <p className="text-xs font-semibold text-ink group-hover:text-accent">{preset.emoji} {preset.name}</p>
            </motion.button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Globe} title="Custom Colors" description="Fine-tune individual colors. Changes apply across the entire app." color="#0077B6" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {THEME_COLORS.map((c) => (
            <ColorInput
              key={c.key}
              label={c.label}
              value={settings[c.key] || '#1F3A5F'}
              onChange={(v) => update(c.key, v)}
              icon={c.icon}
            />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Info} title="App Identity" description="Set the application name and version shown to users." color="#0077B6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Application Name" id="app-name">
            <input id="app-name" className={inputClass} value={settings['app.name'] || ''} onChange={(e) => update('app.name', e.target.value)} />
          </Field>
          <Field label="Version" id="app-version">
            <input id="app-version" className={inputClass} value={settings['app.version'] || ''} onChange={(e) => update('app.version', e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || !hasChanges}>{saving ? 'Saving…' : 'Save Appearance'}</Button>
      </div>
    </div>
  )
}

/* ── Security Tab ───────────────────────────────────────────────────── */

function SecurityTab({ settings, setSettings, saving, onSave, hasChanges, setHasChanges }) {
  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Key} title="Password Policy" description="Define the rules for user passwords across the system." color="#B34A4A" />
        <div className="space-y-3">
          <Field label="Minimum Password Length" id="min-pw-len">
            <input
              id="min-pw-len"
              type="number"
              min={8}
              max={64}
              className={inputClass}
              value={settings['app.password_policy.min_length'] || '12'}
              onChange={(e) => update('app.password_policy.min_length', e.target.value)}
            />
          </Field>
          <Checkbox
            checked={settings['app.password_policy.require_uppercase'] === 'true'}
            onChange={(v) => update('app.password_policy.require_uppercase', v ? 'true' : 'false')}
            label="Require uppercase letter"
            hint="At least one A-Z character"
          />
          <Checkbox
            checked={settings['app.password_policy.require_number'] === 'true'}
            onChange={(v) => update('app.password_policy.require_number', v ? 'true' : 'false')}
            label="Require number"
            hint="At least one 0-9 digit"
          />
          <Checkbox
            checked={settings['app.password_policy.require_special'] === 'true'}
            onChange={(v) => update('app.password_policy.require_special', v ? 'true' : 'false')}
            label="Require special character"
            hint="At least one !@#$%^&* character"
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Shield} title="Session Settings" description="Control how user sessions behave." color="#B34A4A" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Session Timeout (minutes)" id="session-timeout">
            <input
              id="session-timeout"
              type="number"
              min={15}
              max={1440}
              className={inputClass}
              value={settings['app.session.timeout_minutes'] || '480'}
              onChange={(e) => update('app.session.timeout_minutes', e.target.value)}
            />
          </Field>
          <Field label="Max Failed Login Attempts (before lockout)" id="max-attempts">
            <input
              id="max-attempts"
              type="number"
              min={3}
              max={20}
              className={inputClass}
              value={settings['app.session.max_attempts'] || '5'}
              onChange={(e) => update('app.session.max_attempts', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Users} title="Registration" description="Control whether new users can sign up for accounts." color="#B34A4A" />
        <Toggle
          checked={settings['app.registration_enabled'] === 'true'}
          onChange={(v) => update('app.registration_enabled', v ? 'true' : 'false')}
          label="Allow new registrations"
          hint="When disabled, new users cannot sign up. Existing accounts are unaffected."
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || !hasChanges}>{saving ? 'Saving…' : 'Save Security Settings'}</Button>
      </div>
    </div>
  )
}

/* ── System Tab ─────────────────────────────────────────────────────── */

function SystemTab({ settings, setSettings, saving, onSave, hasChanges, setHasChanges }) {
  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Server} title="System Controls" description="Global system-wide toggles and maintenance settings." color="#D99A3F" />
        <div className="space-y-3">
          <Toggle
            checked={settings['app.maintenance_mode'] === 'true'}
            onChange={(v) => {
              update('app.maintenance_mode', v ? 'true' : 'false')
              if (v) toast('Maintenance mode enabled — only admins can log in.', { icon: '🔧' })
              else toast.success('Maintenance mode disabled.')
            }}
            label="Maintenance Mode"
            hint="When enabled, only administrators can access the system. All other users see a maintenance page."
            warning="This will lock out all non-admin users immediately."
          />
          <Toggle
            checked={settings['app.registration_enabled'] === 'true'}
            onChange={(v) => update('app.registration_enabled', v ? 'true' : 'false')}
            label="Allow New Registrations"
            hint="Toggle whether new external companies can register accounts."
          />
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Info} title="System Information" description="Basic application metadata." color="#D99A3F" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Application Name" id="sys-name">
            <input id="sys-name" className={inputClass} value={settings['app.name'] || ''} onChange={(e) => update('app.name', e.target.value)} />
          </Field>
          <Field label="Version" id="sys-version">
            <input id="sys-version" className={inputClass} value={settings['app.version'] || ''} onChange={(e) => update('app.version', e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || !hasChanges}>{saving ? 'Saving…' : 'Save System Settings'}</Button>
      </div>
    </div>
  )
}

/* ── Email Tab ──────────────────────────────────────────────────────── */

function EmailTab({ settings, setSettings, saving, onSave, hasChanges, setHasChanges }) {
  const [testTo, setTestTo] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)

  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    setHasChanges(true)
  }

  async function sendTest() {
    if (!testTo) return
    setTesting(true)
    setTestResult('')
    try {
      const res = await api('/admin/mail/test', { method: 'POST', body: { to: testTo } })
      setTestResult(res.message)
      toast.success('Test email sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={Mail} title="SMTP Settings" description="Configure the outgoing email server for notifications and MFA codes." color="#4A7C59" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="SMTP Host" id="smtp-host">
            <input id="smtp-host" className={inputClass} value={settings['app.mail.smtp_host'] || ''} onChange={(e) => update('app.mail.smtp_host', e.target.value)} />
          </Field>
          <Field label="SMTP Port" id="smtp-port">
            <input id="smtp-port" className={inputClass} value={settings['app.mail.smtp_port'] || ''} onChange={(e) => update('app.mail.smtp_port', e.target.value)} />
          </Field>
          <Field label="Sender Email" id="smtp-sender">
            <input id="smtp-sender" type="email" className={inputClass} value={settings['app.mail.sender'] || ''} onChange={(e) => update('app.mail.sender', e.target.value)} />
          </Field>
          <Field label="Display Name" id="smtp-display">
            <input id="smtp-display" className={inputClass} value={settings['app.mail.display_name'] || ''} onChange={(e) => update('app.mail.display_name', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Mail} title="Test Email Delivery" description="Send a test message to verify SMTP is working correctly." color="#4A7C59" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Send to" id="test-email">
              <input id="test-email" type="email" className={inputClass} placeholder="you@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            </Field>
          </div>
          <Button onClick={sendTest} disabled={testing || !testTo}>{testing ? 'Sending…' : 'Send Test'}</Button>
        </div>
        {testResult && <Alert kind="success" className="mt-3">{testResult}</Alert>}
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || !hasChanges}>{saving ? 'Saving…' : 'Save Email Settings'}</Button>
      </div>
    </div>
  )
}

/* ── Support Tab ────────────────────────────────────────────────────── */

function SupportTab({ settings, setSettings, saving, onSave, hasChanges, setHasChanges }) {
  function update(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader icon={PhoneCall} title="Support Contact Numbers" description="Phone numbers shown on the 'Contact RWB Support Team' section of the sign-in page." color="#5A189A" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <Field key={n} label={`Phone ${n}`} id={`phone-${n}`}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input id={`phone-${n}`} className={`${inputClass} pl-10`} value={settings[`app.support.phone_${n}`] || ''} onChange={(e) => update(`app.support.phone_${n}`, e.target.value)} placeholder={`+250 7XX XXX XXX`} />
              </div>
            </Field>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader icon={Mail} title="Support Email" description="Email address for user support inquiries." color="#5A189A" />
        <Field label="Support Email Address" id="support-email">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="support-email" type="email" className={`${inputClass} pl-10`} value={settings['app.support.email'] || ''} onChange={(e) => update('app.support.email', e.target.value)} placeholder="support@rwb.gov.rw" />
          </div>
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || !hasChanges}>{saving ? 'Saving…' : 'Save Support Info'}</Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════ */

export default function AppManagement() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'users'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [settings, setSettings] = useState({})
  const { refresh: refreshTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  function switchTab(id) {
    if (hasChanges && !window.confirm('You have unsaved changes. Discard them?')) return
    setActiveTab(id)
    setHasChanges(false)
    setSearchParams({ tab: id }, { replace: true })
  }

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    let cancelled = false
    api('/admin/settings')
      .then((s) => !cancelled && setSettings(s.settings || {}))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [user?.role])

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await api('/admin/settings', { method: 'PUT', body: { settings } })
      if (res?.settings) refreshTheme(res.settings)
      toast.success('Settings saved and applied.')
      setHasChanges(false)
    } catch (err) {
      toast.error(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <AppShell>
        <PageHeader eyebrow="Administration" title="App Management" />
        <Card className="p-8 text-center">
          <p className={labelCls}>Administrator privileges required</p>
        </Card>
      </AppShell>
    )
  }

  const activeTabInfo = TABS.find((t) => t.id === activeTab)

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="App Management"
        subtitle="Complete control over users, branding, appearance, security, system, email, and support."
      />

      {error && <Alert kind="error">{error}</Alert>}

      <UnsavedBanner hasChanges={hasChanges} onSave={saveSettings} saving={saving} />

      {/* Tab bar */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 rounded-xl border border-line bg-surface-muted/50 p-1.5" role="tablist">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => switchTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-muted hover:text-ink hover:bg-white/50'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="h-4 w-4 shrink-0" style={{ color: activeTab === tab.id ? tab.color : undefined }} aria-hidden="true" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active tab description */}
      <AnimatePresence mode="wait">
        {activeTabInfo && (
          <motion.div
            key={activeTabInfo.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-6 flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3"
          >
            <div className="rounded-md p-1.5" style={{ backgroundColor: `${activeTabInfo.color}15` }}>
              <activeTabInfo.icon className="h-4 w-4" style={{ color: activeTabInfo.color }} aria-hidden="true" />
            </div>
            <p className="text-sm text-muted">{activeTabInfo.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <Card className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
          <p className="mt-3 text-sm text-muted">Loading settings…</p>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'branding' && <BrandingTab />}
            {activeTab === 'appearance' && <AppearanceTab settings={settings} setSettings={setSettings} saving={saving} onSave={saveSettings} hasChanges={hasChanges} setHasChanges={setHasChanges} />}
            {activeTab === 'security' && <SecurityTab settings={settings} setSettings={setSettings} saving={saving} onSave={saveSettings} hasChanges={hasChanges} setHasChanges={setHasChanges} />}
            {activeTab === 'system' && <SystemTab settings={settings} setSettings={setSettings} saving={saving} onSave={saveSettings} hasChanges={hasChanges} setHasChanges={setHasChanges} />}
            {activeTab === 'email' && <EmailTab settings={settings} setSettings={setSettings} saving={saving} onSave={saveSettings} hasChanges={hasChanges} setHasChanges={setHasChanges} />}
            {activeTab === 'support' && <SupportTab settings={settings} setSettings={setSettings} saving={saving} onSave={saveSettings} hasChanges={hasChanges} setHasChanges={setHasChanges} />}
          </motion.div>
        </AnimatePresence>
      )}
    </AppShell>
  )
}
