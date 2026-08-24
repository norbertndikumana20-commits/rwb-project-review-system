/* ─────────────────────────────────────────────────────────────────────────
 * RWB PROJECT REVIEW SYSTEM — SIGN IN (auth surface)
 *
 * Two-column redesign: left branding panel + right login card.
 * ALL authentication logic, validation, MFA, language, support modal,
 * remember-me, lockout, and accessibility behavior preserved exactly.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Copy, Eye, EyeOff, LifeBuoy, Lock, Mail, Phone, ShieldCheck, ShieldAlert, X } from 'lucide-react'
import { useAuth, homePathFor } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { api } from '../lib/api'
import { useFocusTrap } from '../hooks/useFocusTrap'

/* ── EN / KIN / FR strings ─────────────────────────────────────────────── */
const T = {
  en: {
    wordmark: 'Rwanda Water Resources Board',
    systemLabel: 'RWB Project Review System',
    title: 'Welcome Back',
    subtitle: 'Sign in to securely access the project review platform.',
    email: 'Email Address',
    emailPh: 'Enter your email',
    password: 'Password',
    passwordPh: 'Enter your password',
    remember: 'Remember me',
    forgot: 'Forgot Password?',
    signIn: 'Sign In',
    signingIn: 'Signing in…',
    needHelp: 'Need Help?',
    contact: 'Contact RWB Support Team',
    newTo: 'New to the platform?',
    requestReg: 'Request a registration',
    emailRequired: 'Email is required.',
    emailInvalid: 'Enter a valid email address.',
    passwordRequired: 'Password is required.',
    badCredentials: 'Incorrect email or password. Please try again.',
    serverError: 'Something went wrong on the server. Please try again in a moment.',
    locked: 'Too many attempts. Contact your administrator to unlock your account.',
    mfaTitle: 'Two-factor verification',
    mfaSubtitle: 'Enter the 6-digit code sent to your email.',
    code: 'Verification code',
    verify: 'Verify',
    verifying: 'Verifying…',
    codeInvalid: 'Enter the 6-digit code.',
    back: 'Back to sign in',
    secure: 'Secure Government Project Review System',
    securityNote: 'This connection is encrypted and monitored for security.',
    privacy: 'Privacy',
    terms: 'Terms',
    brandDesc: 'Securely manage, review, and monitor water resource projects across Rwanda.',
    officialSystem: 'Official Government Platform',
  },
  kin: {
    wordmark: 'Rwanda Water Resources Board',
    systemLabel: 'RWB Project Review System',
    title: 'Murakaza neza',
    subtitle: 'Injira kugira ngo ukoreshe RWB Project Review System.',
    email: 'Aderesi ya imeyili',
    emailPh: 'Andika imeyili yawe',
    password: 'Ijambobanga',
    passwordPh: 'Andika ijambobanga ryawe',
    remember: 'Unibuke',
    forgot: 'Wibagiwe ijambobanga?',
    signIn: 'Injira',
    signingIn: 'Kwinjira…',
    needHelp: 'Ukeneye ubufasha?',
    contact: 'Baza itsinda rya RWB',
    newTo: 'Ushya kuri platform?',
    requestReg: 'Saba kwiyandikisha',
    emailRequired: 'Imeyili irakenewe.',
    emailInvalid: 'Andika aderesi y\'imeyili yemewe.',
    passwordRequired: 'Ijambobanga rirakenewe.',
    badCredentials: 'Imeyili cyangwa ijambobanga si byo. Ongera ugerageze.',
    serverError: 'Hari ikibazo kuri seriveri. Ongera ugerageze nyuma gato.',
    locked: 'Wagerageje inshuro nyinshi. Baza umuyobozi wawe kugira ngo afungure konte yawe.',
    mfaTitle: 'Kugenzura inshuro ebyiri',
    mfaSubtitle: 'Andika kode y\'imyaka 6 yoherejwe ku imeyili yawe.',
    code: 'Kode y\'ubugenzura',
    verify: 'Kugenzura',
    verifying: 'Kugenzura…',
    codeInvalid: 'Andika kode y\'imyaka 6.',
    back: 'Subira mu kwinjira',
    secure: 'Secure Government Project Review System',
    securityNote: 'Iyi connection irinzwe kandi irakurikirwa.',
    privacy: 'Ku banga',
    terms: 'Amategeko',
    brandDesc: 'Gukurikirana, gukjya mu ibaruramishinga no gucunga inganda z\'amazi mu Rwanda.',
    officialSystem: 'Urubuga rw\'abahungabana n\'ubuyobozi',
  },
  fr: {
    wordmark: 'Rwanda Water Resources Board',
    systemLabel: 'RWB Project Review System',
    title: 'Bon retour',
    subtitle: 'Connectez-vous pour accéder au système de revue de projets de la RWB.',
    email: 'Adresse e-mail',
    emailPh: 'Saisissez votre e-mail',
    password: 'Mot de passe',
    passwordPh: 'Saisissez votre mot de passe',
    remember: 'Se souvenir de moi',
    forgot: 'Mot de passe oublié ?',
    signIn: 'Se connecter',
    signingIn: 'Connexion…',
    needHelp: "Besoin d'aide ?",
    contact: "Contacter l'assistance RWB",
    newTo: 'Nouveau sur la plateforme ?',
    requestReg: 'Demander une inscription',
    emailRequired: "L'e-mail est requis.",
    emailInvalid: 'Saisissez une adresse e-mail valide.',
    passwordRequired: 'Le mot de passe est requis.',
    badCredentials: 'E-mail ou mot de passe incorrect. Veuillez réessayer.',
    serverError: 'Une erreur serveur s\'est produite. Veuillez réessayer dans un instant.',
    locked: 'Trop de tentatives. Contactez votre administrateur pour déverrouiller votre compte.',
    mfaTitle: 'Vérification en deux étapes',
    mfaSubtitle: 'Saisissez le code à 6 chiffres envoyé à votre e-mail.',
    code: 'Code de vérification',
    verify: 'Vérifier',
    verifying: 'Vérification…',
    codeInvalid: 'Saisissez le code à 6 chiffres.',
    back: 'Retour à la connexion',
    secure: 'Secure Government Project Review System',
    securityNote: 'Cette connexion est chiffrée et surveillée.',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    brandDesc: 'Gérez, évaluez et surveillez les projets de ressources hydrauliques au Rwanda.',
    officialSystem: 'Plateforme gouvernementale officielle',
  },
}

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'kin', label: 'KIN' },
  { code: 'fr', label: 'FR' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_ATTEMPTS = 5
const REMEMBER_KEY = 'rwb.rememberedEmail'

const inputCls =
  'rwb-focus-blue h-[52px] w-full rounded-xl border bg-white pl-11 pr-11 text-[15px] text-[#1a2332] outline-none transition-all duration-200 ease-in-out placeholder:text-[#9aa3ad] focus:border-[#0f5fa8] focus:shadow-[0_0_0_3px_rgba(15,95,168,0.12)]'

const iconCls =
  'pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0f5fa8]/60 transition-colors duration-200'

/* ── Support modal — renders dynamic phone numbers from app settings ──── */
function SupportModal({ onClose, supportEmail, supportPhones }) {
  const trapRef = useFocusTrap(onClose)
  const [copied, setCopied] = useState('')

  async function copyText(kind, text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(kind)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-[#e3e6ea] bg-white p-6 shadow-[0_25px_60px_rgba(0,0,0,0.2)] sm:p-8"
      >
        <button
          onClick={onClose}
          className="rwb-focus-blue absolute right-3 top-3 rounded-lg p-2 text-[#6b7280] transition-colors hover:bg-gray-100 hover:text-[#1a2332]"
          aria-label="Close support"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-[#0f5fa8]/10 p-2.5 text-[#0f5fa8]">
            <LifeBuoy className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 id="support-modal-title" className="text-lg font-bold text-[#1a2332]">
              RWB Support Team
            </h2>
            <p className="text-sm text-[#6b7280]">We respond during office hours</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#6b7280]">
          Our support team can help with password resets, account issues, and registration
          questions. Write to us with the email address on your account.
        </p>
        <div className="mt-5 space-y-2.5">
          {/* Support email */}
          {supportEmail && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e3e6ea] bg-[#f7f6f3] px-4 py-3">
              <a
                href={`mailto:${supportEmail}`}
                className="rwb-focus-blue min-w-0 truncate font-mono text-sm font-semibold text-[#0f5fa8] underline-offset-4 hover:underline"
              >
                {supportEmail}
              </a>
              <button
                onClick={() => copyText('email', supportEmail)}
                className="rwb-focus-blue inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e3e6ea] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a2332] transition-colors hover:border-[#0f5fa8] hover:text-[#0f5fa8]"
                aria-label="Copy support email address"
              >
                {copied === 'email' ? (
                  <><Check className="h-3.5 w-3.5 text-[#4a7c59]" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
            </div>
          )}
          {/* Support phone numbers — all non-empty ones from settings */}
          {supportPhones.filter(Boolean).map((phone, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-[#e3e6ea] bg-[#f7f6f3] px-4 py-3">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="rwb-focus-blue inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-[#0f5fa8] underline-offset-4 hover:underline"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{phone}</span>
              </a>
              <button
                onClick={() => copyText(`phone-${i}`, phone.replace(/\s+/g, ''))}
                className="rwb-focus-blue inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e3e6ea] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a2332] transition-colors hover:border-[#0f5fa8] hover:text-[#0f5fa8]"
                aria-label={`Copy phone number ${phone}`}
              >
                {copied === `phone-${i}` ? (
                  <><Check className="h-3.5 w-3.5 text-[#4a7c59]" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[13px] text-[#6b7280]">
          <span>Monday – Friday · 08:00 – 17:00 (CAT)</span>
          <span>Authorized users only</span>
        </div>
      </div>
    </div>
  )
}

/* ── Main sign-in page ─────────────────────────────────────────────────── */
export default function SignIn() {
  const { signIn, completeSignIn } = useAuth()
  const { settings } = useTheme()
  const navigate = useNavigate()
  const [lang, setLang] = useState('en')
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBER_KEY)))
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })
  const [banner, setBanner] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)
  const [mfaEmail, setMfaEmail] = useState('')
  const [devCode, setDevCode] = useState(null)
  const [authedUser, setAuthedUser] = useState(null)
  const [showSupport, setShowSupport] = useState(false)

  // Dynamic support contact info from app settings
  const supportEmail = settings['app.support.email'] || 'support@rwb.gov.rw'
  const supportPhones = [
    settings['app.support.phone_1'] || '',
    settings['app.support.phone_2'] || '',
    settings['app.support.phone_3'] || '',
    settings['app.support.phone_4'] || '',
  ]

  useEffect(() => {
    document.title = T[lang].title + ' · RWB Project Review System'
  }, [lang])

  const t = T[lang]

  /* ── inline validation (unchanged) ──────────────────────────────────── */
  function validateEmail(value) {
    if (!value.trim()) return t.emailRequired
    if (!EMAIL_RE.test(value.trim())) return t.emailInvalid
    return ''
  }
  function validatePassword(value) {
    if (!value) return t.passwordRequired
    return ''
  }
  function validateField(name, value) {
    const err = name === 'email' ? validateEmail(value) : validatePassword(value)
    setFieldErrors((f) => ({ ...f, [name]: err }))
    return err
  }

  /* ── credentials submit (unchanged) ─────────────────────────────────── */
  async function onSubmit(e) {
    e.preventDefault()
    setBanner('')
    setNotice('')
    const errEmail = validateField('email', email)
    const errPassword = validateField('password', password)
    if (errEmail || errPassword) return

    setSubmitting(true)
    try {
      const user = await signIn(email.trim(), password)
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim())
      else localStorage.removeItem(REMEMBER_KEY)
      setAuthedUser(user)
      setMfaEmail(email.trim())
      try {
        const res = await api('/auth/mfa/request', { method: 'POST', body: { email: email.trim() } })
        setDevCode(res.emailed ? null : (res.devCode || null))
      } catch {
        setDevCode(null)
      }
      setStep('mfa')
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        setStep('locked')
      } else if (err?.status === 401) {
        setBanner(t.badCredentials)
      } else if (err?.status === 403) {
        setBanner(err?.message || t.serverError)
      } else {
        setBanner(t.serverError)
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ── MFA step (unchanged) ───────────────────────────────────────────── */
  async function onMfaSubmit(e) {
    e.preventDefault()
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError(t.codeInvalid)
      return
    }
    setMfaError('')
    setMfaBusy(true)
    try {
      const res = await api('/auth/mfa/verify', { method: 'POST', body: { email: mfaEmail, code: mfaCode.trim() } })
      if (!res.valid) {
        setMfaError(res.message || t.codeInvalid)
        return
      }
      if (authedUser) completeSignIn(authedUser)
      navigate(homePathFor(authedUser?.accountStatus), { replace: true })
    } catch (err) {
      setMfaError(err.message || t.codeInvalid)
    } finally {
      setMfaBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen font-sans text-[#1a2332]">
      {/* ═══════════════════ LEFT PANEL — RWB BRANDING ═══════════════════ */}
      <div className="relative hidden w-[48%] overflow-hidden lg:flex lg:flex-col">
        {/* Deep ocean gradient — blue-to-aqua water system theme */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #041525 0%, #0a2540 20%, #0d3b66 45%, #1a6b8a 70%, #2d8f6f 90%, #0d5e4a 100%)' }} />

        {/* Animated flowing water lines — horizontal wave pattern */}
        <div className="animate-water-flow absolute inset-0 opacity-[0.06]">
          <svg viewBox="0 0 2880 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" fill="none" stroke="white" strokeWidth="0.7">
            {/* Upper water flow */}
            <path d="M0 180 C 240 140, 480 220, 720 180 C 960 140, 1200 220, 1440 180 C 1680 140, 1920 220, 2160 180 C 2400 140, 2640 220, 2880 180" />
            <path d="M0 220 C 240 180, 480 260, 720 220 C 960 180, 1200 260, 1440 220 C 1680 180, 1920 260, 2160 220 C 2400 180, 2640 260, 2880 220" />
            <path d="M0 260 C 240 220, 480 300, 720 260 C 960 220, 1200 300, 1440 260 C 1680 220, 1920 300, 2160 260 C 2400 220, 2640 300, 2880 260" />
            {/* Mid water flow */}
            <path d="M0 400 C 300 360, 540 440, 780 400 C 1020 360, 1260 440, 1500 400 C 1740 360, 1980 440, 2220 400 C 2460 360, 2700 440, 2880 400" />
            <path d="M0 440 C 300 400, 540 480, 780 440 C 1020 400, 1260 480, 1500 440 C 1740 400, 1980 480, 2220 440 C 2460 400, 2700 480, 2880 440" />
            {/* Lower water flow — deeper */}
            <path d="M0 620 C 360 580, 600 660, 840 620 C 1080 580, 1320 660, 1560 620 C 1800 580, 2040 660, 2280 620 C 2520 580, 2760 660, 2880 620" />
            <path d="M0 660 C 360 620, 600 700, 840 660 C 1080 620, 1320 700, 1560 660 C 1800 620, 2040 700, 2280 660 C 2520 620, 2760 700, 2880 660" />
          </svg>
        </div>

        {/* Animated wave at bottom — flowing water surface */}
        <div className="absolute bottom-0 left-0 right-0 h-[180px] overflow-hidden">
          <svg className="animate-water-flow absolute bottom-0 h-[180px] w-[200%]" viewBox="0 0 2880 180" preserveAspectRatio="none" fill="none">
            <path d="M0 120 C 240 80, 480 140, 720 100 C 960 60, 1200 120, 1440 80 C 1680 40, 1920 100, 2160 60 C 2400 20, 2640 80, 2880 40 L2880 180 L0 180 Z" fill="rgba(79,195,247,0.08)" />
            <path d="M0 140 C 280 100, 560 160, 840 120 C 1120 80, 1400 140, 1680 100 C 1960 60, 2240 120, 2520 80 C 2800 40, 2880 60, 2880 60 L2880 180 L0 180 Z" fill="rgba(45,143,111,0.06)" />
            <path d="M0 155 C 320 130, 640 165, 960 140 C 1280 115, 1600 150, 1920 125 C 2240 100, 2560 135, 2880 110 L2880 180 L0 180 Z" fill="rgba(15,95,168,0.05)" />
          </svg>
        </div>

        {/* Mountain + water silhouette — Rwanda landscape */}
        <div className="animate-water-shimmer absolute bottom-[18%] right-[6%] opacity-[0.08]">
          <svg viewBox="0 0 360 240" className="w-[300px] xl:w-[340px]" fill="none" aria-hidden="true">
            {/* Hills/mountains of Rwanda */}
            <path d="M0 220 L40 160 L80 180 L130 100 L180 140 L220 80 L270 130 L310 90 L360 220 Z" fill="white" opacity="0.25" />
            {/* Water surface — flowing waves */}
            <path d="M0 190 Q 30 180, 60 190 Q 90 200, 120 190 Q 150 180, 180 190 Q 210 200, 240 190 Q 270 180, 300 190 Q 330 200, 360 190" stroke="white" strokeWidth="1.5" opacity="0.5" />
            <path d="M0 200 Q 40 193, 80 200 Q 120 207, 160 200 Q 200 193, 240 200 Q 280 207, 320 200 Q 350 193, 360 200" stroke="white" strokeWidth="1" opacity="0.35" />
            {/* Ripple circles in water */}
            <circle cx="180" cy="210" r="12" stroke="white" strokeWidth="0.7" opacity="0.3" />
            <circle cx="180" cy="210" r="22" stroke="white" strokeWidth="0.5" opacity="0.2" />
            <circle cx="180" cy="210" r="32" stroke="white" strokeWidth="0.4" opacity="0.12" />
            {/* Water drop */}
            <path d="M300 40 Q 305 30, 310 40 Q 315 55, 305 60 Q 295 55, 300 40 Z" fill="white" opacity="0.15" />
          </svg>
        </div>

        {/* Soft radial glows — water-blue tones */}
        <div className="absolute left-[-15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(26,107,138,0.2)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(79,195,247,0.12)_0%,transparent_70%)]" />
        <div className="absolute left-[30%] top-[40%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(45,143,111,0.1)_0%,transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
          {/* Top — Logo + institution */}
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/assets/rwb-logo-horizontal.png"
                alt="RWB Logo"
                className="h-[100px] w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  {t.officialSystem}
                </p>
              </div>
            </div>
          </div>

          {/* Center — Institution identity */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4fc3f7]/80 mb-4">
              Rwanda Water Resources Board
            </p>
            <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white xl:text-[44px]">
              Project<br />Review System
            </h1>
            <p className="mt-5 max-w-[380px] text-[15px] leading-relaxed text-white/60">
              {t.brandDesc}
            </p>

            {/* Feature highlights */}
            <div className="mt-8 space-y-3.5">
              {[
                { title: 'Project Management', desc: 'Review and manage submitted water-resource projects.' },
                { title: 'Structured Review Workflow', desc: 'Track projects through every stage of assessment.' },
                { title: 'Secure Document Handling', desc: 'Manage project documents through a controlled platform.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4fc3f7]/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4fc3f7]" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-white/80">{item.title}</p>
                    <p className="text-[12px] text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — Security badge */}
          <div className="flex items-center gap-2 text-[12px] text-white/30">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Secure Government Platform</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ RIGHT PANEL — LOGIN FORM ═══════════════════ */}
      <div className="relative flex flex-1 flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #eef2f7 0%, #e8eef5 30%, #dfe8ee 60%, #e4ecea 100%)' }}>
        {/* Fluid blob — top-right corner, very subtle blue */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(28,93,140,0.07) 0%, transparent 70%)' }} />
        {/* Fluid blob — bottom-left, faint teal accent */}
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[320px] w-[320px] rounded-full blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(47,143,111,0.06) 0%, transparent 70%)', animationDelay: '-8s' }} />

        {/* Language switcher */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-0.5 rounded-full border border-[#e3e6ea] bg-white p-0.5 shadow-sm sm:right-6 sm:top-6">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              className={`rwb-focus-blue rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                lang === l.code
                  ? 'bg-[#0f5fa8] text-white shadow-sm'
                  : 'text-[#6b7280] hover:text-[#0f5fa8]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Main content area — moved slightly upward */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-6 sm:px-8 sm:pb-14">
          <div className="w-full max-w-[420px]">
            {/* Mobile-only logo (hidden on desktop where left panel shows it) */}
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <img
                src="/assets/rwb-logo-horizontal.png"
                alt="RWB Logo"
                className="h-28 w-auto object-contain drop-shadow-[0_4px_16px_rgba(15,95,168,0.15)]"
              />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0f5fa8]/70">
                Rwanda Water Resources Board
              </p>
            </div>

            {/* Header */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f5fa8]/70 mb-2">
                {t.systemLabel}
              </p>
              <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.01em] text-[#1a2332] sm:text-[32px]">
                {t.title}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280]">
                {t.subtitle}
              </p>
            </div>

            {/* Login card — clean white, subtle glass at edges */}
            <div className="rounded-[20px] border border-[#e3e6ea] bg-white/[0.97] p-6 shadow-[0_8px_32px_rgba(15,95,168,0.12),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:p-8">
              {step === 'locked' ? (
                <div className="py-6 text-center" role="alert">
                  <ShieldAlert className="mx-auto h-10 w-10 text-[#b34a4a]" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold text-[#1a2332]">{t.locked}</h3>
                  <p className="mt-2 text-sm text-[#6b7280]">
                    {t.needHelp}{' '}
                    <button
                      type="button"
                      onClick={() => setShowSupport(true)}
                      className="rwb-focus-blue font-semibold text-[#0f5fa8] underline-offset-4 hover:underline"
                    >
                      {t.contact}
                    </button>
                  </p>
                </div>
              ) : step === 'mfa' ? (
                <form onSubmit={onMfaSubmit} className="space-y-5" noValidate>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0f5fa8]/10">
                      <ShieldCheck className="h-6 w-6 text-[#0f5fa8]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[#1a2332]">{t.mfaTitle}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">{t.mfaSubtitle}</p>
                    {authedUser && <p className="mt-1 text-xs font-medium text-[#6b7280]">{authedUser.email}</p>}
                    {devCode && (
                      <p role="status" className="mt-3 rounded-lg border border-[#0f5fa8]/20 bg-[#0f5fa8]/5 px-3 py-2 text-sm font-semibold text-[#0f5fa8]">
                        Dev mode — your code is {devCode}
                      </p>
                    )}
                  </div>
                  {mfaError && (
                    <div role="alert" className="rounded-lg border border-[#b34a4a]/30 bg-[#b34a4a]/8 px-3.5 py-2.5 text-sm font-medium text-[#b34a4a]">
                      {mfaError}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="mfa-code" className="block text-[13px] font-semibold text-[#1a2332]">
                      {t.code}
                    </label>
                    <input
                      id="mfa-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => {
                        setMfaCode(e.target.value.replace(/\D/g, ''))
                        if (mfaError) setMfaError('')
                      }}
                      placeholder="••••••"
                      className={`${inputCls} pl-4 text-center font-mono text-xl tracking-[0.4em]`}
                      aria-label={t.code}
                      aria-invalid={Boolean(mfaError)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={mfaBusy || mfaCode.length !== 6}
                    className="rwb-focus-blue flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#0f5fa8] to-[#0d3b66] text-[15px] font-bold text-white shadow-[0_6px_20px_rgba(15,95,168,0.3)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,95,168,0.4)] hover:brightness-110 active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mfaBusy ? t.verifying : t.verify}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="rwb-focus-blue w-full text-center text-sm font-semibold text-[#0f5fa8] underline-offset-4 hover:underline"
                  >
                    {t.back}
                  </button>
                </form>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                  {banner && (
                    <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-[#b34a4a]/30 bg-[#b34a4a]/8 px-3.5 py-2.5 text-sm font-medium text-[#b34a4a]">
                      <span>{banner}</span>
                      <button
                        type="button"
                        onClick={() => setBanner('')}
                        className="rwb-focus-blue -mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-[#b34a4a]/60 transition-colors hover:text-[#b34a4a]"
                        aria-label="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {notice && (
                    <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#0f5fa8]/20 bg-[#0f5fa8]/5 px-3.5 py-2.5 text-sm leading-relaxed text-[#1a2332]">
                      <span>{notice}</span>
                      <button
                        type="button"
                        onClick={() => setNotice('')}
                        className="rwb-focus-blue -mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-[#6b7280] transition-colors hover:text-[#0f5fa8]"
                        aria-label="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[13px] font-semibold text-[#1a2332]">
                      {t.email}
                    </label>
                    <div className="relative">
                      <Mail className={iconCls} aria-hidden="true" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: '' }))
                        }}
                        onBlur={(e) => validateField('email', e.target.value)}
                        placeholder={t.emailPh}
                        className={`${inputCls} ${fieldErrors.email ? 'border-[#b34a4a] focus:border-[#b34a4a] focus:shadow-[0_0_0_3px_rgba(179,74,74,0.12)]' : 'border-[#e3e6ea]'}`}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p id="email-error" role="alert" className="text-[12px] font-medium text-[#b34a4a]">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[13px] font-semibold text-[#1a2332]">
                      {t.password}
                    </label>
                    <div className="relative">
                      <Lock className={iconCls} aria-hidden="true" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: '' }))
                        }}
                        onBlur={(e) => validateField('password', e.target.value)}
                        placeholder={t.passwordPh}
                        className={`${inputCls} pr-12 ${fieldErrors.password ? 'border-[#b34a4a] focus:border-[#b34a4a] focus:shadow-[0_0_0_3px_rgba(179,74,74,0.12)]' : 'border-[#e3e6ea]'}`}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="rwb-focus-blue absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#6b7280] transition-colors hover:text-[#0f5fa8]"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p id="password-error" role="alert" className="text-[12px] font-medium text-[#b34a4a]">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember me · Forgot password */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-[#6b7280]">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-[#d1d5db] accent-[#0f5fa8]"
                      />
                      {t.remember}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSupport(true)}
                      className="rwb-focus-blue text-[13px] font-semibold text-[#0f5fa8] underline-offset-4 hover:underline"
                    >
                      {t.forgot}
                    </button>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rwb-focus-blue flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-[#0f5fa8] to-[#0d3b66] text-[15px] font-bold text-white shadow-[0_6px_20px_rgba(15,95,168,0.3)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,95,168,0.4)] hover:brightness-110 active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                        {t.signingIn}
                      </>
                    ) : (
                      <>
                        {t.signIn}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  {/* Help links */}
                  <div className="border-t border-[#e3e6ea] pt-4">
                    <p className="text-center text-[13px] text-[#6b7280]">
                      {t.needHelp}{' '}
                      <button
                        type="button"
                        onClick={() => setShowSupport(true)}
                        className="rwb-focus-blue font-semibold text-[#0f5fa8] underline-offset-4 hover:underline"
                      >
                        {t.contact}
                      </button>
                    </p>
                    <p className="mt-2 text-center text-[13px] text-[#6b7280]">
                      {t.newTo}{' '}
                      <Link to="/register" className="rwb-focus-blue font-semibold text-[#0f5fa8] underline-offset-4 hover:underline">
                        {t.requestReg}
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex flex-col items-center gap-1 px-4 pb-5 text-center">
          <p className="text-[13px] font-medium text-[#6b7280]">© 2026 Rwanda Water Resources Board</p>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f5fa8]/60">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Secure Government Project Review System
          </p>
          <p className="text-[11px] text-[#9ca3af]">{t.securityNote}</p>
          <div className="mt-1 flex items-center gap-5">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="rwb-focus-blue text-[12px] font-medium text-[#0f5fa8] underline-offset-4 hover:underline">
              {t.privacy}
            </a>
            <span className="text-[#d1d5db]">·</span>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="rwb-focus-blue text-[12px] font-medium text-[#0f5fa8] underline-offset-4 hover:underline">
              {t.terms}
            </a>
          </div>
        </footer>
      </div>

      {showSupport && <SupportModal onClose={() => setShowSupport(false)} supportEmail={supportEmail} supportPhones={supportPhones} />}
    </div>
  )
}
