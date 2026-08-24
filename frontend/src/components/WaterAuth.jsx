/*
 * ─────────────────────────────────────────────────────────────────────────
 * RWB PROJECT REVIEW SYSTEM — AUTH PAGE COLOR SYSTEM (80 / 15 / 5)
 * Reuse these tokens elsewhere in the app for a consistent government look.
 *
 *  BASE      (80%)  #FFFFFF   card & content surfaces
 *                    #EAF4FB   page background top — fades into white below
 *                    #F8FBFD   subtle tinted areas / info banners
 *                    #E5EEF5   hairline borders & dividers
 *
 *  PRIMARY   (15%)  #005BAA   brand blue — buttons, active input borders,
 *                    #1E88E5   wordmark, links, icons, focus glow
 *                    #64B5F6   light blue — hover borders, soft washes
 *                    #0D3B66   deep navy — scrims / strong emphasis
 *
 *  SECONDARY (5%)   #2E7D32   brand green — SUCCESS states only (verification
 *                             banners, shield icon, logo halo tint). Never
 *                             competes with blue as a primary action color.
 *
 *  HIGHLIGHT (5%)   #F59E0B   amber — reserved for ATTENTION only (error
 *                             banners). Never on primary buttons.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react'
import { fetchBranding } from '../lib/branding'

/**
 * RWB logo mark — uses the vertical logo from /assets/rwb-logo-vertical.png.
 */
export function RwbLogo({ showWordmark = true }) {
  const LOGO_SRC = '/assets/rwb-logo-vertical.png'

  return (
    <div className="flex flex-col items-center">
      {/* soft blue→green gradient halo behind the mark */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand/25 via-brand-soft/60 to-sage/20 blur-2xl"
        />
        <img
          src={LOGO_SRC}
          alt="Rwanda Water Resources Board logo"
          className="relative h-[140px] w-[140px] object-contain drop-shadow-[0_8px_24px_rgba(15,95,168,0.25)]"
        />
      </div>
      {showWordmark && (
        <p className="mt-2.5 max-w-[88vw] text-center text-[12px] font-semibold uppercase leading-normal tracking-[0.18em] text-brand sm:max-w-none sm:text-[13px] sm:tracking-[5px]">
          Rwanda Water Resources Board
        </p>
      )}
    </div>
  )
}

/**
 * Clean, CSS-only water backdrop: soft radial washes, drifting blurred blobs,
 * low-opacity wave bands and a subtle ripple ring — all decorative, never
 * competing with the login card.
 */
export function WaterBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-[#eaf3fb] via-[#f7fbfe] to-white"
    >
      {/* faint water/mountain topographic contour pattern (~5% — depth, no color noise) */}
      <div className="absolute inset-0 text-water-sky opacity-[0.05]">
        <TopoPattern className="h-full w-full" />
      </div>

      {/* soft radial washes */}
      <div className="absolute left-[-12%] top-[-14%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(30,136,229,0.08)_0%,rgba(30,136,229,0)_70%)]" />
      <div className="absolute right-[-10%] top-[6%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(79,195,247,0.08)_0%,rgba(79,195,247,0)_70%)]" />
      <div className="absolute bottom-[-18%] left-[16%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(46,125,50,0.05)_0%,rgba(46,125,50,0)_70%)]" />

      {/* two organic aqua gradient blobs — top-left and bottom-right */}
      <div className="animate-rwb-blob-a absolute -left-28 -top-28 h-[420px] w-[420px] rounded-[58%_42%_45%_55%/52%_48%_60%_40%] bg-gradient-to-br from-water-aqua/20 via-water-sky-light/10 to-transparent opacity-[0.06] blur-3xl will-change-transform" />
      <div className="animate-rwb-blob-c absolute -bottom-32 -right-28 h-[460px] w-[460px] rounded-[45%_55%_60%_40%/55%_45%_50%_50%] bg-gradient-to-tl from-water-sky/18 via-water-aqua/8 to-transparent opacity-[0.06] blur-3xl will-change-transform" />

      {/* drifting organic blobs — kept extremely subtle */}
      <div className="animate-rwb-blob-b absolute left-[6%] top-[24%] h-64 w-64 rounded-[42%_58%_55%_45%/48%_42%_58%_52%] bg-water-sky-light opacity-[0.06] blur-3xl will-change-transform" />
      <div className="animate-rwb-blob-a absolute right-[8%] top-[46%] h-72 w-72 rounded-[55%_45%_40%_60%/50%_55%_45%_50%] bg-water-aqua opacity-[0.06] blur-3xl will-change-transform" />
      <div className="animate-rwb-blob-c absolute bottom-[16%] left-[32%] h-52 w-52 rounded-[45%_55%_60%_40%/55%_45%_55%_45%] bg-water-green opacity-[0.04] blur-3xl will-change-transform" />

      {/* faint water ripple patterns (SVG rings, 2–3% opacity) */}
      <div className="absolute left-[12%] top-[14%] opacity-[0.025]">
        <RippleCluster className="h-44 w-44 text-water-sky" />
      </div>
      <div className="absolute bottom-[20%] right-[16%] opacity-[0.025]">
        <RippleCluster className="h-56 w-56 text-water-aqua" />
      </div>
      <div className="absolute left-[46%] top-[40%] opacity-[0.02]">
        <RippleCluster className="h-32 w-32 text-water-sky-light" />
      </div>

      {/* slow wave bands near the bottom */}
      <div className="absolute bottom-[-24px] left-0 w-[200%] opacity-[0.03]">
        <div className="animate-rwb-wave flex w-[200%]">
          <WaveBand className="shrink-0" />
          <WaveBand className="shrink-0" />
        </div>
      </div>

      {/* gentle animated ripple rings */}
      <div className="absolute right-[14%] bottom-[24%]">
        <span className="animate-rwb-ripple block h-40 w-40 rounded-full border border-water-sky/15" />
      </div>
      <div className="absolute left-[10%] top-[30%]">
        <span className="animate-rwb-ripple block h-28 w-28 rounded-full border border-water-aqua/12 [animation-delay:3s]" />
      </div>
    </div>
  )
}

