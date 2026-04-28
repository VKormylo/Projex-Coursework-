import { useEffect, useRef } from 'react'

export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  enabled = true,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!enabled) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [enabled, onOutside])

  return ref
}
