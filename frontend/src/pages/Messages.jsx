import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MailPlus, PenLine, Search, Send, X } from 'lucide-react'
import { api } from '../lib/api'
import { useFocusTrap } from '../hooks/useFocusTrap'
import AppShell from '../components/AppShell'
import { Alert, Button, Card, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'
import { timeAgo, fmtTime } from '../lib/format'
import { useAuth } from '../lib/auth'

const ROLE_LABELS = {
  ADMIN: 'System Administrator',
  EXTERNAL_USER: 'External User',
  REVIEWER: 'Reviewer',
  DIVISION_MANAGER: 'Division Manager',
  SUPER_REVIEWER: 'Super Reviewer',
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export default function Messages() {
  const { user: me } = useAuth()
  const [conversations, setConversations] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [thread, setThread] = useState(null)
  const [users, setUsers] = useState([])
  const [composeOpen, setComposeOpen] = useState(false)
  const [error, setError] = useState('')
  const threadEndRef = useRef(null)

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await api('/messages'))
    } catch (err) {
      setError(err.message || 'Unable to load conversations.')
    }
  }, [])

  const loadThread = useCallback(async (otherId) => {
    if (!otherId) return
    try {
      setThread(await api(`/messages/with/${otherId}`))
    } catch (err) {
      setError(err.message || 'Unable to load the conversation.')
    }
  }, [])

  // Initial load + 8s polling so incoming messages surface without a reload.
  useEffect(() => {
    loadConversations()
    const t = setInterval(() => {
      loadConversations()
      if (activeId) loadThread(activeId)
    }, 8000)
    return () => clearInterval(t)
  }, [loadConversations, activeId, loadThread])

  // Open the directory once, for the compose picker.
  useEffect(() => {
    api('/directory/users')
      .then(setUsers)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (threadEndRef.current) threadEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const active = useMemo(
    () => (conversations || []).find((c) => c.counterpartId === activeId) || null,
    [conversations, activeId],
  )

  async function openThread(id) {
    setActiveId(id)
    await loadThread(id)
    // Refresh conversations so the unread badge drops for this thread.
    loadConversations()
  }

  async function sendMessage(body) {
    if (!activeId || !body.trim()) return
    try {
      const sent = await api('/messages', {
        method: 'POST',
        body: { recipientId: activeId, body: body.trim() },
      })
      setThread((t) => [...(t || []), sent])
      loadConversations()
    } catch (err) {
      setError(err.message || 'Message failed to send.')
    }
  }

  const unreadTotal = (conversations || []).reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <AppShell>
      <PageHeader
        eyebrow="Correspondence"
        title="Messages"
        subtitle={`${unreadTotal} unread · talk to reviewers, division managers, and organizations directly.`}
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <PenLine className="h-4 w-4" aria-hidden="true" /> New message
          </Button>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="flex h-[calc(100vh-16rem)] min-h-[420px] flex-col md:flex-row">
          {/* Conversation list — hidden on mobile when a thread is open */}
          <aside className={`${activeId ? 'hidden md:block' : 'block'} w-full shrink-0 border-b border-ink/10 md:w-80 md:border-b-0 md:border-r`}>
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 text-muted/60" aria-hidden="true" />
              <span className={labelCls}>
                {conversations ? `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}` : 'Loading…'}
              </span>
            </div>
            <div className="h-full overflow-y-auto">
              {conversations && conversations.length > 0 ? (
                conversations.map((c) => {
                  const isActive = c.counterpartId === activeId
                  return (
                    <button
                      key={c.counterpartId}
                      onClick={() => openThread(c.counterpartId)}
                      className={`flex w-full items-start gap-3 border-b border-line px-4 py-3.5 text-left transition-colors ${
                        isActive ? 'bg-accent-soft' : 'hover:bg-ink-50/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                          c.unreadCount > 0 ? 'bg-amber text-ink-900' : 'bg-ink-50 text-ink-700'
                        }`}
                      >
                        {initials(c.counterpartName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{c.counterpartName}</span>
                          <span className="shrink-0 font-mono text-[10px] text-ink-700/50 tabular-nums">{timeAgo(c.lastAt)}</span>
                        </span>
                        <span className={`mt-0.5 block truncate ${labelCls}`}>
                          {ROLE_LABELS[c.role] || c.role}
                          {c.counterpartOrganization ? ` · ${c.counterpartOrganization}` : ''}
                        </span>
                        <span className={`mt-1 block truncate text-xs ${c.unreadCount > 0 ? 'font-medium text-ink' : 'text-ink-700/70'}`}>
                          {c.lastMessage}
                        </span>
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 font-mono text-[10px] font-semibold text-ink-900">
                          {c.unreadCount > 9 ? '9+' : c.unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="flex flex-col items-center px-6 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-700/50">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-base font-semibold text-ink">
                    {conversations ? 'No conversations yet' : 'Loading your inbox…'}
                  </p>
                  {conversations && (
                    <p className="mt-1.5 max-w-xs text-sm text-ink-700/75">
                      Start a conversation with a reviewer, manager, or organization.
                    </p>
                  )}
                  {conversations && (
                    <Button variant="secondary" className="mt-4" onClick={() => setComposeOpen(true)}>
                      <MailPlus className="h-4 w-4" aria-hidden="true" /> Write your first message
                    </Button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Thread */}
          {/* Thread — full-width on mobile when a conversation is selected */}
          <section className={`${activeId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
            {active ? (
              <>
                <header className="flex items-center gap-2 border-b border-ink/10 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
                  <button
                    onClick={() => setActiveId(null)}
                    className="rounded-md p-2 text-ink-700 transition-colors hover:bg-ink/5 md:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-mono text-xs font-semibold text-white">
                    {initials(active.counterpartName)}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-semibold text-ink">{active.counterpartName}</p>
                    <p className={`truncate ${labelCls}`}>
                      {ROLE_LABELS[active.role] || active.role}
                      {active.counterpartOrganization ? ` · ${active.counterpartOrganization}` : ''}
                    </p>
                  </div>
                  <Button variant="secondary" className="hidden px-3 py-2 text-xs sm:inline-flex" onClick={() => setComposeOpen(true)}>
                    <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> New
                  </Button>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {thread && thread.length > 0 ? (
                    thread.map((m) => {
                      const mine = m.senderId === me?.id
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[78%] ${
                              mine
                                ? 'rounded-br-sm bg-accent text-white'
                                : 'rounded-bl-sm border border-line bg-surface-muted text-ink'
                            }`}
                          >
                            {m.subject && mine === false && (
                              <p className={`mb-1 text-xs font-semibold ${mine ? 'text-ink-800' : 'text-accent'}`}>{m.subject}</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] tabular-nums ${mine ? 'text-white/60' : 'text-ink-700/50'}`}>
                              {fmtTime(m.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <p className={`py-10 text-center ${labelCls}`}>
                      {thread ? 'No messages in this conversation yet — say hello.' : 'Loading conversation…'}
                    </p>
                  )}
                  <div ref={threadEndRef} />
                </div>

                <Composer onSend={sendMessage} />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-50 text-ink-700/50">
                  <Mail className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-5 text-base font-semibold text-ink">Select a conversation</p>
                <p className="mt-1.5 max-w-sm text-sm text-ink-700/75">
                  Pick a thread on the left to read and reply, or start a new one with anyone in the system.
                </p>
              </div>
            )}
          </section>
        </div>
      </Card>

      {composeOpen && (
        <ComposeModal
          users={users}
          currentUserId={me?.id}
          currentRole={me?.role}
          onClose={() => setComposeOpen(false)}
          onSent={(recipientId) => {
            setComposeOpen(false)
            openThread(recipientId)
          }}
        />
      )}
    </AppShell>
  )
}

function Composer({ onSend }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function submit() {
    if (!text.trim() || sending) return
    setSending(true)
    await onSend(text)
    setText('')
    setSending(false)
  }

  return (
    <div className="border-t border-ink/10 px-3 py-3 sm:px-5 sm:py-4">
      <div className="flex items-end gap-2 sm:gap-3">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          className={`${inputClass} resize-none`}
          placeholder="Write a reply…  (Enter to send, Shift+Enter for a new line)"
          aria-label="Message body"
        />
        <Button onClick={submit} disabled={sending || !text.trim()} className="shrink-0 px-3 sm:px-4">
          <Send className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
        </Button>
      </div>
    </div>
  )
}

function ComposeModal({ users, currentUserId, currentRole, onClose, onSent }) {
  const trapRef = useFocusTrap(onClose)
  const [query, setQuery] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const isExternal = currentRole === 'EXTERNAL_USER'

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (users || [])
      .filter((u) => u.id !== currentUserId)
      .filter(
        (u) =>
          !q ||
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.organizationName || '').toLowerCase().includes(q) ||
          (ROLE_LABELS[u.role] || u.role).toLowerCase().includes(q),
      )
      .slice(0, 40)
  }, [users, query, currentUserId])

  async function submit(e) {
    e.preventDefault()
    if (!recipientId || !body.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await api('/messages', {
        method: 'POST',
        body: { recipientId: Number(recipientId), subject: subject.trim() || null, body: body.trim() },
      })
      onSent(Number(recipientId))
    } catch (err) {
      setError(err.message || 'Unable to send the message.')
      setSending(false)
    }
  }

  return (
    <div ref={trapRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-lg bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">New message</h2>
            <p className={labelCls}>
              {isExternal ? 'Message the Division Manager or your assigned reviewer' : 'To anyone in the review system'}
            </p>
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

          <Field label="Recipient" id="msg-recipient">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/40" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${inputClass} pl-9`}
                placeholder="Search by name, email, role, or organization…"
                aria-label="Search recipients"
              />
            </div>
            {candidates.length > 0 ? (
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-ink/10 p-1.5">
                {candidates.map((u) => {
                  const selected = Number(recipientId) === u.id
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setRecipientId(String(u.id))
                        setQuery('')
                      }}
                      className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                        selected ? 'bg-accent-soft ring-1 ring-accent/40' : 'hover:bg-ink-50'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-50 font-mono text-[10px] font-semibold text-ink-700">
                        {initials(u.fullName)}
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm font-medium text-ink">{u.fullName}</span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-700/55">
                          {ROLE_LABELS[u.role] || u.role}
                          {u.organizationName ? ` · ${u.organizationName}` : ''}
                        </span>
                      </span>
                      {selected && <span className={labelCls}>Selected</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className={`mt-2 ${labelCls}`}>
                No matching accounts
              </p>
            )}
          </Field>

          {recipientId && (
            <>
              <Field label="Subject" id="msg-subject" hint="Optional — defaults to your name if left blank.">
                <input
                  id="msg-subject"
                  value={subject}
                  maxLength={255}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Question about the supporting letter"
                />
              </Field>
              <Field label="Message" id="msg-body">
                <textarea
                  id="msg-body"
                  rows={5}
                  required
                  maxLength={4000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder="Write your message…"
                />
              </Field>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={sending || !recipientId || !body.trim()}>
              <Send className="h-4 w-4" aria-hidden="true" /> {sending ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
