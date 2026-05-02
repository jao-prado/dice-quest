import { useEffect, useState } from 'react'

// type: 'enemy' | 'dodge' | 'counter' | 'hero' | 'individual' | 'total'
// individual: popup pequeno empilhado, resolve via animationend
// total: popup grande com glow, resolve via animationend
export default function DamagePopup({ damage, type = 'enemy', onDone, onStart, yOffset = 0 }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    onStart?.()
    // individual e total resolvem via onAnimationEnd — sem setTimeout
    if (type === 'individual' || type === 'total') return
    const t = setTimeout(() => { setVisible(false); onDone?.() }, 1400)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const color = type === 'enemy'      ? '#ff4444'
    : type === 'dodge'      ? '#ffdd44'
    : type === 'counter'    ? '#ff9900'
    : type === 'individual' ? '#ff9999'
    : type === 'total'      ? '#ff2222'
    : '#44aaff'

  const text = type === 'dodge'   ? 'ESQUIVA!'
    : type === 'counter' ? 'CONTRA-ATAQUE!'
    : damage === 0       ? 'BLOCK!'
    : `-${damage}`

  const cls = type === 'individual' ? 'damage-popup damage-popup-individual'
    : type === 'total'      ? 'damage-popup damage-popup-total'
    : type === 'counter'    ? 'damage-popup damage-popup-counter'
    : 'damage-popup'

  const handleAnimEnd = (type === 'individual' || type === 'total' || type === 'counter')
    ? () => { setVisible(false); onDone?.() }
    : undefined

  return (
    <div
      className={cls}
      style={{ color, '--y-offset': `${yOffset}px` }}
      onAnimationEnd={handleAnimEnd}
    >
      {text}
    </div>
  )
}
