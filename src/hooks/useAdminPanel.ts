import { useEffect, useState, useCallback } from 'react'

export interface AdminPanelState {
  isOpen: boolean
  forceWinOnce: boolean
  forceLoseOnce: boolean
}

export function useAdminPanel() {
  const [state, setState] = useState<AdminPanelState>({
    isOpen: false,
    forceWinOnce: false,
    forceLoseOnce: false,
  })

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+G — toggle panel
    if (e.ctrlKey && e.key === 'g') {
      e.preventDefault()
      setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
      return
    }

    // Ctrl+X — force win on next upgrade
    if (e.ctrlKey && e.key === 'x') {
      e.preventDefault()
      setState(prev => ({ ...prev, forceWinOnce: true, forceLoseOnce: false }))
      return
    }

    // Ctrl+Z — force lose on next upgrade
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      setState(prev => ({ ...prev, forceLoseOnce: true, forceWinOnce: false }))
      return
    }

    // Escape — close panel
    if (e.key === 'Escape') {
      setState(prev => ({ ...prev, isOpen: false }))
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const consumeForceWin = useCallback(() => {
    if (state.forceWinOnce) {
      setState(prev => ({ ...prev, forceWinOnce: false }))
      return true
    }
    return false
  }, [state.forceWinOnce])

  const consumeForceLose = useCallback(() => {
    if (state.forceLoseOnce) {
      setState(prev => ({ ...prev, forceLoseOnce: false }))
      return true
    }
    return false
  }, [state.forceLoseOnce])

  const togglePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  return {
    ...state,
    consumeForceWin,
    consumeForceLose,
    togglePanel,
  }
}