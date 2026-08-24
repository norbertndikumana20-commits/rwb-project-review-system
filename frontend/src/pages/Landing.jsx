/*
 * RWB PROJECT REVIEW SYSTEM — LANDING PAGE
 *
 * Dynamic, engaging entry point with:
 * - Animated hero with gradient text
 * - Live stats counters
 * - Feature showcase cards
 * - Admin-managed slideshow background
 * - Smooth scroll to features
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Building2, ChevronLeft, ChevronRight,
  FileCheck2, FolderKanban, ShieldCheck, Shield, Users, CheckCircle2,
} from 'lucide-react'
import { RwbLogo, WaterBackground } from '../components/WaterAuth'
import { fetchBranding } from '../lib/branding'

const SLIDE_MS = 6000

/* ── Animated counter hook ────────────────────────────────────────────── */
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            setCount(Math.floor(progress * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

/* ── Stat card ────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, suffix = '', delay = 0 }) {
  const { count, ref } = useCountUp(value, 2200)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 backdrop-blur-sm"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
        <Icon className="h-5 w-5 text-[#4fc3f7]" aria-hidden="true" />
      </div>
      <p className="font-mono text-3xl font-bold tabular-nums text-white">
        {count}{suffix}
      </p>
      <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.08em] text-white/50">{label}</p>
    </motion.div>
  )
}

/* ── Feature card ─────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(15,95,168,0.12)' }}
      className="group rounded-2xl border border-[#e3e6ea] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f5fa8]/8 text-[#0f5fa8] transition-colors group-hover:bg-[#0f5fa8] group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-[16px] font-bold" style={{ color: '#0f2540' }}>{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#5b6675' }}>{description}</p>
    </motion.div>
  )
}

/* ── Main landing page ────────────────────────────────────────────────── */
export default function Landing() {
  const [images, setImages] = useState([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchBranding('LANDING').then((list) => {
      if (!cancelled) setImages(list)
    })
    return () => { cancelled = true }
  }, [])

  const count = images.length
  const hasSlideshow = count > 0

  useEffect(() => {
    if (count < 2 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => clearInterval(timer)
  }, [count, paused])

  function go(delta) {
    if (count === 0) return
    setIndex((i) => (i + delta + count) % count)
  }

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden font-sans"
      style={{ color: '#111827' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ═══════════════════ BACKGROUND ═══════════════════ */}
      {hasSlideshow ? (
        <div aria-hidden="true" className="absolute inset-0">
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/75 via-[#0f2440]/55 to-[#0a1628]/85" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2440] to-[#0d3b66]" />
      )}

      {/* Topographic lines (always visible) */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full" fill="none" stroke="white" strokeWidth="0.8">
          <path d="M-60 200 C 240 140, 420 280, 660 220 C 900 160, 1100 300, 1500 220" />
          <path d="M-60 260 C 240 200, 420 340, 660 280 C 900 220, 1100 360, 1500 280" />
          <path d="M-60 320 C 240 260, 420 400, 660 340 C 900 280, 1100 420, 1500 340" />
          <path d="M-60 560 C 300 500, 520 640, 780 580 C 1040 520, 1240 660, 1500 580" />
          <path d="M-60 620 C 300 560, 520 700, 780 640 C 1040 580, 1240 720, 1500 640" />
        </svg>
      </div>

      {/* Slideshow controls */}
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide"
            className="rwb-focus-blue absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2.5 text-white backdrop-blur transition-all hover:bg-white/20 focus-visible:outline-white sm:left-6">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next slide"
            className="rwb-focus-blue absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2.5 text-white backdrop-blur transition-all hover:bg-white/20 focus-visible:outline-white sm:right-6">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {images.map((img, i) => (
              <button key={img.id} type="button" onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === index}
                className={`rwb-focus-blue h-2.5 rounded-full transition-all duration-300 focus-visible:outline-white ${i === index ? 'w-7 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="relative z-20 flex items-center justify-end px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Link to="/signin" className="rwb-focus-blue rounded-lg px-4 py-2 text-[13px] font-semibold text-white/80 transition-colors hover:text-white">
            Sign In
          </Link>
          <Link to="/register" className="rwb-focus-blue rounded-lg bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20">
            Register
          </Link>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <main className="relative z-10 flex flex-1 flex-col">
        {/* Hero section */}
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl"
          >
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4fc3f7]/80"
            >
              Rwanda Water Resources Board
            </motion.p>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <RwbLogo showWordmark={false} />
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] text-white drop-shadow-[0_2px_18px_rgba(13,59,102,0.45)] sm:text-[52px]"
            >
              Review. Verify.<br />Build Rwanda&apos;s Water Future.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/75 sm:text-[17px]"
            >
              The RWB Project Review System connects companies, reviewers, and the Division Manager in one
              secure government ledger — from submission to final decision.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                to="/signin"
                className="rwb-focus-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#0f5fa8] to-[#0d3b66] px-8 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(15,95,168,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,95,168,0.45)] hover:brightness-110 active:translate-y-0 active:brightness-95 sm:w-auto"
              >
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/register"
                className="rwb-focus-blue flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 text-[15px] font-bold text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 sm:w-auto"
              >
                Request Registration
              </Link>
            </motion.div>

            {/* Slide caption */}
            {hasSlideshow && images[index]?.caption && (
              <motion.p
                key={images[index].id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mt-8 text-[13px] font-medium text-white/60"
              >
                {images[index].caption}
              </motion.p>
            )}
          </motion.div>
        </section>

        {/* ═══════════════════ STATS BAR ═══════════════════ */}
        <section className="relative z-10 border-t border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-6 py-8 sm:grid-cols-4 sm:px-10">
            <StatCard icon={FolderKanban} value={156} label="Projects Filed" delay={0} />
            <StatCard icon={FileCheck2} value={89} label="Reviews Done" delay={0.1} />
            <StatCard icon={Building2} value={34} label="Organizations" delay={0.2} />
            <StatCard icon={CheckCircle2} value={67} label="Approved" suffix="%" delay={0.3} />
          </div>
        </section>

        {/* ═══════════════════ FEATURES ═══════════════════ */}
        <section className="relative z-10 bg-[#f8fbfd] px-6 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#1c5d8c' }}>
                Platform Features
              </p>
              <h2 className="text-[28px] font-extrabold tracking-[-0.01em] sm:text-[34px]" style={{ color: '#0f2540' }}>
                Everything you need to manage<br className="hidden sm:block" /> water resource projects
              </h2>
              <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-relaxed" style={{ color: '#5b6675' }}>
                A complete government-grade platform for submitting, reviewing, and approving water infrastructure projects across Rwanda.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={FolderKanban}
                title="Project Submission"
                description="External companies submit water-resource projects with documents, locations, and detailed descriptions."
                delay={0}
              />
              <FeatureCard
                icon={FileCheck2}
                title="Structured Review"
                description="Division Managers assign projects to reviewers. Every decision is tracked with timestamps and comments."
                delay={0.1}
              />
              <FeatureCard
                icon={Shield}
                title="Secure Access"
                description="Role-based access control ensures only authorized personnel can view, review, or approve projects."
                delay={0.2}
              />
              <FeatureCard
                icon={Users}
                title="Multi-Role System"
                description="Five distinct roles: Admin, Division Manager, Reviewer, Super Reviewer, and External Company."
                delay={0.3}
              />
              <FeatureCard
                icon={Building2}
                title="Organization Management"
                description="Track which organizations submitted what, manage company accounts, and maintain a complete directory."
                delay={0.4}
              />
              <FeatureCard
                icon={CheckCircle2}
                title="Audit Trail"
                description="Every action is logged — from project submission to final approval. Full transparency for government compliance."
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════ CTA SECTION ═══════════════════ */}
        <section className="relative z-10 bg-gradient-to-br from-[#0f2540] to-[#16324f] px-6 py-16 text-center sm:px-10">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-[26px] font-extrabold text-white sm:text-[32px]">
              Ready to get started?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/60">
              Join the RWB Project Review System and help manage Rwanda&apos;s water resources efficiently.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rwb-focus-blue group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#4fc3f7] to-[#1c9ad6] px-8 text-[15px] font-bold text-[#0a1628] shadow-[0_8px_24px_rgba(79,195,247,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(79,195,247,0.4)] sm:w-auto"
              >
                Create Your Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/signin"
                className="rwb-focus-blue flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-8 text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0a1628] px-6 py-8 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <img src="/assets/rwb-logo-horizontal.png" alt="RWB" className="h-10 w-auto object-contain" />
              <div className="text-left">
                <p className="text-[13px] font-semibold text-white/80">Rwanda Water Resources Board</p>
                <p className="text-[11px] text-white/40">Project Review System</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[12px] text-white/40 transition-colors hover:text-white/70">Privacy</a>
              <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[12px] text-white/40 transition-colors hover:text-white/70">Terms</a>
              <Link to="/signin" className="text-[12px] text-white/40 transition-colors hover:text-white/70">Sign In</Link>
            </div>
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Secure Government Project Review System
            </p>
            <p className="mt-1 text-[12px] text-white/25">© 2026 Rwanda Water Resources Board. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
