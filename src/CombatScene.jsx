export default function CombatScene({ bgSrc, isBoss, children }) {
  return (
    <div
      className={`combat-scene${isBoss ? ' boss-scene' : ''}`}
      style={{
        backgroundImage: `url(${bgSrc})`,
        filter: isBoss ? 'hue-rotate(270deg) saturate(1.4) brightness(0.85)' : undefined,
      }}
    >
      {children}
    </div>
  )
}
