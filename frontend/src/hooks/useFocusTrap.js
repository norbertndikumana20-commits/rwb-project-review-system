import { useEffect, useRef } from 'react'

/**
 * Traps keyboard focus inside a container element.
 * Pressing Escape calls onClose (if provided).
 * The first focusable element receives focus on mount.
 */
export function useFocusTrap(onClose) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const FOCUSABLE =
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
    const focusable = Array.from(el.querySelectorAll(FOCUSABLE))
    if (focusable.length) focusable[0].focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return ref
}
