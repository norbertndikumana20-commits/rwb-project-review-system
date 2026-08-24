import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, homePathFor } from '../lib/auth'
import RubberStamp from '../components/RubberStamp'
import { Button } from '../components/ui'

export default function PendingReview() {
  const { user, loading, refresh, signOut } = useAuth()
  const navigate = useNavigate()
  const [declined, setDeclined] = useState(false)

  // Poll /api/me so the page advances the moment administration acts.
  useEffect(() => {
    if (!user || declined) return
    const timer = setInterval(async () => {
      try {
        const me = await refresh()
        if (me.accountStatus === 'ACTIVE_FIRST_PROJECT_REQUIRED' || me.accountStatus === 'ACTIVE') {
          navigate(homePathFor(me.accountStatus), { replace: true })
        } else if (me.accountStatus === 'REJECTED') {
          setDeclined(true)
        }
      } catch {
        // Session may have been revoked; the auth layer will handle it.
      }
    }, 8000)
    return () => clearInterval(timer)
  }, [user, refresh, navigate, declined])

  if (loading) return null
  if (!user) return <Navigate to="/signin" replace />

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <div className="animate-fade-up w-full max-w-lg text-center">
        <div className="flex justify-center mb-2">
          <img src="/assets/rwb-logo-vertical.png" alt="RWB Logo" className="h-20 w-20 object-contain drop-shadow-md" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-700/60">
          RWB Review Ledger · Application {user.id.toString().padStart(4, '0')}
        </p>

        {declined ? (
          <div className="mt-4">
            <RubberStamp status="REJECTED" size="lg" tilt={-5} />
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink">
              Registration declined
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-700/90">
              The administration was unable to approve this application. Please contact the review body
              for further detail.
            </p>
            <div className="mt-8">
              <Button variant="secondary" onClick={signOut}>
                Return to sign in
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="my-6 flex justify-center">
              <RubberStamp status="IN_REVIEW" size="lg" tilt={-4} />
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
              Pending administrative review
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-700/90">
              Thank you, <span className="font-semibold text-ink">{user.fullName}</span>. Your registration
              has been received and docketed. The administration reviews every application before
              accounts may submit projects. This page refreshes automatically.
            </p>

            <div className="mx-auto mt-8 max-w-sm rounded-lg border border-ink/10 bg-paper-dark/60 p-5 text-left">
              <dl className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <dt className="uppercase tracking-[0.18em] text-ink-700/60">Applicant</dt>
                  <dd className="font-medium text-ink">{user.fullName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="uppercase tracking-[0.18em] text-ink-700/60">Organization</dt>
                  <dd className="font-medium text-ink">{user.organizationName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="uppercase tracking-[0.18em] text-ink-700/60">Status</dt>
                  <dd className="font-medium text-amber-dark">PENDING ADMIN REVIEW</dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-amber" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-700/60">
                Awaiting decision · this page refreshes every 8s
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
