import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import RubberStamp from '../components/RubberStamp'
import { Button } from '../components/ui'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [state, setState] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')
  const fired = useRef(null)

  useEffect(() => {
    // Keyed on the token: dedupes React StrictMode's dev double-invoke (same
    // token fires once — the server clears it on first use) while still
    // allowing a genuinely new token to verify on retry.
    if (fired.current === token) return
    fired.current = token
    if (!token) {
      setState('error')
      setMessage('No verification token was provided. Use the link from your registration email.')
      return
    }
    // No `cancelled` cleanup flag here: React StrictMode (dev) runs this effect
    // twice — mount, simulated unmount, remount. A cleanup-set flag would cancel
    // the in-flight request before it resolves and the `fired` ref guard would
    // then block the retry, leaving the page stuck on "Verifying email". The
    // ref survives the simulated remount, so checking it in the handlers still
    // dedupes retries while letting the first request complete.
    api(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (fired.current !== token) return // superseded by a newer token
        setState('success')
        setMessage(res.message)
      })
      .catch((err) => {
        if (fired.current !== token) return
        setState('error')
        setMessage(err.message || 'Verification failed.')
      })
  }, [token])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <div className="animate-fade-up w-full max-w-md rounded-lg border border-ink/10 bg-paper p-8 text-center shadow-[0_8px_24px_-12px_rgba(18,35,63,0.25)]">
        <div className="flex justify-center mb-3">
          <img src="/assets/rwb-logo-vertical.png" alt="RWB Logo" className="h-24 w-24 object-contain drop-shadow-md" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink-700/60">RWB Review Ledger</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {state === 'verifying' && 'Verifying email'}
          {state === 'success' && 'Email verified'}
          {state === 'error' && 'Verification failed'}
        </h1>

        <div className="my-6 flex justify-center">
          {state === 'success' ? (
            <RubberStamp status="SUBMITTED" size="lg" tilt={-4} />
          ) : (
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink/15">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-amber" />
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-ink-700/90">{message}</p>

        {state === 'success' && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-ink-700/70">
              Your registration now passes to the administration for review.
            </p>
            <Button onClick={() => navigate('/signin')} className="w-full">
              Continue to sign in
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="mt-6">
            <Link to="/register" className="text-sm font-semibold text-amber-dark underline-offset-4 hover:underline">
              Request a new registration
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
