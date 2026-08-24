import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileArchive, FileText, AlertCircle, X } from 'lucide-react'

const ACCEPTED_ZIP = '.zip'
const ACCEPTED_DOCS = '.pdf,.doc,.docx,.xls,.xlsx'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ name }) {
  if (name.endsWith('.zip')) return <FileArchive className="h-5 w-5 text-brand" />
  return <FileText className="h-5 w-5 text-accent" />
}

/**
 * Drag-and-drop upload zone.
 * Props:
 *   accept: 'zip' | 'docs' | 'any'
 *   multiple: boolean
 *   label: string
 *   hint: string
 *   files: File[] — controlled
 *   onChange: (files) => void
 *   error: string
 */
export default function DragDropUpload({
  accept = 'any',
  multiple = false,
  label = 'Drop files here',
  hint = 'or click to browse',
  files = [],
  onChange,
  error,
  disabled = false,
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const counter = useRef(0)

  const acceptStr = accept === 'zip' ? ACCEPTED_ZIP : accept === 'docs' ? ACCEPTED_DOCS : undefined

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    counter.current++
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    counter.current--
    if (counter.current === 0) setDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const addFiles = useCallback(
    (incoming) => {
      const list = multiple ? [...files, ...incoming] : incoming.slice(0, 1)
      onChange?.(list)
    },
    [files, multiple, onChange],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      counter.current = 0
      setDragging(false)
      if (disabled) return
      const incoming = Array.from(e.dataTransfer.files)
      addFiles(incoming)
    },
    [addFiles, disabled],
  )

  const handleInput = useCallback(
    (e) => {
      const incoming = Array.from(e.target.files || [])
      addFiles(incoming)
      e.target.value = ''
    },
    [addFiles],
  )

  const removeFile = useCallback(
    (idx) => {
      onChange?.(files.filter((_, i) => i !== idx))
    },
    [files, onChange],
  )

  return (
    <div>
      {label && (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
          {label}
        </p>
      )}
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        animate={{
          borderColor: dragging ? '#0f5fa8' : error ? '#b34a4a' : '#e3e6ea',
          backgroundColor: dragging ? 'rgba(15,95,168,0.04)' : 'transparent',
        }}
        transition={{ duration: 0.2 }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-shadow ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md'
        } ${dragging ? 'shadow-[0_0_0_3px_rgba(15,95,168,0.12)]' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          multiple={multiple}
          onChange={handleInput}
          className="hidden"
          aria-label={label}
          disabled={disabled}
        />

        <motion.div
          animate={{ scale: dragging ? 1.1 : 1, y: dragging ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Upload className={`mx-auto h-8 w-8 ${dragging ? 'text-brand' : 'text-muted/50'}`} />
        </motion.div>

        <p className="mt-3 text-sm font-medium text-ink">
          {dragging ? 'Release to upload' : label}
        </p>
        <p className="mt-1 text-xs text-muted">{hint}</p>

        {acceptStr && (
          <p className="mt-2 text-[10px] text-muted/60">
            Accepted: {acceptStr.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
          </p>
        )}
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {files.map((f, i) => (
              <motion.li
                key={`${f.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2.5"
              >
                <FileIcon name={f.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                  <p className="text-xs text-muted">{formatSize(f.size)}</p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="rounded-md p-1 text-muted transition-colors hover:bg-brick/10 hover:text-brick"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-1.5 text-xs text-brick"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  )
}
