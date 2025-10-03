import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(({ key, ctrlKey, shiftKey, altKey, metaKey, callback }) => {
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()
      const ctrlMatches = !!ctrlKey === event.ctrlKey
      const shiftMatches = !!shiftKey === event.shiftKey
      const altMatches = !!altKey === event.altKey
      const metaMatches = !!metaKey === event.metaKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        // Evitar conflitos com inputs
        const target = event.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.contentEditable === 'true'

        if (!isInput) {
          event.preventDefault()
          callback()
        }
      }
    })
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: shortcuts.map(({ description }) => description).filter(Boolean)
  }
}
