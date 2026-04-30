import { useEffect, useState } from 'react'

export default function DamagePopup({ damage, type = 'enemy', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.() }, 1400)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const color = type === 'enemy' ? '#ff4444' : '#44aaff'
  const text  = damage === 0 ? 'BLOCK!' : `-${damage}`

  return (
    <div className="damage-popup" style={{ color }}>
      {text}
    </div>
  )
}
