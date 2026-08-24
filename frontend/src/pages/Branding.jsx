import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import { Alert, Button, Card, Field, inputClass, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'

const KINDS = [
  { value: 'LANDING', label: 'Landing slideshow', hint: 'Full-bleed hero slides on the public landing page.' },
  { value: 'AUTH', label: 'Auth background', hint: 'Subtle backdrop images behind the sign-in / registration cards.' },
]

const EMPTY = { LANDING: [], AUTH: [] }

function fmtBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function Branding() {
  const [images, setImages] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Upload form
  const [uploadKind, setUploadKind] = useState('LANDING')
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Caption drafts per row
  const [captions, setCaptions] = useState({})
  const [savingCaption, setSavingCaption] = useState({})
  const [busy, setBusy] = useState({})

  const refresh = useCallback(async () => {
    try {
      const [landing, auth] = await Promise.all([
        api('/admin/branding?kind=LANDING'),
        api('/admin/branding?kind=AUTH'),
      ])
      setImages({ LANDING: landing || [], AUTH: auth || [] })
      setCaptions((prev) => {
        const next = { ...prev }
        for (const list of [landing || [], auth || []]) {
          for (const img of list) if (next[img.id] === undefined) next[img.id] = img.caption || ''
        }
        return next
      })
    } catch (err) {
      setError(err.message || 'Unable to load branding images.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function flash(kind, message) {
    setError(kind === 'error' ? message : '')
    setNotice(kind === 'success' ? message : '')
    if (kind === 'success') window.setTimeout(() => setNotice(''), 4000)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!uploadFile) {
      setError('Choose an image file to upload.')
      return
    }
    setUploading(true)
    setError('')
    setNotice('')
    try {
      const body = new FormData()
      body.append('file', uploadFile)
      body.append('kind', uploadKind)
      if (uploadCaption.trim()) body.append('caption', uploadCaption.trim())
      await api('/admin/branding', { method: 'POST', body })
      setUploadFile(null)
      setUploadCaption('')
      e.target.reset?.()
      flash('success', 'Image uploaded.')
      await refresh()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function patch(id, payload) {
    setBusy((b) => ({ ...b, [id]: true }))
    try {
      await api(`/admin/branding/${id}`, { method: 'PATCH', body: payload })
      await refresh()
      return true
    } catch (err) {
      setError(err.message || 'Update failed.')
      return false
    } finally {
      setBusy((b) => ({ ...b, [id]: false }))
    }
  }

  async function saveCaption(id) {
    if (await patch(id, { caption: (captions[id] || '').trim() })) {
      flash('success', 'Caption saved.')
    }
  }

  async function move(id, dir) {
    const kind = [...images.LANDING, ...images.AUTH].find((x) => x.id === id)?.slideKind
    if (!kind) return
    const arr = images[kind]
    const i = arr.findIndex((x) => x.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= arr.length) return
    const a = arr[i]
    const b = arr[j]
    setBusy((x) => ({ ...x, [id]: true }))
    try {
      await api(`/admin/branding/${a.id}`, { method: 'PATCH', body: { sortOrder: b.sortOrder } })
      await api(`/admin/branding/${b.id}`, { method: 'PATCH', body: { sortOrder: a.sortOrder } })
      await refresh()
    } catch (err) {
      setError(err.message || 'Reorder failed.')
    } finally {
      setBusy((x) => ({ ...x, [id]: false }))
    }
  }

  async function replaceFile(id, file) {
    const img = [...images.LANDING, ...images.AUTH].find((x) => x.id === id)
    if (!img || !file) return
    setBusy((x) => ({ ...x, [id]: true }))
    setError('')
    try {
      // New bytes land as a fresh row (same kind + caption), then the old row goes.
      const body = new FormData()
      body.append('file', file)
      body.append('kind', img.slideKind)
      if (img.caption) body.append('caption', img.caption)
      await api('/admin/branding', { method: 'POST', body })
      await api(`/admin/branding/${id}`, { method: 'DELETE' })
      flash('success', 'Image replaced.')
      await refresh()
    } catch (err) {
      setError(err.message || 'Replace failed.')
    } finally {
      setBusy((x) => ({ ...x, [id]: false }))
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this image? The file will be removed from storage.')) return
    setBusy((x) => ({ ...x, [id]: true }))
    try {
      await api(`/admin/branding/${id}`, { method: 'DELETE' })
      flash('success', 'Image deleted.')
      await refresh()
    } catch (err) {
      setError(err.message || 'Delete failed.')
    } finally {
      setBusy((x) => ({ ...x, [id]: false }))
    }
  }

  function renderRow(img, index, list) {
    const isFirst = index === 0
    const isLast = index === list.length - 1
    return (
      <li
        key={img.id}
        className={`flex flex-col gap-4 border border-line rounded-lg bg-surface p-3 sm:flex-row sm:items-center ${
          img.active ? '' : 'opacity-70'
        }`}
      >
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-md bg-paper-darker sm:w-40">
          <img src={img.url} alt={img.caption || img.fileName} className="h-full w-full object-cover" />
          {!img.active && (
            <span className="absolute left-1.5 top-1.5 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Hidden
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-ink" title={img.fileName}>
              {img.fileName}
            </p>
            <span className="shrink-0 font-mono text-[11px] text-muted">{fmtBytes(img.sizeBytes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              className={`${inputClass} py-2`}
              placeholder="Caption shown on the slide…"
              value={captions[img.id] ?? ''}
              onChange={(e) => setCaptions((c) => ({ ...c, [img.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveCaption(img.id)
                }
              }}
            />
            <Button variant="secondary" onClick={() => saveCaption(img.id)} disabled={busy[img.id]}>
              Save
            </Button>
          </div>
          <p className="text-[11px] text-muted">
            Slide {index + 1} of {list.length} · {KINDS.find((k) => k.value === img.slideKind)?.label}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Button
            variant="secondary"
            className="px-2.5"
            onClick={() => move(img.id, -1)}
            disabled={busy[img.id] || isFirst}
            aria-label="Move up"
            title="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="px-2.5"
            onClick={() => move(img.id, 1)}
            disabled={busy[img.id] || isLast}
            aria-label="Move down"
            title="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant={img.active ? 'secondary' : 'success'}
            className="px-2.5"
            onClick={() => patch(img.id, { active: !img.active })}
            disabled={busy[img.id]}
            aria-label={img.active ? 'Hide from public pages' : 'Show on public pages'}
            title={img.active ? 'Visible on public pages — click to hide' : 'Hidden — click to show'}
          >
            {img.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <label
            className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface-muted px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper-darker ${busy[img.id] ? 'pointer-events-none opacity-50' : ''}`}
            title="Replace with a new file"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Replace</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={busy[img.id]}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) replaceFile(img.id, file)
                e.target.value = ''
              }}
            />
          </label>
          <Button
            variant="danger"
            className="px-2.5"
            onClick={() => remove(img.id)}
            disabled={busy[img.id]}
            aria-label="Delete image"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </li>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="Branding"
        subtitle="Manage the imagery shown on the public landing slideshow and the sign-in / registration backgrounds."
      />

      {error && (
        <div className="mb-5">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      {notice && (
        <div className="mb-5">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}

      {/* Upload */}
      <Card className="mb-6 p-6">
        <h2 className="text-base font-semibold text-ink">Upload image</h2>
        <p className="mt-1 text-sm text-ink-700/70">
          JPEG, PNG, WebP or GIF. Landing slides show full-bleed; auth backgrounds render dimmed behind a blue
          wash so the cards stay readable.
        </p>
        <form onSubmit={handleUpload} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Surface" id="uploadKind">
            <select
              id="uploadKind"
              className={inputClass}
              value={uploadKind}
              onChange={(e) => setUploadKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Caption (optional)" id="uploadCaption">
            <input
              id="uploadCaption"
              className={inputClass}
              placeholder="e.g. Nyungwe Water Fall — Huye District"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
            />
          </Field>
          <Field label="Image file" id="uploadFile">
            <input
              id="uploadFile"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </Field>
          <div className="md:col-span-3">
            <Button type="submit" disabled={uploading || !uploadFile}>
              {uploading ? 'Uploading…' : 'Upload image'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Lists */}
      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading branding images…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {KINDS.map((kind) => {
            const list = images[kind.value] || []
            return (
              <Card key={kind.value} className="p-6">
                <h2 className="text-base font-semibold text-ink">{kind.label}</h2>
                <p className="mt-1 text-sm text-ink-700/70">{kind.hint}</p>
                {list.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-dashed border-line bg-paper p-8 text-center">
                    <ImagePlus className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
                    <p className="mt-3 text-sm font-medium text-ink-700">No images yet</p>
                    <p className="mt-1 text-[13px] text-muted">
                      Upload one above and it will appear here in display order.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3">
                    {list.map((img, i) => renderRow(img, i, list))}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <p className={`mt-6 text-[13px] ${labelCls}`}>
        Changes go live immediately on the public pages — no rebuild needed.
      </p>
    </AppShell>
  )
}
