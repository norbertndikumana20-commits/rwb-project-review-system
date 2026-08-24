import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { FileArchive, FileText, Upload } from 'lucide-react'
import { homePathFor, useAuth } from '../lib/auth'
import { api } from '../lib/api'
import RubberStamp from '../components/RubberStamp'
import AppShell from '../components/AppShell'
import { Alert, Button, Card, Field, inputClass, labelCls } from '../components/ui'

const CATEGORIES = [
  'Infrastructure',
  'Public Works',
  'Digital Systems',
  'Environmental',
  'Transportation',
  'Other',
]

const today = new Date().toISOString().slice(0, 10)

export default function FirstProject() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], summary: '', location: '', link: '', notes: '', feedbackDueDate: '' })
  const [zipFile, setZipFile] = useState(null)
  const [docFiles, setDocFiles] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const zipRef = useRef(null)
  const docRef = useRef(null)

  if (loading) return null
  if (!user) return <Navigate to="/signin" replace />
  if (user.accountStatus !== 'ACTIVE_FIRST_PROJECT_REQUIRED') {
    return <Navigate to={homePathFor(user.accountStatus)} replace />
  }

  /** Uploads the ZIP (if any) then each supporting document, collecting failures. */
  async function uploadAll(projectId) {
    const failures = []
    const upload = async (f) => {
      const fd = new FormData()
      fd.append('file', f)
      try {
        await api(`/projects/${projectId}/attachments`, { method: 'POST', body: fd })
      } catch (upErr) {
        failures.push(`${f.name}: ${upErr.message || 'upload failed'}`)
      }
    }
    if (zipFile) await upload(zipFile)
    for (const f of docFiles) await upload(f)
    return failures
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const created = await api('/projects', { method: 'POST', body: form })
      const failures = await uploadAll(created.id)
      if (failures.length) {
        setError(`Project created, but some uploads failed: ${failures.join('; ')}`)
      }
      navigate(`/projects/${created.id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={labelCls}>
              Account condition · First project required
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.01em] text-ink">
              Submit your first project
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-700/80">
              Your registration was approved. Before full access is granted, the ledger requires one
              project submission to establish your docket. Submissions are received and stamped
              immediately.
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <RubberStamp status="SUBMITTED" size="lg" tilt={5} />
          </div>
        </div>

        <Card className="mt-6 p-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {error && <Alert kind="error">{error}</Alert>}

            <Field label="Project title" id="title">
              <input
                id="title"
                required
                maxLength={255}
                className={inputClass}
                placeholder="e.g. Restoration of the Harbor Bulkhead, Phase II"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Category" id="category">
                <select
                  id="category"
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location" id="location" hint="Where the project is taking place.">
                <input
                  id="location"
                  maxLength={255}
                  className={inputClass}
                  placeholder="e.g. Kigali, Gasabo District"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </Field>
            </div>

            <Field label="Project summary" id="summary" hint="Scope, objectives, and expected outcomes (2,000 characters max).">
              <textarea
                id="summary"
                rows={5}
                maxLength={2000}
                className={`${inputClass} resize-y`}
                placeholder="Describe the project in enough detail for the review body…"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </Field>

            <Field label="Notes" id="notes" hint="Notes for the description — clarifications, context, or responses to requests (4,000 characters max).">
              <textarea
                id="notes"
                rows={4}
                maxLength={4000}
                className={`${inputClass} resize-y`}
                placeholder="Any additional notes for the review body…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Field>
            <Field
              label="Review feedback needed by"
              id="feedbackDueDate"
              hint="The date by which you expect the review body's feedback. Everyone involved is notified when this date arrives."
            >
              <input
                id="feedbackDueDate"
                type="date"
                min={today}
                className={inputClass}
                value={form.feedbackDueDate}
                onChange={(e) => setForm((f) => ({ ...f, feedbackDueDate: e.target.value }))}
              />
            </Field>
            <Field label="External project link" id="link" hint="Optional validated link (https://…).">
              <input
                id="link"
                type="url"
                maxLength={2048}
                className={inputClass}
                placeholder="https://…"
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              />
            </Field>
            <Field label="Project files (ZIP)" hint="The zipped package of project reports, drawings, or data — up to 2 GB.">
              <div className="flex items-center gap-3">
                <input
                  ref={zipRef}
                  type="file"
                  className="hidden"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  aria-label="Upload ZIP project package"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                />
                <Button variant="secondary" type="button" className="shrink-0 px-3 py-2 text-xs" onClick={() => zipRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" /> {zipFile ? 'Change ZIP' : 'Choose ZIP file'}
                </Button>
                {zipFile && (
                  <span className="inline-flex min-w-0 items-center gap-2 font-mono text-xs text-ink-700/80">
                    <FileArchive className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{zipFile.name}</span>
                    <span className="shrink-0 text-ink-700/50">({(zipFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </span>
                )}
              </div>
            </Field>
            <Field label="Supporting documents" hint="Supporting letters (PDF), Word documents, or Excel spreadsheets. You can choose several files at once.">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={docRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,application/vnd.ms-excel,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  aria-label="Upload supporting documents"
                  onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
                />
                <Button variant="secondary" type="button" className="shrink-0 px-3 py-2 text-xs" onClick={() => docRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" /> {docFiles.length ? 'Change documents' : 'Choose documents'}
                </Button>
                {docFiles.map((f, i) => (
                  <span key={i} className="inline-flex min-w-0 items-center gap-2 rounded-md border border-line bg-surface-muted px-2.5 py-1.5 font-mono text-xs text-ink-700/80">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-ink-700/50">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </span>
                ))}
              </div>
            </Field>

            <div className="flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
              <p className={labelCls}>
                Submitting activates your account
              </p>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Stamping…' : 'Submit for review'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  )
}
