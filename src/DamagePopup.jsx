import { useEffect, useState } from 'react'

export default function DamagePopup({ damage, type = 'enemy', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.() }, 1400)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const color = type === 'enemy' ? '#ff4444' : type === 'dodge' ? '#ffdd44' : type === 'counter' ? '#ff9900' : '#44aaff'
  const text  = type === 'dodge' ? 'ESQUIVA!' : type === 'counter' ? 'CONTRA-ATAQUE!' : damage === 0 ? 'BLOCK!' : `-${damage}`

  return (
    <div className="damage-popup" style={{ color }}>
      {text}
    </div>
  )
}
