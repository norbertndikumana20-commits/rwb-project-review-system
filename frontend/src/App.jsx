import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth, homePathFor } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import PendingReview from './pages/PendingReview'
import FirstProject from './pages/FirstProject'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import NewProject from './pages/NewProject'
import ProjectDetail from './pages/ProjectDetail'
import Reviews from './pages/Reviews'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import Messages from './pages/Messages'
import Users from './pages/Users'
import Branding from './pages/Branding'
import AppManagement from './pages/AppManagement'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

/** Redirects signed-in users away from public pages toward their status home. */
function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to={homePathFor(user.accountStatus)} replace />
  return children
}

/** Blocks access until the account is ACTIVE (mirrors FirstProjectGateFilter). */
function ActiveOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/signin" replace />
  if (user.accountStatus !== 'ACTIVE') return <Navigate to={homePathFor(user.accountStatus)} replace />
  return children
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <img src="/assets/rwb-logo-vertical.png" alt="" className="mx-auto mb-3 h-20 w-20 object-contain drop-shadow-md" />
        <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-700/60">RWB Review Ledger</p>
      </div>
    </div>
  )
}

const pageAnim = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
}

function AnimatedRoute({ children }) {
  return <motion.div variants={pageAnim} initial="initial" animate="animate" exit="exit">{children}</motion.div>
}

function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicOnly><AnimatedRoute><Landing /></AnimatedRoute></PublicOnly>} />
        <Route path="/signin" element={<PublicOnly><AnimatedRoute><SignIn /></AnimatedRoute></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><AnimatedRoute><Register /></AnimatedRoute></PublicOnly>} />
        <Route path="/verify-email" element={<AnimatedRoute><VerifyEmail /></AnimatedRoute>} />
        <Route path="/pending-review" element={<AnimatedRoute><PendingReview /></AnimatedRoute>} />
        <Route path="/first-project" element={<AnimatedRoute><FirstProject /></AnimatedRoute>} />

        <Route path="/dashboard" element={<ActiveOnly><AnimatedRoute><Dashboard /></AnimatedRoute></ActiveOnly>} />
        <Route path="/projects" element={<ActiveOnly><AnimatedRoute><Projects /></AnimatedRoute></ActiveOnly>} />
        <Route path="/projects/new" element={<ActiveOnly><AnimatedRoute><NewProject /></AnimatedRoute></ActiveOnly>} />
        <Route path="/projects/:id" element={<ActiveOnly><AnimatedRoute><ProjectDetail /></AnimatedRoute></ActiveOnly>} />
        <Route path="/reviews" element={<ActiveOnly><AnimatedRoute><Reviews /></AnimatedRoute></ActiveOnly>} />
        <Route path="/notifications" element={<ActiveOnly><AnimatedRoute><Notifications /></AnimatedRoute></ActiveOnly>} />
        <Route path="/reports" element={<ActiveOnly><AnimatedRoute><Reports /></AnimatedRoute></ActiveOnly>} />
        <Route path="/messages" element={<ActiveOnly><AnimatedRoute><Messages /></AnimatedRoute></ActiveOnly>} />
        <Route path="/users" element={<Navigate to="/app-management?tab=users" replace />} />
        <Route path="/branding" element={<Navigate to="/app-management?tab=branding" replace />} />
        <Route path="/app-management" element={<ActiveOnly><AnimatedRoute><AppManagement /></AnimatedRoute></ActiveOnly>} />
        <Route path="/settings" element={<ActiveOnly><AnimatedRoute><Settings /></AnimatedRoute></ActiveOnly>} />
        <Route path="/profile" element={<ActiveOnly><AnimatedRoute><Profile /></AnimatedRoute></ActiveOnly>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2332',
              color: '#fff',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            },
            success: { iconTheme: { primary: '#4a7c59', secondary: '#fff' } },
            error: { iconTheme: { primary: '#b34a4a', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
