/* ─────────────────────────────────────────────────────────────────────────
 * RWB PROJECT REVIEW SYSTEM — REGISTER (auth surface)
 *
 * Two-column layout with exact design tokens.
 * ALL registration logic, API calls, validation, and state preserved.
 * UI/UX only — confirm password + terms checkbox added for UX polish.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, ShieldAlert, User } from 'lucide-react'
import { api } from '../lib/api'

/* ── Design tokens ────────────────────────────────────────────────────── */
const TOKENS = {
  navy:    '#0f2540',
  navy2:   '#16324f',
  accent:  '#1c5d8c',
  accent2: '#2f8f6f',
  ink:     '#111827',
  muted:   '#5b6675',
  line:    '#e4e9ee',
  bg1:     '#eef5f7',
  bg2:     '#e6f0ee',
  card:    '#ffffff',
}

const inputCls =
  'h-[48px] w-full rounded-[10px] border bg-[#f4f7fa] pl-11 pr-11 text-[14px] text-[#111827] outline-none transition-all duration-200 placeholder:text-[#9aa3ad] focus:border-[#1c5d8c] focus:shadow-[0_0_0_3px_rgba(28,93,140,0.12)] focus:bg-white'
const inputClsDefault =
  'h-[48px] w-full rounded-[10px] border bg-[#f4f7fa] pl-11 pr-4 text-[14px] text-[#111827] outline-none transition-all duration-200 placeholder:text-[#9aa3ad] focus:border-[#1c5d8c] focus:shadow-[0_0_0_3px_rgba(28,93,140,0.12)] focus:bg-white'

const iconCls =
  'pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#1c5d8c]/60 transition-colors duration-200'

/* ── Password field with show/hide ────────────────────────────────────── */
function PasswordField({ id, label, value, onChange, placeholder, minLength, autoComplete, error }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-[#111827]">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors duration-200" style={{ color: show ? '#1c5d8c' : '#8a95a3' }} aria-hidden="true" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${inputCls} pr-11 ${error ? 'border-[#b34a4a]' : 'border-[#e4e9ee]'}`}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition-colors duration-200"
          style={{ color: show ? '#1c5d8c' : '#8a95a3' }}
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error && <p role="alert" className="text-[12px] font-medium text-[#b34a4a]">{error}</p>}
    </div>
  )
}