/**
 * Auth-page backdrop: the CSS-only WaterBackground plus a subtle crossfading
 * slideshow of admin-managed AUTH branding images. Images are dimmed behind a
 * soft blue wash so the login/registration card stays readable. Falls back to
 * WaterBackground alone when no images are configured.
 */
export function AuthBackdrop() {
  const [images, setImages] = useState([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchBranding('AUTH').then((list) => {
      if (!cancelled) setImages(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (images.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 8000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <WaterBackground />
      {images.length > 0 && (
        <div className="absolute inset-0">
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
                i === index ? 'opacity-[0.20]' : 'opacity-0'
              }`}
            />
          ))}
          {/* Blue wash keeps the card and copy readable over photography. */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#eaf3fb]/85 via-white/60 to-white/85" />
        </div>
      )}
    </div>
  )
}

function WaveBand({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className={`h-32 w-1/2 text-water-sky ${className}`}
      fill="none"
    >
      <path
        d="M0 96c120 0 120 24 240 24s120-24 240-24 120 24 240 24 120-24 240-24 120 24 240 24 120-24 240-24 120 24 240 24v40H0Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Concentric ripple rings used as a faint watermark pattern. */
function RippleCluster({ className = '' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="100" cy="100" r="18" />
      <circle cx="100" cy="100" r="40" />
      <circle cx="100" cy="100" r="64" />
      <circle cx="100" cy="100" r="90" />
    </svg>
  )
}

/** Flowing contour lines that echo a water/mountain topographic map. */
function TopoPattern({ className = '' }) {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className={className} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <g>
        <path d="M-60 200 C 240 140, 420 280, 660 220 C 900 160, 1100 300, 1500 220" />
        <path d="M-60 242 C 240 182, 420 322, 660 262 C 900 202, 1100 342, 1500 262" />
        <path d="M-60 284 C 240 224, 420 364, 660 304 C 900 244, 1100 384, 1500 304" />
        <path d="M-60 326 C 240 266, 420 406, 660 346 C 900 286, 1100 426, 1500 346" />
        <path d="M-60 368 C 240 308, 420 448, 660 388 C 900 328, 1100 468, 1500 388" />
      </g>
      <g opacity="0.85">
        <path d="M-60 600 C 300 540, 520 680, 780 620 C 1040 560, 1240 700, 1500 620" />
        <path d="M-60 644 C 300 584, 520 724, 780 664 C 1040 604, 1240 744, 1500 664" />
        <path d="M-60 688 C 300 628, 520 768, 780 708 C 1040 648, 1240 788, 1500 708" />
        <path d="M-60 732 C 300 672, 520 812, 780 752 C 1040 692, 1240 832, 1500 752" />
      </g>
      <g opacity="0.7">
        <path d="M-60 60 C 420 110, 700 -10, 1060 70 C 1220 110, 1360 40, 1500 70" />
        <path d="M-60 104 C 420 154, 700 34, 1060 114 C 1220 154, 1360 84, 1500 114" />
        <path d="M-60 148 C 420 198, 700 78, 1060 158 C 1220 198, 1360 128, 1500 158" />
      </g>
    </svg>
  )
}
