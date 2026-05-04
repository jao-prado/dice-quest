import { useEffect, useState } from 'react'
import heroi_parado from './assets/sprites/hero/heroi_parado.png'
import campoBatalha from './assets/backgrounds/cenario.png'
import { IC, Icon } from './icons'
import { PERKS } from './game/perkSystem'
import { XP_TO_LEVEL } from './game/constants'

function buildMapNodes(totalVisible, completedPhase) {
  const start = Math.max(1, completedPhase - 4)
  const nodes = []
  for (let i = 0; i < totalVisible; i++) {
    const phase = start + i
    const row   = Math.floor(i / 5)
    const col   = row % 2 === 0 ? i % 5 : 4 - (i % 5)
    nodes.push({ phase, row, col })
  }
  return nodes
}

const TOTAL_NODES = 10

export default function StageTrail({ player, onNext, onSaveQuit }) {
  const completedPhase = player.phase - 1
  const nodes = buildMapNodes(TOTAL_NODES, completedPhase)
  const currentNode = nodes.find(n => n.phase === completedPhase)

  const [heroCell, setHeroCell] = useState(() => nodes.find(n => n.phase === completedPhase - 1) ?? nodes[0])
  const [walking, setWalking]   = useState(true)
  const [arrived, setArrived]   = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [visibleNodes, setVisibleNodes] = useState(0)

  useEffect(() => {
    // nós aparecem em cascata
    nodes.forEach((_, i) => {
      setTimeout(() => setVisibleNodes(v => Math.max(v, i + 1)), i * 80)
    })
    const t1 = setTimeout(() => setHeroCell(currentNode), 200)
    const t2 = setTimeout(() => { setWalking(false); setArrived(true) }, 1600)
    const t3 = setTimeout(() => setShowPanel(true), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const hpPct = (player.hp / player.maxHp) * 100
  const xpPct = (player.xp / XP_TO_LEVEL(player.level)) * 100
  const cycleStep = ((completedPhase - 1) % 5) + 1
  const isBoss = cycleStep === 5

  return (
    <div className="trail-screen" style={{ backgroundImage: `url(${campoBatalha})` }}>
      <div className="trail-overlay" />

      <div className="trail-layout">

        {/* ── MAPA ── */}
        <div className="trail-map-wrap">
          <div className="trail-map-title">
            {isBoss ? '⚔ BOSS DERROTADO!' : '✦ FASE CONCLUÍDA!'}
          </div>

          <div className="trail-map-grid">
            {nodes.map((node, idx) => {
              const isPast     = node.phase < completedPhase
              const isCurrent  = node.phase === completedPhase
              const isFuture   = node.phase > completedPhase
              const step       = ((node.phase - 1) % 5) + 1
              const isBossNode = step === 5
              const isHeroHere = heroCell?.phase === node.phase
              const isVisible  = idx < visibleNodes

              return (
                <div
                  key={node.phase}
                  className={`trail-cell${isVisible ? ' trail-cell--visible' : ''}`}
                  style={{ gridColumn: node.col + 1, gridRow: node.row + 1 }}
                >
                  {node.col < 4 && (
                    <div className={`trail-connector trail-connector--h${isPast || isCurrent ? ' trail-connector--done' : ''}`}
                      style={{ '--connector-delay': `${idx * 80 + 60}ms` }}
                    />
                  )}

                  <div className={[
                    'trail-node',
                    isPast    && 'trail-node--past',
                    isCurrent && 'trail-node--current',
                    isFuture  && 'trail-node--future',
                    isBossNode && 'trail-node--boss',
                  ].filter(Boolean).join(' ')}>
                    <span className="trail-node-label">
                      {isBossNode ? '💀' : node.phase}
                    </span>
                  </div>

                  {isHeroHere && (
                    <div className={`trail-hero-pin${arrived && isCurrent ? ' trail-hero-pin--arrived' : ''}`}>
                      <img
                        src={heroi_parado}
                        alt="hero"
                        className={`trail-hero-sprite${walking ? ' trail-hero-walk' : ''}`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="trail-phase-info">
            FASE {completedPhase} → {completedPhase + 1}
          </div>
        </div>

        {/* ── PAINEL LATERAL ── */}
        <div className={`trail-side-panel${showPanel ? ' trail-side-panel--visible' : ''}`}>

          <div className="trail-profile">
            <img src={heroi_parado} alt="hero" className="trail-profile-sprite" />
            <div className="trail-profile-info">
              <div className="trail-profile-name">HERÓI</div>
              <div className="trail-profile-lv">LV. {player.level}</div>
            </div>
            <button className="trail-stats-toggle" onClick={() => setShowProfile(v => !v)}>
              {showProfile ? '▲' : '▼'}
            </button>
          </div>

          <div className="trail-bars">
            <div className="trail-bar-row">
              <span className="trail-bar-label">HP</span>
              <div className="trail-bar-track">
                <div className="trail-bar-fill trail-bar-fill--hp" style={{ width: `${hpPct}%` }} />
              </div>
              <span className="trail-bar-val">{player.hp}/{player.maxHp}</span>
            </div>
            <div className="trail-bar-row">
              <span className="trail-bar-label">XP</span>
              <div className="trail-bar-track">
                <div className="trail-bar-fill trail-bar-fill--xp" style={{ width: `${xpPct}%` }} />
              </div>
              <span className="trail-bar-val">{player.xp}/{XP_TO_LEVEL(player.level)}</span>
            </div>
          </div>

          {showProfile && (
            <div className="trail-stats">
              <div className="trail-stats-title">ESTATÍSTICAS</div>
              <div className="trail-stat-row"><span>Fase</span><span>{completedPhase}</span></div>
              <div className="trail-stat-row"><span>Nível</span><span>{player.level}</span></div>
              <div className="trail-stat-row"><span>HP</span><span>{player.hp}/{player.maxHp}</span></div>
              <div className="trail-stat-row"><span>Dano base</span><span>{player.baseDmg}</span></div>
              <div className="trail-stat-row"><span>XP</span><span>{player.xp}</span></div>
              {Object.keys(player.perks).length > 0 && (
                <>
                  <div className="trail-stats-title" style={{ marginTop: 8 }}>PODERES</div>
                  {Object.entries(player.perks).map(([k, v]) => {
                    const perk = PERKS.find(p => p.id === k)
                    return (
                      <div key={k} className="trail-stat-row">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name={perk?.icon} size={12} />{perk?.name}
                        </span>
                        <span className="trail-perk-lv">Lv.{v}</span>
                      </div>
                    )
                  })}
                </>
              )}
              {player.inventory.length > 0 && (
                <>
                  <div className="trail-stats-title" style={{ marginTop: 8 }}>INVENTÁRIO</div>
                  {Object.entries(
                    player.inventory.reduce((a, i) => { a[i] = (a[i] || 0) + 1; return a }, {})
                  ).map(([id, qty]) => (
                    <div key={id} className="trail-stat-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="pocao" size={12} />{id}
                      </span>
                      <span>x{qty}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <div className="trail-actions">
            <button className="trail-btn trail-btn--next" onClick={onNext}>
              <img src={IC.proximo_enc} alt="Próxima Fase" />
            </button>
            <button className="trail-btn trail-btn--quit" onClick={onSaveQuit}>
              <span>💾 SALVAR E SAIR</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