/* ── Main register page ───────────────────────────────────────────────── */
export default function Register() {
  const [lang, setLang] = useState('en')
  const [form, setForm] = useState({ fullName: '', organizationName: '', email: '', password: '', confirmPassword: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(null)
  const [resending, setResending] = useState(false)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      if (fieldErrors[field]) setFieldErrors((f) => ({ ...f, [field]: '' }))
    }
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Enter a valid email address.'
    if (!form.organizationName.trim()) errs.organizationName = 'Organization is required.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 12) errs.password = 'Password must be at least 12 characters.'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    if (!agreed) errs.agreed = 'You must agree to the terms.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await api('/auth/register', { method: 'POST', body: {
        fullName: form.fullName.trim(),
        organizationName: form.organizationName.trim(),
        email: form.email.trim(),
        password: form.password,
      }})
      setRegistered(res)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen font-sans" style={{ color: TOKENS.ink }}>
      {/* ═══════════════════ LEFT PANEL — RWB BRANDING ═══════════════════ */}
      <div className="relative hidden w-[40%] overflow-hidden lg:flex lg:flex-col">
        {/* Deep ocean gradient — matching SignIn */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #041525 0%, #0a2540 20%, #0d3b66 45%, #1a6b8a 70%, #2d8f6f 90%, #0d5e4a 100%)' }} />

        {/* Animated flowing water lines */}
        <div className="animate-water-flow absolute inset-0 opacity-[0.06]">
          <svg viewBox="0 0 2880 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" fill="none" stroke="white" strokeWidth="0.7">
            <path d="M0 180 C 240 140, 480 220, 720 180 C 960 140, 1200 220, 1440 180 C 1680 140, 1920 220, 2160 180 C 2400 140, 2640 220, 2880 180" />
            <path d="M0 220 C 240 180, 480 260, 720 220 C 960 180, 1200 260, 1440 220 C 1680 180, 1920 260, 2160 220 C 2400 180, 2640 260, 2880 220" />
            <path d="M0 260 C 240 220, 480 300, 720 260 C 960 220, 1200 300, 1440 260 C 1680 220, 1920 300, 2160 260 C 2400 220, 2640 300, 2880 260" />
            <path d="M0 400 C 300 360, 540 440, 780 400 C 1020 360, 1260 440, 1500 400 C 1740 360, 1980 440, 2220 400 C 2460 360, 2700 440, 2880 400" />
            <path d="M0 440 C 300 400, 540 480, 780 440 C 1020 400, 1260 480, 1500 440 C 1740 400, 1980 480, 2220 440 C 2460 400, 2700 480, 2880 440" />
            <path d="M0 620 C 360 580, 600 660, 840 620 C 1080 580, 1320 660, 1560 620 C 1800 580, 2040 660, 2280 620 C 2520 580, 2760 660, 2880 620" />
            <path d="M0 660 C 360 620, 600 700, 840 660 C 1080 620, 1320 700, 1560 660 C 1800 620, 2040 700, 2280 660 C 2520 620, 2760 700, 2880 660" />
          </svg>
        </div>

        {/* Animated wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[180px] overflow-hidden">
          <svg className="animate-water-flow absolute bottom-0 h-[180px] w-[200%]" viewBox="0 0 2880 180" preserveAspectRatio="none" fill="none">
            <path d="M0 120 C 240 80, 480 140, 720 100 C 960 60, 1200 120, 1440 80 C 1680 40, 1920 100, 2160 60 C 2400 20, 2640 80, 2880 40 L2880 180 L0 180 Z" fill="rgba(79,195,247,0.08)" />
            <path d="M0 140 C 280 100, 560 160, 840 120 C 1120 80, 1400 140, 1680 100 C 1960 60, 2240 120, 2520 80 C 2800 40, 2880 60, 2880 60 L2880 180 L0 180 Z" fill="rgba(45,143,111,0.06)" />
            <path d="M0 155 C 320 130, 640 165, 960 140 C 1280 115, 1600 150, 1920 125 C 2240 100, 2560 135, 2880 110 L2880 180 L0 180 Z" fill="rgba(15,95,168,0.05)" />
          </svg>
        </div>

        {/* Mountain + water silhouette */}
        <div className="animate-water-shimmer absolute bottom-[18%] right-[6%] opacity-[0.08]">
          <svg viewBox="0 0 360 240" className="w-[260px] xl:w-[300px]" fill="none" aria-hidden="true">
            <path d="M0 220 L40 160 L80 180 L130 100 L180 140 L220 80 L270 130 L310 90 L360 220 Z" fill="white" opacity="0.25" />
            <path d="M0 190 Q 30 180, 60 190 Q 90 200, 120 190 Q 150 180, 180 190 Q 210 200, 240 190 Q 270 180, 300 190 Q 330 200, 360 190" stroke="white" strokeWidth="1.5" opacity="0.5" />
            <path d="M0 200 Q 40 193, 80 200 Q 120 207, 160 200 Q 200 193, 240 200 Q 280 207, 320 200 Q 350 193, 360 200" stroke="white" strokeWidth="1" opacity="0.35" />
            <circle cx="180" cy="210" r="12" stroke="white" strokeWidth="0.7" opacity="0.3" />
            <circle cx="180" cy="210" r="22" stroke="white" strokeWidth="0.5" opacity="0.2" />
            <circle cx="180" cy="210" r="32" stroke="white" strokeWidth="0.4" opacity="0.12" />
            <path d="M300 40 Q 305 30, 310 40 Q 315 55, 305 60 Q 295 55, 300 40 Z" fill="white" opacity="0.15" />
          </svg>
        </div>

        {/* Soft radial glows */}
        <div className="absolute left-[-15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(26,107,138,0.2)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(79,195,247,0.12)_0%,transparent_70%)]" />
        <div className="absolute left-[30%] top-[40%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(45,143,111,0.1)_0%,transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Top — Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/rwb-logo-horizontal.png"
              alt="RWB Logo"
              className="h-16 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Official Government Platform
            </p>
          </div>

          {/* Center — Identity */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: '#1c5d8c' }}>
              Rwanda Water Resources Board
            </p>
            <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white xl:text-[44px]">
              Project<br />Review System
            </h1>
            <p className="mt-5 max-w-[380px] text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Securely manage, review, and monitor water resource projects across Rwanda.
            </p>

            {/* Features */}
            <div className="mt-8 space-y-4">
              {[
                { title: 'Project Management', desc: 'Review and manage submitted water-resource projects.' },
                { title: 'Structured Review Workflow', desc: 'Track projects through every stage of assessment.' },
                { title: 'Secure Document Handling', desc: 'Manage project documents through a controlled platform.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: '#4fc3f7' }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.title}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — Security */}
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Secure Government Platform</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT PANEL — REGISTER FORM ═══════════════════ */}
      <div className="relative flex flex-1 flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #eef2f7 0%, #e8eef5 30%, #dfe8ee 60%, #e4ecea 100%)' }}>
        {/* Fluid blob — top-right corner, very subtle blue */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(28,93,140,0.07) 0%, transparent 70%)' }} />
        {/* Fluid blob — bottom-left, faint teal accent */}
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[320px] w-[320px] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(47,143,111,0.06) 0%, transparent 70%)', animationDelay: '-8s' }} />
        {/* Language switcher */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5 shadow-sm sm:right-6 sm:top-6">
          {[{ code: 'en', label: 'EN' }, { code: 'kin', label: 'KIN' }, { code: 'fr', label: 'FR' }].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className="rwb-focus-blue rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200"
              style={{
                backgroundColor: lang === l.code ? TOKENS.navy : 'transparent',
                color: lang === l.code ? 'white' : TOKENS.muted,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-6 sm:px-8 sm:pb-12">
          <div className="w-full max-w-[460px]">
            {/* Mobile logo */}
            <div className="mb-5 flex flex-col items-center text-center lg:hidden">
              <img src="/assets/rwb-logo-horizontal.png" alt="RWB Logo" className="h-28 w-auto object-contain drop-shadow-md" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#1c5d8c' }}>Rwanda Water Resources Board</p>
            </div>

            {/* Header */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: '#1c5d8c' }}>
                RWB Project Review System
              </p>
              <h2 className="text-[30px] font-extrabold leading-tight tracking-[-0.01em] text-[#0f2540] sm:text-[34px]">
                {registered ? 'Check Your Inbox' : 'Create Account'}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#5b6675]">
                {registered
                  ? 'Your application has entered the review ledger and now awaits verification.'
                  : 'Register to submit and track your water resource projects.'}
              </p>
            </div>

            {/* Card — clean white, subtle glass at edges */}
            <div className="rounded-2xl border border-[#e4e9ee] bg-white/[0.97] p-6 shadow-[0_8px_32px_rgba(15,95,168,0.12),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:p-8">
              {registered ? (
                <div className="space-y-4">
                  {registered.emailSent ? (
                    <div role="status" className="flex items-start gap-3 rounded-xl border border-[#4a7c59]/30 bg-[#4a7c59]/8 px-4 py-3 text-sm leading-relaxed text-[#111827]">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#4a7c59]" aria-hidden="true" />
                      <span><span className="font-semibold">{registered.email}</span> — a verification link has been emailed to this address. Open it to continue your application.</span>
                    </div>
                  ) : (
                    <div role="status" className="flex items-start gap-3 rounded-xl border border-[#4a7c59]/30 bg-[#4a7c59]/8 px-4 py-3 text-sm leading-relaxed text-[#111827]">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#4a7c59]" aria-hidden="true" />
                      <span><span className="font-semibold">{registered.email}</span> is one verification step from administrative review.</span>
                    </div>
                  )}

                  {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#b34a4a]/30 bg-[#b34a4a]/8 px-4 py-3 text-sm font-medium text-[#b34a4a]">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  {!registered.emailSent && registered.verificationToken && (
                    <div role="status" className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-relaxed">
                      <p className="mb-1 font-semibold" style={{ color: '#1c5d8c' }}>Development build — verification link</p>
                      <p className="mb-2 text-xs" style={{ color: '#5b6675' }}>No mail transport configured, so the token is returned directly:</p>
                      <Link to={`/verify-email?token=${encodeURIComponent(registered.verificationToken)}`} className="rwb-focus-blue break-all font-mono text-[11px] underline underline-offset-4" style={{ color: '#1c5d8c' }}>
                        /verify-email?token={registered.verificationToken}
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-line pt-4 text-center">
                    <button type="button" disabled={resending} onClick={async () => {
                      setResending(true)
                      try { const res = await api('/auth/resend', { method: 'POST', body: { email: registered.email } }); setRegistered(res) }
                      catch (err) { setError(err.message || 'Unable to resend verification.') }
                      finally { setResending(false) }
                    }} className="rwb-focus-blue text-[13px] font-semibold underline-offset-4 transition-colors hover:underline disabled:opacity-50" style={{ color: '#1c5d8c' }}>
                      {resending ? 'Issuing new link…' : 'Lost the link? Resend verification'}
                    </button>
                  </div>

                  <p className="pt-1 text-center text-[13px]" style={{ color: '#5b6675' }}>
                    Already verified?{' '}
                    <Link to="/signin" className="rwb-focus-blue font-semibold underline-offset-4 hover:underline" style={{ color: '#1c5d8c' }}>Sign in</Link>
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#b34a4a]/30 bg-[#b34a4a]/8 px-3.5 py-2.5 text-sm font-medium text-[#b34a4a]">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg-fullName" className="block text-[13px] font-semibold text-[#111827]">Full Name</label>
                    <div className="relative">
                      <User className={iconCls} aria-hidden="true" />
                      <input id="reg-fullName" type="text" autoComplete="name" required placeholder="e.g. Jean Mugisha" value={form.fullName} onChange={set('fullName')}
                        className={`${inputCls} ${fieldErrors.fullName ? 'border-[#b34a4a]' : 'border-line'}`} />
                    </div>
                    {fieldErrors.fullName && <p role="alert" className="text-[12px] font-medium text-[#b34a4a]">{fieldErrors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg-email" className="block text-[13px] font-semibold text-[#111827]">Email Address</label>
                    <div className="relative">
                      <Mail className={iconCls} aria-hidden="true" />
                      <input id="reg-email" type="email" autoComplete="email" required placeholder="e.g. jane@division.example" value={form.email} onChange={set('email')}
                        className={`${inputCls} ${fieldErrors.email ? 'border-[#b34a4a]' : 'border-line'}`} />
                    </div>
                    {fieldErrors.email && <p role="alert" className="text-[12px] font-medium text-[#b34a4a]">{fieldErrors.email}</p>}
                  </div>

                  {/* Organization */}
                  <div className="space-y-1.5">
                    <label htmlFor="reg-org" className="block text-[13px] font-semibold text-[#111827]">Organization / Company Name</label>
                    <div className="relative">
                      <Building2 className={iconCls} aria-hidden="true" />
                      <input id="reg-org" type="text" required placeholder="e.g. Coastal Infrastructure Division" value={form.organizationName} onChange={set('organizationName')}
                        className={`${inputCls} ${fieldErrors.organizationName ? 'border-[#b34a4a]' : 'border-line'}`} />
                    </div>
                    {fieldErrors.organizationName && <p role="alert" className="text-[12px] font-medium text-[#b34a4a]">{fieldErrors.organizationName}</p>}
                  </div>

                  {/* Password */}
                  <PasswordField id="reg-password" label="Password" value={form.password} onChange={set('password')} placeholder="••••••••••••" minLength={12} autoComplete="new-password" error={fieldErrors.password} />

                  {/* Confirm Password */}
                  <PasswordField id="reg-confirm" label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••••••" minLength={12} autoComplete="new-password" error={fieldErrors.confirmPassword} />

                  {/* Terms checkbox */}
                  <div className="space-y-1">
                    <label className="flex cursor-pointer select-none items-start gap-2.5 text-[13px]" style={{ color: '#5b6675' }}>
                      <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (fieldErrors.agreed) setFieldErrors((f) => ({ ...f, agreed: '' })) }} className="mt-0.5 h-4 w-4 rounded border-line accent-accent" />
                      <span>I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} className="font-semibold underline underline-offset-2 hover:no-underline" style={{ color: TOKENS.accent }}>Terms of Service</a> and <a href="#privacy" onClick={(e) => e.preventDefault()} className="font-semibold underline underline-offset-2 hover:no-underline" style={{ color: TOKENS.accent }}>Privacy Policy</a></span>
                    </label>
                    {fieldErrors.agreed && <p role="alert" className="text-[12px] font-medium text-[#b34a4a]">{fieldErrors.agreed}</p>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-[48px] w-full items-center justify-center gap-2.5 rounded-[10px] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(15,37,64,0.3)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(15,37,64,0.4)] hover:brightness-110 active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: `linear-gradient(180deg, ${TOKENS.navy} 0%, ${TOKENS.navy2} 100%)` }}
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Sign in link */}
              <p className="mt-6 border-t border-[#e4e9ee] pt-5 text-center text-[13px]" style={{ color: '#5b6675' }}>
                Already have an account?{' '}
                <Link to="/signin" className="rwb-focus-blue font-semibold underline-offset-4 hover:underline" style={{ color: TOKENS.accent }}>Sign in</Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex flex-col items-center gap-1 px-4 pb-5 text-center">
          <p className="text-[13px] font-medium" style={{ color: '#5b6675' }}>© 2026 Rwanda Water Resources Board</p>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(28,93,140,0.6)' }}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Secure Government Project Review System
          </p>
          <p className="text-[11px]" style={{ color: '#9ca3af' }}>This connection is encrypted and monitored for security.</p>
          <div className="mt-1 flex items-center gap-5">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="rwb-focus-blue text-[12px] font-medium underline-offset-4 hover:underline" style={{ color: '#1c5d8c' }}>Privacy</a>
            <span style={{ color: '#d1d5db' }}>·</span>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="rwb-focus-blue text-[12px] font-medium underline-offset-4 hover:underline" style={{ color: '#1c5d8c' }}>Terms</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
