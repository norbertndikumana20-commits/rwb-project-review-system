import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, CheckCircle2, Eye, EyeOff, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useFocusTrap } from '../hooks/useFocusTrap'
import AppShell from '../components/AppShell'
import RubberStamp from '../components/RubberStamp'
import { Alert, Button, Card, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'
import { fmtDate } from '../lib/format'

const ROLE_LABELS = {
  ADMIN: 'System Administrator',
  EXTERNAL_USER: 'External User',
  REVIEWER: 'Reviewer',
  DIVISION_MANAGER: 'Division Manager',
  SUPER_REVIEWER: 'Super Reviewer',
}

const ROLE_OPTIONS = Object.keys(ROLE_LABELS)

/* Shared modal shell for the user directory (create + edit). */
function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.role || 'EXTERNAL_USER')
  const [organizationName, setOrganizationName] = useState(user?.organizationName || '')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!fullName.trim() || !role) return
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api(`/admin/users/${user.id}`, {
          method: 'PUT',
          body: {
            fullName: fullName.trim(),
            role,
            organizationName: organizationName.trim() || null,
            password: password.trim() || null,
          },
        })
      } else {
        await api('/admin/users', {
          method: 'POST',
          body: {
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            role,
            organizationName: organizationName.trim() || null,
          },
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Unable to save the user.')
      setSaving(false)
    }
  }

  const trapRef = useFocusTrap(onClose)

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-lg bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{isEdit ? 'Edit user' : 'New user'}</h2>
            <p className={labelCls}>{isEdit ? 'Update account details' : 'Create an account directly'}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-ink-700 transition-colors hover:bg-ink/5"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-5 py-5" noValidate>
          {error && <Alert kind="error">{error}</Alert>}

          <Field label="Full name" id="u-name">
            <input
              id="u-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jean Mugisha"
              className={inputClass}
              autoFocus
            />
          </Field>

          {!isEdit && (
            <Field label="Email address" id="u-email">
              <input
                id="u-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.gov.rw"
                className={inputClass}
              />
            </Field>
          )}

          <Field
            label={isEdit ? 'Reset password' : 'Password'}
            id="u-password"
            hint={isEdit ? 'Leave blank to keep the current password.' : 'Minimum 12 characters.'}
          >
            <div className="relative">
              <input
                id="u-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current' : '••••••••••••'}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="rwb-focus-blue absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-700/60 transition-colors hover:text-brand"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <Field label="Role" id="u-role">
            <select
              id="u-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Organization" id="u-org">
            <input
              id="u-org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Nyungwe Hydro Ltd"
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !fullName.trim() || (!isEdit && !email.trim())}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'create' } | { mode: 'edit', user }

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([api('/admin/users'), api('/admin/users/pending')])
      setUsers(u)
      setPending(p)
    } catch (err) {
      setError(err.message || 'Unable to load users.')
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    load()
  }, [user?.role, load])

  async function act(u, action) {
    try {
      await api(`/admin/users/${u.id}/${action}`, { method: 'POST' })
      load()
    } catch (err) {
      setError(err.message || 'Action failed.')
    }
  }

  async function remove(u) {
    if (!window.confirm(`Delete ${u.fullName} (${u.email})? This cannot be undone.`)) return
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err.message || 'Unable to delete the user.')
    }
  }

  function saveDone() {
    setModal(null)
    load()
  }

  if (user?.role !== 'ADMIN') {
    return (
      <AppShell>
        <PageHeader eyebrow="Administration" title="Users" />
        <Card className="p-8 text-center">
          <p className={labelCls}>Administrator privileges required</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
        </Card>
      </AppShell>
    )
  }

  const canToggle = (u) => ['ACTIVE', 'ACTIVE_FIRST_PROJECT_REQUIRED', 'DISABLED'].includes(u.accountStatus)

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        subtitle="Account approvals and the review-body directory."
        actions={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <UserPlus className="h-4 w-4" aria-hidden="true" /> New user
          </Button>
        }
      />
      {error && <Alert kind="error">{error}</Alert>}

      <h2 className="mb-3 text-base font-semibold text-ink">
        Pending account approvals · {pending?.length || 0}
      </h2>
      <Card className="overflow-hidden">
        {pending && pending.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className={`border-b border-line bg-surface-muted/50 ${labelCls}`}>
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Filed</th>
                  <th className="px-4 py-3 text-right font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr key={u.id} className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.fullName}</p>
                      <p className="font-mono text-[10px] text-ink-700/60">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-700/90">{u.organizationName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-700/75 tabular-nums">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="success" className="px-3 py-1.5 text-xs" onClick={() => act(u, 'approve')}>
                          Approve
                        </Button>
                        <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => act(u, 'reject')}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`py-10 text-center ${labelCls}`}>
            {pending ? 'No registrations awaiting review' : 'Loading…'}
          </p>
        )}
      </Card>

      <h2 className="mb-3 mt-8 text-base font-semibold text-ink">Directory · {users?.length || 0}</h2>
      <Card className="overflow-hidden">
        {users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className={`border-b border-line bg-surface-muted/50 ${labelCls}`}>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50">
                    <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-700/75">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-700/75">{ROLE_LABELS[u.role] || u.role}</td>
                    <td className="px-4 py-3 text-ink-700/90">{u.organizationName || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="inline-block">
                        <RubberStamp status={u.accountStatus} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => setModal({ mode: 'edit', user: u })}
                          aria-label={`Edit ${u.fullName}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                        </Button>
                        {canToggle(u) && (
                          <Button
                            variant={u.accountStatus === 'DISABLED' ? 'primary' : 'secondary'}
                            className="h-8 px-2.5 text-xs"
                            onClick={() => act(u, u.accountStatus === 'DISABLED' ? 'enable' : 'disable')}
                            aria-label={u.accountStatus === 'DISABLED' ? `Enable ${u.fullName}` : `Disable ${u.fullName}`}
                          >
                            {u.accountStatus === 'DISABLED' ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Enable
                              </>
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Disable
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => remove(u)}
                          aria-label={`Delete ${u.fullName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`py-10 text-center ${labelCls}`}>Loading…</p>
        )}
      </Card>

      {modal && (
        <UserModal
          user={modal.mode === 'edit' ? modal.user : null}
          onClose={() => setModal(null)}
          onSaved={saveDone}
        />
      )}
    </AppShell>
  )
}
