import { useRef, useCallback } from 'react'

// Processa eventos de combate sequencialmente usando promises + animationend
export function useCombatQueue() {
  const queue = useRef([])
  const running = useRef(false)
  const resolveAnim = useRef([])
  const resolvePopup = useRef(null)

  const processNext = useCallback(async () => {
    if (running.current || queue.current.length === 0) return
    running.current = true

    while (queue.current.length > 0) {
      const event = queue.current.shift()
      await event()
    }

    running.current = false
  }, [])

  const enqueue = useCallback((eventFn) => {
    queue.current.push(eventFn)
    processNext()
  }, [processNext])

  const enqueueAll = useCallback((eventFns) => {
    queue.current.push(...eventFns)
    processNext()
  }, [processNext])

  const resolveAnimation = useCallback(() => {
    const fn = resolveAnim.current.shift()
    if (fn) fn()
  }, [])

  const waitForAnim = useCallback(() => {
    return new Promise(resolve => { resolveAnim.current.push(resolve) })
  }, [])

  const resolvePopupAnim = useCallback(() => {
    if (resolvePopup.current) { resolvePopup.current(); resolvePopup.current = null }
  }, [])

  const waitForPopup = useCallback(() => {
    return new Promise(resolve => { resolvePopup.current = resolve })
  }, [])

  const clearQueue = useCallback(() => {
    queue.current = []
    running.current = false
    resolveAnim.current = []
    resolvePopup.current = null
  }, [])

  return { enqueue, enqueueAll, resolveAnimation, waitForAnim, resolvePopupAnim, waitForPopup, clearQueue }
}
