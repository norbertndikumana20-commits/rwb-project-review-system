import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import AppShell from '../components/AppShell'
import { Alert, Button, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader, Panel } from '../components/dashboard'

export default function Settings() {
  const { user, refresh } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const [mail, setMail] = useState(null)
  const [mailError, setMailError] = useState('')
  const [testTo, setTestTo] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    api('/admin/mail/status')
      .then((s) => !cancelled && setMail(s))
      .catch((err) => !cancelled && setMailError(err.message || 'Unable to load mail status.'))
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  async function sendTest(e) {
    e.preventDefault()
    setTesting(true)
    setTestResult('')
    setMailError('')
    try {
      const res = await api('/admin/mail/test', { method: 'POST', body: { to: testTo } })
      setTestResult(res.message)
      setTestTo('')
    } catch (err) {
      setMailError(err.message || 'Unable to send test message.')
    } finally {
      setTesting(false)
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await api('/me', { method: 'PATCH', body: { fullName } })
      await refresh()
      setMessage('Profile updated. The change is recorded in the audit ledger.')
    } catch (err) {
      setError(err.message || 'Unable to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your review-body profile." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Profile" className="lg:col-span-2">
          <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} onSubmit={save} className="space-y-5" noValidate>
            {error && <Alert kind="error">{error}</Alert>}
            {message && <Alert kind="success">{message}</Alert>}
            <Field label="Full name" id="fullName">
              <input id="fullName" required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <div className="border-t border-ink/10 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </motion.form>
        </Panel>

        <Panel title="Account record">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className={labelCls}>Email</dt>
              <dd className="mt-0.5 break-all font-medium text-ink">{user?.email}</dd>
            </div>
            <div>
              <dt className={labelCls}>Role</dt>
              <dd className="mt-0.5 font-medium uppercase text-ink">{user?.role}</dd>
            </div>
            <div>
              <dt className={labelCls}>Organization</dt>
              <dd className="mt-0.5 font-medium text-ink">{user?.organizationName || '—'}</dd>
            </div>
            <div>
              <dt className={labelCls}>Account status</dt>
              <dd className="mt-0.5 font-medium text-ink">{user?.accountStatus}</dd>
            </div>
          </dl>
        </Panel>

        {isAdmin && (
          <Panel title="Verification mail" className="lg:col-span-3">
            {mailError && <Alert kind="error">{mailError}</Alert>}
            {mail && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${labelCls} ${mail.configured ? 'text-sage' : 'text-brick'}`}>
                    {mail.configured ? '● Configured' : '○ Disabled (dev mode)'}
                  </span>
                  <span className="text-sm text-ink-700/70">
                    Verification links are{' '}
                    {mail.enabled ? 'emailed to registrants' : 'returned by the API for development'}.
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className={labelCls}>SMTP host</dt>
                    <dd className="mt-0.5 break-all font-medium text-ink">{mail.host || '—'}</dd>
                  </div>
                  <div>
                    <dt className={labelCls}>SMTP port</dt>
                    <dd className="mt-0.5 font-medium text-ink">{mail.port}</dd>
                  </div>
                  <div>
                    <dt className={labelCls}>Sender</dt>
                    <dd className="mt-0.5 break-all font-medium text-ink">{mail.displayName} &lt;{mail.from}&gt;</dd>
                  </div>
                  <div>
                    <dt className={labelCls}>Verify link base</dt>
                    <dd className="mt-0.5 break-all text-sm font-medium text-ink">{mail.verifyUrl}</dd>
                  </div>
                </dl>

                <form onSubmit={sendTest} className="mt-6 flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Field label="Send a test message to" id="mailTestTo">
                      <input
                        id="mailTestTo"
                        type="email"
                        required
                        disabled={!mail.enabled}
                        className={inputClass}
                        placeholder="you@division.example"
                        value={testTo}
                        onChange={(e) => setTestTo(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Button type="submit" disabled={testing || !mail.enabled}>
                    {testing ? 'Sending…' : 'Send test email'}
                  </Button>
                </form>
                {testResult && <Alert kind="success">{testResult}</Alert>}
                {!mail.enabled && (
                  <p className="mt-3 text-xs text-ink-700/70">
                    Mail delivery is off. Set <code className="font-mono">MAIL_ENABLED=true</code>,{' '}
                    <code className="font-mono">MAIL_HOST</code>, <code className="font-mono">MAIL_USERNAME</code> and{' '}
                    <code className="font-mono">MAIL_PASSWORD</code> (and <code className="font-mono">MAIL_FROM</code>) to deliver
                    verification links by email.
                  </p>
                )}
              </>
            )}
          </Panel>
        )}
      </div>
    </AppShell>
  )
}
