import { useRef, useCallback } from 'react'

let _nextId = 0

// Gerencia popups de dano do herói em paralelo (sem bloquear o turno).
// Retorna funções para spawnar popups individuais, mostrar o total e limpar.
export function useHeroDamagePopups(setPopups, setTotalPopup) {
  const accumRef = useRef(0)
  const mergeTimerRef = useRef(null)

  // Spawna um popup individual "-N" que sobe e some via animationend
  const spawnDmgPopup = useCallback((value) => {
    const id = _nextId++
    accumRef.current += value
    setPopups(prev => [...prev, { id, value }])

    // Agenda merge: se nenhum novo popup chegar em 600ms, mostra o total
    clearTimeout(mergeTimerRef.current)
    mergeTimerRef.current = setTimeout(() => {
      const total = accumRef.current
      if (total <= 0) return
      // Remove todos os individuais e mostra o total
      setPopups([])
      setTotalPopup({ id: _nextId++, value: total })
      accumRef.current = 0
    }, 600)
  }, [setPopups, setTotalPopup])

  const removePopup = useCallback((id) => {
    setPopups(prev => prev.filter(p => p.id !== id))
  }, [setPopups])

  const clearAll = useCallback(() => {
    clearTimeout(mergeTimerRef.current)
    accumRef.current = 0
    setPopups([])
    setTotalPopup(null)
  }, [setPopups, setTotalPopup])

  // Aplica o dano acumulado ao HP — chamado após o total popup aparecer
  const flushDamage = useCallback((applyFn) => {
    const total = accumRef.current
    if (total > 0) {
      applyFn(total)
      accumRef.current = 0
    }
  }, [])

  return { spawnDmgPopup, removePopup, clearAll, flushDamage, accumRef }
}
