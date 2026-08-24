import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import AppShell from '../components/AppShell'
import { Alert, Button, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader, Panel } from '../components/dashboard'
import { fmtDate } from '../lib/format'

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export default function Profile() {
  const { user, refresh } = useAuth()

  // Edit-profile form
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [organizationName, setOrganizationName] = useState(user?.organizationName || '')
  const [saving, setSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')

  // Change-password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  // Keep local fields in sync when the stored user changes (e.g. after save/refresh).
  useEffect(() => {
    setFullName(user?.fullName || '')
    setEmail(user?.email || '')
    setOrganizationName(user?.organizationName || '')
  }, [user?.fullName, user?.email, user?.organizationName])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setProfileMsg('')
    setProfileError('')
    try {
      await api('/me', {
        method: 'PATCH',
        body: { fullName, email, organizationName },
      })
      await refresh()
      setProfileMsg('Profile updated.')
    } catch (err) {
      setProfileError(err.message || 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwdMsg('')
    setPwdError('')
    if (newPassword.length < 12) {
      setPwdError('Your new password must be at least 12 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdError('The new password and confirmation do not match.')
      return
    }
    setChanging(true)
    try {
      await api('/me/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwdMsg('Password changed. Use the new password next time you sign in.')
    } catch (err) {
      setPwdError(err.message || 'Unable to change your password.')
    } finally {
      setChanging(false)
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Account" title="Profile" subtitle="View and manage your personal details." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Edit profile" className="lg:col-span-2">
          <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} onSubmit={saveProfile} className="space-y-5" noValidate>
            {profileError && <Alert kind="error">{profileError}</Alert>}
            {profileMsg && <Alert kind="success">{profileMsg}</Alert>}
            <Field label="Full name" id="fullName">
              <input
                id="fullName"
                required
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field label="Email address" id="email">
              <input
                id="email"
                type="email"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Organization" id="organizationName">
              <input
                id="organizationName"
                className={inputClass}
                placeholder="e.g. Nyungwe Hydro Ltd"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </Field>
            <div className="border-t border-ink/10 pt-4">
              <Button type="submit" disabled={saving} aria-busy={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </motion.form>
        </Panel>

        <Panel title="Account record">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent font-sans text-lg font-bold text-white ring-4 ring-accent/20">
              {initials(user?.fullName)}
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink">{user?.fullName}</h3>
              <p className={`mt-0.5 ${labelCls}`}>{user?.role}</p>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className={labelCls}>Account status</dt>
              <dd className="mt-0.5 font-medium text-ink">{user?.accountStatus}</dd>
            </div>
            <div>
              <dt className={labelCls}>Member since</dt>
              <dd className="mt-0.5 font-mono text-ink tabular-nums">{fmtDate(user?.createdAt)}</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Change password" className="lg:col-span-3">
          <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} onSubmit={savePassword} className="space-y-5" noValidate>
            {pwdError && <Alert kind="error">{pwdError}</Alert>}
            {pwdMsg && <Alert kind="success">{pwdMsg}</Alert>}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label="Current password" id="currentPassword">
                <input
                  id="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </Field>
              <Field label="New password" id="newPassword">
                <input
                  id="newPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirm new password" id="confirmPassword">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>
            </div>
            <p className="text-xs text-ink-700/70">
              Minimum 12 characters. You will need the new password the next time you sign in.
            </p>
            <div className="border-t border-ink/10 pt-4">
              <Button type="submit" disabled={changing} aria-busy={changing}>
                {changing ? 'Changing…' : 'Update password'}
              </Button>
            </div>
          </motion.form>
        </Panel>
      </div>
    </AppShell>
  )
}
