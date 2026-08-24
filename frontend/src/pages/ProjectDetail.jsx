import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Download, FileArchive, FileText, Info, MapPin, Upload, UserPlus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api, apiBlob } from '../lib/api'
import AppShell from '../components/AppShell'
import RubberStamp from '../components/RubberStamp'
import { Alert, Button, Card, ExternalLinkChip, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader, Panel } from '../components/dashboard'
import { AssignModal, DecisionModal, FINAL_OPTIONS, RECOMMEND_OPTIONS } from '../components/ReviewModals'
import { fmtDate, fmtTime } from '../lib/format'

const today = new Date().toISOString().slice(0, 10)

const DECISION_TEXT = {
  APPROVED: 'Approved',
  REJECTED: 'Returned for revision',
  REQUEST_INFO: 'Requested additional information',
  NOTES: 'Note recorded',
}

function Fact({ label, value }) {
  return (
    <div className="rounded-md bg-surface-muted px-4 py-3">
      <dt className={labelCls}>{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  )
}

function OwnerEditPanel({ project, onSaved }) {
  const [form, setForm] = useState({
    location: project.location || '',
    link: project.link || '',
    notes: project.notes || '',
    feedbackDueDate: project.feedbackDueDate || '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      await api(`/projects/${project.id}/details`, { method: 'PATCH', body: form })
      setMsg('Details updated.')
      onSaved()
    } catch (err) {
      setMsg(err.message || 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">Manage submission details</h2>
        <span className={labelCls}>Owner · editable while docket is open</span>
      </div>
      {msg && (
        <div className="mb-3">
          <Alert kind={msg === 'Details updated.' ? 'success' : 'error'}>{msg}</Alert>
        </div>
      )}
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" id="edit-location">
          <input id="edit-location" maxLength={255} className={inputClass} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </Field>
        <Field label="External project link" id="edit-link" hint="Validated http(s) link.">
          <input id="edit-link" type="url" maxLength={2048} className={inputClass} placeholder="https://…" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
        </Field>
        <Field
          label="Review feedback needed by"
          id="edit-feedbackDueDate"
          hint="Everyone involved is notified when this date arrives."
        >
          <input
            id="edit-feedbackDueDate"
            type="date"
            min={today}
            className={inputClass}
            value={form.feedbackDueDate}
            onChange={(e) => setForm((f) => ({ ...f, feedbackDueDate: e.target.value }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes for the description" id="edit-notes">
            <textarea id="edit-notes" rows={4} maxLength={4000} className={`${inputClass} resize-y`} placeholder="Clarifications, context, or responses to information requests…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</Button>
        </div>
      </form>
    </Card>
  )
}

function formatBytes(n) {
  if (!n) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [decisionTarget, setDecisionTarget] = useState(null)
  const [uploading, setUploading] = useState(false)
  const zipRef = useRef(null)
  const docRef = useRef(null)

  const load = useCallback(async () => {
    try {
      setProject(await api(`/projects/${id}`))
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load this project.')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const role = user?.role
  const isManagerial = role === 'DIVISION_MANAGER' || role === 'ADMIN'
  const isReviewer = role === 'REVIEWER'
  const isOwner = project && project.ownerId === user?.id
  const canAssign = project && isManagerial && !project.reviewerName && ['SUBMITTED', 'RESUBMITTED'].includes(project.status)
  const canDecide = project && isManagerial && ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(project.status)
  const canRecommend =
    project && isReviewer && project.reviewerName === user?.fullName && project.status === 'IN_REVIEW'
  const canEdit = isOwner && !['APPROVED', 'ARCHIVED'].includes(project?.status)

  async function submitDecision(decision, comments) {
    if (decisionTarget.kind === 'recommend') {
      await api(`/projects/${project.id}/recommend`, { method: 'POST', body: { decision, comments } })
    } else {
      const action = decision === 'APPROVED' ? 'approve' : 'reject'
      await api(`/projects/${project.id}/${action}`, { method: 'POST', body: { comments } })
    }
    setDecisionTarget(null)
    await load()
  }

  async function downloadAttachment(a) {
    try {
      const blob = await apiBlob(`/projects/${project.id}/attachments/${a.id}/download`)
      const url = URL.createObjectURL(blob)
      const el = document.createElement('a')
      el.href = url
      el.download = a.fileName
      el.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Download failed.')
    }
  }

  /** Uploads a list of files to the docket, collecting per-file failures. */
  async function uploadFiles(fileList) {
    if (!fileList.length) return
    setUploading(true)
    setError('')
    const failures = []
    try {
      for (const file of fileList) {
        const fd = new FormData()
        fd.append('file', file)
        try {
          await api(`/projects/${project.id}/attachments`, { method: 'POST', body: fd })
        } catch (upErr) {
          failures.push(`${file.name}: ${upErr.message || 'upload failed'}`)
        }
      }
      await load()
      if (failures.length) setError(`Some uploads failed: ${failures.join('; ')}`)
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (zipRef.current) zipRef.current.value = ''
      if (docRef.current) docRef.current.value = ''
    }
  }

  const uploadZip = (e) => uploadFiles(e.target.files?.[0] ? [e.target.files[0]] : [])
  const uploadDocs = (e) => uploadFiles(Array.from(e.target.files || []))

  if (!project && !error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-amber" />
        </div>
      </AppShell>
    )
  }

  if (error && !project) {
    return (
      <AppShell>
        <PageHeader eyebrow="Ledger" title="Project" />
        <Card className="p-8 text-center">
          <Alert kind="error">{error}</Alert>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to projects
          </Button>
        </Card>
      </AppShell>
    )
  }

  const p = project
  const attachments = p.attachments || []
  const zipAtts = attachments.filter((a) => a.kind === 'ZIP')
  const docAtts = attachments.filter((a) => a.kind !== 'ZIP')
  const due = p.feedbackDueDate || ''
  const dueAttention = due && due <= today && ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(p.status)
  const dueLabel = due
    ? due < today
      ? `${fmtDate(due)} · overdue`
      : due === today
        ? `${fmtDate(due)} · due today`
        : fmtDate(due)
    : null

  return (
    <AppShell>
      <button
        onClick={() => navigate(-1)}
        className={`mb-4 inline-flex items-center gap-1.5 ${labelCls} transition-colors hover:text-accent`}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
      </button>

      {error && (
        <div className="mb-4">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={labelCls}>Docket {p.docketNumber}</p>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.01em] text-ink">{p.title}</h1>
          <p className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 ${labelCls}`}>
            <span>{p.category || 'Uncategorized'}</span>
            {p.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" /> {p.location}
              </span>
            )}
            <span>{p.organizationName || '—'}</span>
          </p>
        </div>
        <RubberStamp status={p.status} size="lg" tilt={2} />
      </div>

      {/* Actions */}
      {(canAssign || canDecide || canRecommend) && (
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={labelCls}>
              {canRecommend ? 'Submit your recommendation' : 'Review authority'}
            </p>
            <div className="flex flex-wrap gap-2">
              {canAssign && (
                <Button variant="secondary" onClick={() => setAssigning(true)}>
                  <UserPlus className="h-4 w-4" aria-hidden="true" /> Assign Reviewer
                </Button>
              )}
              {canDecide && (
                <>
                  <Button variant="success" onClick={() => setDecisionTarget({ kind: 'final', preset: 'APPROVED' })}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Approve Project
                  </Button>
                  <Button variant="danger" onClick={() => setDecisionTarget({ kind: 'final', preset: 'REJECTED' })}>
                    Return for Revision
                  </Button>
                </>
              )}
              {canRecommend && (
                <Button variant="secondary" onClick={() => setDecisionTarget({ kind: 'recommend' })}>
                  <Info className="h-4 w-4" aria-hidden="true" /> Submit Recommendation
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {canEdit && (
        <OwnerEditPanel
          key={p.id}
          project={p}
          onSaved={async () => {
            setError('')
            await load()
          }}
        />
      )}

      {assigning && (
        <AssignModal
          project={p}
          onClose={() => setAssigning(false)}
          onAssigned={async () => {
            setAssigning(false)
            await load()
          }}
        />
      )}

      {decisionTarget && (
        <DecisionModal
          project={p}
          options={decisionTarget.kind === 'recommend' ? RECOMMEND_OPTIONS : FINAL_OPTIONS}
          preset={decisionTarget.preset}
          onClose={() => setDecisionTarget(null)}
          onSubmit={submitDecision}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Project details">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact label="Organization" value={p.organizationName} />
              <Fact label="Location" value={p.location} />
              <Fact label="Submitted by" value={p.ownerName} />
              <Fact label="Reviewer" value={p.reviewerName || 'Unassigned'} />
              <Fact label="Submitted" value={fmtDate(p.submittedAt || p.createdAt)} />
              <Fact label="Updated" value={fmtDate(p.updatedAt)} />
              <div className={`rounded-md px-4 py-3 ${dueAttention ? 'border border-brick/30 bg-brick-light/40' : 'bg-surface-muted'}`}>
                <dt className={labelCls}>Feedback due</dt>
                <dd className={`mt-1 text-sm font-medium ${dueAttention ? 'text-brick' : 'text-ink'}`}>{dueLabel || '—'}</dd>
              </div>
            </dl>
            {p.summary && (
              <div className="mt-5">
                <h3 className={labelCls}>Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{p.summary}</p>
              </div>
            )}
            {p.notes && (
              <div className="mt-5 rounded-md border border-line bg-surface-muted px-4 py-3">
                <h3 className={labelCls}>Notes</h3>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700/90">{p.notes}</p>
              </div>
            )}
            {p.link && (
              <div className="mt-5 rounded-md border border-line bg-surface-muted px-4 py-3">
                <h3 className={labelCls}>External project link</h3>
                <div className="mt-2">
                  <ExternalLinkChip href={p.link} />
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title={`Attachments · ${attachments.length}`}
            action={
              isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={zipRef}
                    type="file"
                    className="hidden"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    aria-label="Upload ZIP project package"
                    onChange={uploadZip}
                  />
                  <input
                    ref={docRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,application/vnd.ms-excel,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    aria-label="Upload supporting documents"
                    onChange={uploadDocs}
                  />
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => zipRef.current?.click()} disabled={uploading}>
                    <FileArchive className="h-3.5 w-3.5" aria-hidden="true" /> {uploading ? 'Uploading…' : 'Upload ZIP'}
                  </Button>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => docRef.current?.click()} disabled={uploading}>
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" /> {uploading ? 'Uploading…' : 'Add documents'}
                  </Button>
                </div>
              ) : undefined
            }
          >
            {attachments.length === 0 ? (
              <p className={`py-8 text-center ${labelCls}`}>
                No files attached yet
              </p>
            ) : (
              <div className="space-y-5">
                {zipAtts.length > 0 && (
                  <div>
                    <h3 className={`mb-1 ${labelCls}`}>ZIP package</h3>
                    <ul className="divide-y divide-ink/5">
                      {zipAtts.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="rounded-md bg-surface-muted p-2 text-ink-700">
                              <FileArchive className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{a.fileName}</p>
                              <p className="font-mono text-[10px] text-ink-700/55">
                                {formatBytes(a.sizeBytes)} · v{a.version}
                                {a.contentType ? ` · ${a.contentType}` : ''}
                              </p>
                            </div>
                          </div>
                          <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => downloadAttachment(a)}>
                            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {docAtts.length > 0 && (
                  <div>
                    <h3 className={`mb-1 ${labelCls}`}>Supporting documents</h3>
                    <ul className="divide-y divide-ink/5">
                      {docAtts.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="rounded-md bg-surface-muted p-2 text-ink-700">
                              <FileText className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">{a.fileName}</p>
                              <p className="font-mono text-[10px] text-ink-700/55">
                                {formatBytes(a.sizeBytes)} · v{a.version}
                                {a.contentType ? ` · ${a.contentType}` : ''}
                              </p>
                            </div>
                          </div>
                          <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => downloadAttachment(a)}>
                            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {isOwner && (
              <p className={`mt-3 border-t border-line pt-3 ${labelCls}`}>
                ZIP of project reports, plus supporting letters (PDF), Word documents or Excel spreadsheets — up to 2 GB
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Review history">
            {(p.reviewHistory || []).length === 0 ? (
              <p className={`py-8 text-center ${labelCls}`}>
                No review activity yet
              </p>
            ) : (
              <ol className="space-y-4">
                {(p.reviewHistory || []).map((r, i) => (
                  <li key={i} className="relative rounded-md border border-line bg-surface-muted px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{DECISION_TEXT[r.decision] || r.decision}</p>
                      <span className="shrink-0 font-mono text-[10px] text-ink-700/50">
                        {fmtDate(r.createdAt)} {fmtTime(r.createdAt)}
                      </span>
                    </div>
                    {r.reviewerName && (
                      <p className={`mt-0.5 ${labelCls}`}>by {r.reviewerName}</p>
                    )}
                    {r.comments && <p className="mt-1.5 text-sm leading-relaxed text-ink-700/90">{r.comments}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Submission details">
            <dl className="space-y-3">
              <Fact label="Docket number" value={p.docketNumber} />
              <Fact label="Received" value={`${fmtDate(p.submittedAt || p.createdAt)} ${fmtTime(p.submittedAt || p.createdAt)}`} />
              <Fact label="Created" value={fmtDate(p.createdAt)} />
            </dl>
          </Panel>
        </div>
      </div>
    </AppShell>
  )
}
