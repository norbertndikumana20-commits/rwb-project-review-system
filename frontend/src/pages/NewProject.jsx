import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FileArchive, FileText, Upload } from 'lucide-react'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import DragDropUpload from '../components/DragDropUpload'
import { Alert, Button, Card, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'

const CATEGORIES = [
  'Infrastructure',
  'Public Works',
  'Digital Systems',
  'Environmental',
  'Transportation',
  'Other',
]

const today = new Date().toISOString().slice(0, 10)

export default function NewProject() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], summary: '', location: '', link: '', notes: '', feedbackDueDate: '' })
  const [zipFile, setZipFile] = useState(null)
  const [docFiles, setDocFiles] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const zipRef = useRef(null)
  const docRef = useRef(null)

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
        toast.error(`Some uploads failed: ${failures.join('; ')}`)
      } else {
        toast.success('Project submitted successfully!')
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
        <PageHeader
          eyebrow="New filing"
          title="Submit a project"
          subtitle="The docket number is minted on receipt and the submission is stamped immediately."
        />
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {error && <Alert kind="error">{error}</Alert>}
            <Field label="Project title" id="title">
              <input id="title" required maxLength={255} className={inputClass} placeholder="e.g. Restoration of the Harbor Bulkhead, Phase II" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Category" id="category">
                <select id="category" className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location" id="location" hint="Where the project is taking place.">
                <input id="location" maxLength={255} className={inputClass} placeholder="e.g. Kigali, Gasabo District" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </Field>
            </div>
            <Field label="Project summary" id="summary" hint="Scope, objectives, and expected outcomes (2,000 characters max).">
              <textarea id="summary" rows={5} maxLength={2000} className={`${inputClass} resize-y`} placeholder="Describe the project in enough detail for the review body…" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
            </Field>
            <Field label="Notes" id="notes" hint="Notes for the description — clarifications, context, or responses to requests (4,000 characters max).">
              <textarea id="notes" rows={4} maxLength={4000} className={`${inputClass} resize-y`} placeholder="Any additional notes for the review body…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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
              <input id="link" type="url" maxLength={2048} className={inputClass} placeholder="https://…" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
            </Field>
            <DragDropUpload
              label="Project files (ZIP)"
              hint="The zipped package of project reports, drawings, or data — up to 2 GB. Drop here or click to browse."
              accept="zip"
              multiple={false}
              files={zipFile ? [zipFile] : []}
              onChange={(f) => setZipFile(f[0] || null)}
            />
            <DragDropUpload
              label="Supporting documents"
              hint="PDF, Word, or Excel files. Drop multiple files here."
              accept="docs"
              multiple={true}
              files={docFiles}
              onChange={setDocFiles}
            />
            <div className="flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
              <p className={labelCls}>
                Filed with the review body
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? 'Stamping…' : 'Submit for review'}</Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  )
}
