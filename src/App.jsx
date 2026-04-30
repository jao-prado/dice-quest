import { useState } from 'react'
import './App.css'
import campoBatalha from './assets/cenario.png'
import heroi_parado  from './ARTES/HEROI/heroi_parado.png'
import heroi_ataque1 from './ARTES/HEROI/heroi_comecando_atacar.png'
import heroi_ataque2 from './ARTES/HEROI/heroi_ataque_finalizado.png'
import monstro_parado from './ARTES/MONSTRO/monstro_parado.png'
import monstro_ataque from './ARTES/MONSTRO/monstro_ataque_finalizado.png'
import ItemStage from './ItemStage'
import DiceRollAnimation from './DiceRollAnimation'
import DamagePopup from './DamagePopup'
import { Icon, IC } from './icons'
import InventoryMenu, { ITEM_DATA } from './InventoryMenu'

const PERKS = [
  { id: 'damage',  name: 'Dano',      icon: 'peark_dano',      desc: '+1 dano base' },
  { id: 'defense', name: 'Defesa',    icon: 'peark_defesa',    desc: 'Reduz 1 dano recebido' },
  { id: 'maxhp',   name: 'Vida',      icon: 'peark_vida',      desc: '+3 HP maximo' },
  { id: 'luck',    name: 'Sorte',     icon: 'peark_sorte',     desc: 'Reroll 1x por combate' },
  { id: 'agility', name: 'Agilidade', icon: 'peark_agilidade', desc: '20% chance de esquivar' },
]

const ENEMIES = [
  { name: 'Goblin',    hp: 8,  dmg: 3, xp: 1, type: 'normal' },
  { name: 'Orc',       hp: 12, dmg: 4, xp: 2, type: 'normal' },
  { name: 'Esqueleto', hp: 10, dmg: 4, xp: 2, type: 'normal' },
]
const BOSS = { name: 'Boss Necromante', hp: 30, dmg: 6, xp: 5, type: 'boss' }

const XP_TO_LEVEL = (lvl) => lvl * 3

function getEnemy(phase) {
  if (phase % 5 === 0) {
    const hp = BOSS.hp + Math.floor(phase / 5) * 10
    return { ...BOSS, hp, maxHp: hp }
  }
  const pool = phase < 3 ? [ENEMIES[0]] : phase < 6 ? ENEMIES.slice(0, 2) : ENEMIES
  const base = pool[Math.floor(Math.random() * pool.length)]
  const hp = base.hp + Math.floor(phase / 2)
  return { ...base, hp, maxHp: hp }
}

function pickPerks() {
  return [...PERKS].sort(() => Math.random() - 0.5).slice(0, 3)
}

function getDiceEffect(roll) {
  if (roll === 1) return { mult: 0 }
  if (roll <= 3)  return { mult: 0.75 }
  if (roll <= 6)  return { mult: 1 }
  if (roll === 7) return { mult: 1.5 }
  return              { mult: 2 }
}

const rollD8 = () => Math.floor(Math.random() * 8) + 1

const initialPlayer = {
  hp: 20, maxHp: 20, xp: 0, level: 1, phase: 1,
  perks: {}, inventory: ['pocao', 'pocao'], rerollUsed: false,
  baseDmg: 20,
}

function applyPerks(base, perks) {
  return {
    ...base,
    baseDmg: base.baseDmg + (perks.damage || 0),
    defense: perks.defense || 0,
    maxHp:   base.maxHp + (perks.maxhp || 0) * 3,
    agility: perks.agility ? 0.2 : 0,
  }
}

function HeroSprite({ anim }) {
  const src = anim === 'atk2' ? heroi_ataque2 : anim === 'atk1' ? heroi_ataque1 : heroi_parado
  return <img src={src} alt="hero" className="sprite hero-sprite" />
}

function EnemySprite({ anim, isBoss }) {
  const src = anim === 'atk' ? monstro_ataque : monstro_parado
  const cls = `sprite enemy-sprite${isBoss ? ' boss-sprite' : ''}`
  const style = isBoss ? { filter: 'hue-rotate(270deg) saturate(2) brightness(0.85)' } : {}
  return <img src={src} alt="enemy" className={cls} style={style} />
}

export default function App() {
  const [player,      setPlayer]      = useState(initialPlayer)
  const [gameState,   setGameState]   = useState('title')
  const [enemy,       setEnemy]       = useState(null)
  const [diceResult,  setDiceResult]  = useState(null)
  const [perkChoices, setPerkChoices] = useState([])
  const [rolling,     setRolling]     = useState(false)
  const [heroAnim,    setHeroAnim]    = useState('idle')
  const [enemyAnim,   setEnemyAnim]   = useState('idle')
  const [showDice,    setShowDice]    = useState(false)
  const [pendingDice, setPendingDice] = useState(null)
  const [enemyDmgPop, setEnemyDmgPop] = useState(null)
  const [heroDmgPop,  setHeroDmgPop]  = useState(null)
  const [enemyHit,    setEnemyHit]    = useState(false)
  const [showInventory, setShowInventory] = useState(false)

  const playHeroAttack = (cb) => {
    setHeroAnim('atk1')
    setTimeout(() => { setHeroAnim('atk2'); setTimeout(() => { setHeroAnim('idle'); cb() }, 200) }, 200)
  }

  const playEnemyAttack = (cb) => {
    setEnemyAnim('atk')
    setTimeout(() => { setEnemyAnim('idle'); cb() }, 400)
  }

  const isItemPhase = (phase) => phase % 3 === 0 && phase % 5 !== 0

  const startPhase = (p = player) => {
    if (isItemPhase(p.phase)) { setGameState('item'); return }
    const e = getEnemy(p.phase)
    setEnemy({ ...e, maxHp: e.hp })
    setDiceResult(null)
    setHeroAnim('idle')
    setEnemyAnim('idle')
    setGameState('combat')
  }

  const handleCollect = (loot) => {
    setPlayer(p => ({ ...p, inventory: [...p.inventory, loot.id], phase: p.phase + 1 }))
    setGameState('menu')
  }

  const handleAttack = () => {
    if (rolling) return
    setRolling(true)
    const roll = rollD8()
    setDiceResult(roll)
    setShowDice(true)
    setPendingDice({ roll, action: 'attack' })
  }

  const handleDefend = () => {
    if (rolling) return
    setRolling(true)
    const roll = rollD8()
    setDiceResult(roll)
    setShowDice(true)
    setPendingDice({ roll, action: 'defend' })
  }

  const onDiceAnimDone = () => {
    setShowDice(false)
    const { roll, action } = pendingDice
    if (action === 'attack') resolveAttack(roll)
    else resolveDefend(roll)
  }

  const resolveAttack = (roll) => {
    const { mult } = getDiceEffect(roll)
    const stats = applyPerks(player, player.perks)
    const dmg = Math.max(mult === 0 ? 0 : 1, Math.round(stats.baseDmg * mult))
    const newEnemyHp = Math.max(0, enemy.hp - dmg)

    playHeroAttack(() => {
      setEnemy(e => ({ ...e, hp: newEnemyHp }))
      setEnemyHit(true)
      setEnemyDmgPop(dmg)
      setTimeout(() => setEnemyHit(false), 400)

      if (newEnemyHp <= 0) {
        setTimeout(() => { enemyDied(); setRolling(false) }, 1500)
        return
      }
      setTimeout(() => {
        playEnemyAttack(() => {
          doEnemyDamage(false, 0)
          setTimeout(() => setRolling(false), 1500)
        })
      }, 1500)
    })
  }

  const resolveDefend = (roll) => {
    playEnemyAttack(() => {
      doEnemyDamage(true, roll)
      setTimeout(() => setRolling(false), 1500)
    })
  }

  const doEnemyDamage = (isDefending, defRoll) => {
    const stats = applyPerks(player, player.perks)
    if (stats.agility > 0 && Math.random() < stats.agility) { setHeroDmgPop(0); return }
    const eRoll = rollD8()
    const { mult: eMult } = getDiceEffect(eRoll)
    let dmg = Math.max(1, Math.round(enemy.dmg * eMult))
    if (isDefending) dmg = defRoll >= 5 ? 0 : Math.max(0, dmg - Math.floor(defRoll / 2))
    dmg = Math.max(0, dmg - (stats.defense || 0))
    setHeroDmgPop(dmg)
    setPlayer(p => {
      const newHp = p.hp - dmg
      if (newHp <= 0) { setTimeout(() => setGameState('gameover'), 300); return { ...p, hp: 0 } }
      return { ...p, hp: newHp }
    })
  }

  const handleUseItem = (id) => {
    const data = ITEM_DATA[id]
    if (!data) return
    setPlayer(p => {
      const inv = [...p.inventory]
      const idx = inv.indexOf(id)
      if (idx === -1) return p
      inv.splice(idx, 1)
      return data.effect({ ...p, inventory: inv })
    })
    setShowInventory(false)
  }

  const handleReroll = () => {
    if (player.rerollUsed || !player.perks.luck) return
    const roll = rollD8()
    setDiceResult(roll)
    setPlayer(p => ({ ...p, rerollUsed: true }))
  }

  const enemyDied = () => {
    const xpGain = enemy.xp
    setPlayer(p => {
      const newXp = p.xp + xpGain
      const needed = XP_TO_LEVEL(p.level)
      if (newXp >= needed) {
        setPerkChoices(pickPerks())
        setTimeout(() => setGameState('levelup'), 400)
        return { ...p, xp: newXp - needed, level: p.level + 1, phase: p.phase + 1, rerollUsed: false }
      }
      setTimeout(() => setGameState('menu'), 400)
      return { ...p, xp: newXp, phase: p.phase + 1, rerollUsed: false }
    })
  }

  const choosePerk = (perk) => {
    setPlayer(p => {
      const current = p.perks[perk.id] || 0
      const updated = { ...p, perks: { ...p.perks, [perk.id]: current + 1 } }
      if (perk.id === 'maxhp') updated.hp = Math.min(updated.hp + 3, updated.maxHp + 3)
      setTimeout(() => setGameState('menu'), 100)
      return updated
    })
  }

  const removeOne = (arr, item) => {
    const i = arr.indexOf(item)
    return i >= 0 ? [...arr.slice(0, i), ...arr.slice(i + 1)] : arr
  }

  const restart = () => {
    setPlayer(initialPlayer)
    setGameState('title')
    setDiceResult(null)
  }

  const hpPct   = (player.hp / player.maxHp) * 100
  const xpPct   = (player.xp / XP_TO_LEVEL(player.level)) * 100
  const potions = player.inventory.filter(i => i === 'pocao').length

  return (
    <div className="game">

      {/* TITLE */}
      {gameState === 'title' && (
        <div className="title-screen">
          <div className="title-bg" />
          <div className="title-content">
            <div className="title-logo">
              <img src={IC.titulo} alt="logo" className="title-logo-img" />
              <p className="title-sub">Roguelite de Dados</p>
            </div>
            <button className="img-btn title-btn" onClick={() => setGameState('menu')}>
              <img src={IC.comecar_jogo} alt="Jogar" />
            </button>
            <p className="title-hint">Sobreviva o maximo que puder</p>
          </div>
        </div>
      )}

      {/* MENU */}
      {gameState === 'menu' && (
        <div className="fullscreen-panel menu-screen">
          <img src={IC.titulo} alt="Dice Quest" className="menu-logo" />

          <div className="menu-card">
            <div className="menu-hero-row">
              <img src={heroi_parado} alt="hero" className="menu-hero-img" />
              <div className="menu-stats">
                <div className="menu-stat-row">
                  <span className="menu-stat-label">HP</span>
                  <div className="bar menu-bar"><div className="bar-fill hp" style={{ width: `${hpPct}%` }} /></div>
                  <span className="menu-stat-val">{player.hp}/{player.maxHp}</span>
                </div>
                <div className="menu-stat-row">
                  <span className="menu-stat-label">XP</span>
                  <div className="bar menu-bar"><div className="bar-fill xp" style={{ width: `${xpPct}%` }} /></div>
                  <span className="menu-stat-val">{player.xp}/{XP_TO_LEVEL(player.level)}</span>
                </div>
                <div className="menu-info-row">
                  <span>LV. {player.level}</span>
                  <span>FASE {player.phase}</span>
                  {player.phase % 5 === 0 && <span className="boss-warn">BOSS!</span>}
                </div>
              </div>
            </div>

            {Object.keys(player.perks).length > 0 && (
              <div className="menu-perks">
                {Object.entries(player.perks).map(([k, v]) => {
                  const perk = PERKS.find(p => p.id === k)
                  return (
                    <div key={k} className="menu-perk-chip">
                      <Icon name={perk?.icon} size={16} />
                      <span>{perk?.name} {v}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {player.inventory.length > 0 && (
              <div className="menu-inventory">
                {Object.entries(player.inventory.reduce((a,i)=>{a[i]=(a[i]||0)+1;return a},{})).map(([id, qty]) => (
                  <span key={id} className="item-badge">
                    <img src={IC.pocao} alt="" style={{width:14,height:14,imageRendering:'pixelated',verticalAlign:'middle'}} /> x{qty}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="img-btn menu-btn" onClick={() => startPhase(player)}>
            {player.phase % 5 === 0
              ? <img src={IC.enfrentar_boss} alt="Enfrentar Boss" />
              : <img src={IC.proximo_enc}    alt="Proximo Encontro" />}
          </button>
        </div>
      )}

      {/* COMBAT */}
      {gameState === 'combat' && enemy && (
        <div className="combat-screen">
          <div className="combat-scene" style={{ backgroundImage: `url(${campoBatalha})` }}>

            <div className="enemy-hud">
              <div className="hud-name">{enemy.name} <span>Lv.{player.phase}</span></div>
              <div className="hud-hp-row">
                <span className="hp-label">HP</span>
                <div className="bar hud-bar"><div className="bar-fill enemy-hp" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} /></div>
              </div>
            </div>

            <div className="scene-hero"><HeroSprite anim={heroAnim} /></div>

            <div className={`scene-enemy${enemyHit ? ' hit' : ''}`}>
              {enemyDmgPop !== null && (
                <DamagePopup damage={enemyDmgPop} type="enemy" onDone={() => setEnemyDmgPop(null)} />
              )}
              <EnemySprite anim={enemyAnim} isBoss={enemy.type === 'boss'} />
            </div>

            <div className="player-hud">
              <div className="hud-name">HERO <span>Lv.{player.level}</span></div>
              <div className="hud-hp-row">
                <span className="hp-label">HP</span>
                <div className="bar hud-bar"><div className="bar-fill hp" style={{ width: `${hpPct}%` }} /></div>
              </div>
              <div className="hud-hp-num">{player.hp} / {player.maxHp}</div>
              <div className="hud-hp-row">
                <span className="hp-label exp">EXP</span>
                <div className="bar hud-bar"><div className="bar-fill xp" style={{ width: `${xpPct}%` }} /></div>
              </div>
            </div>

            {heroDmgPop !== null && (
              <div className="hero-dmg-pos">
                <DamagePopup damage={heroDmgPop} type="hero" onDone={() => setHeroDmgPop(null)} />
              </div>
            )}

            {showDice && pendingDice && (
              <DiceRollAnimation result={pendingDice.roll} onDone={onDiceAnimDone} />
            )}

            <div className="action-bar">
              <button className="img-btn" onClick={handleAttack} disabled={rolling}>
                <img src={IC.peark_dano} alt="Attack" />
              </button>
              <button className="img-btn" onClick={handleDefend} disabled={rolling}>
                <img src={IC.peark_defesa} alt="Defend" />
              </button>
              <button className="img-btn" onClick={() => setShowInventory(true)} disabled={rolling}>
                <img src={IC.mochila} alt="Mochila" />
              </button>
              {player.perks.luck && !player.rerollUsed && (
                <button className="img-btn" onClick={handleReroll} disabled={rolling}>
                  <img src={IC.peark_sorte} alt="Reroll" />
                </button>
              )}
            </div>

            {showInventory && (
              <InventoryMenu
                inventory={player.inventory}
                onUse={handleUseItem}
                onClose={() => setShowInventory(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* ITEM STAGE */}
      {gameState === 'item' && (
        <ItemStage player={player} phase={player.phase} onCollect={handleCollect} />
      )}

      {/* LEVEL UP */}
      {gameState === 'levelup' && (
        <div className="fullscreen-panel levelup">
          <img src={IC.level_up} alt="level up" className="screen-icon" />
          <p className="levelup-sub">Escolha um poder para continuar</p>
          <div className="perk-choices">
            {perkChoices.map(perk => (
              <div key={perk.id} className="perk-choice-wrap">
                <button className="img-btn perk-btn" onClick={() => choosePerk(perk)}>
                  <img src={IC[perk.icon]} alt={perk.name} />
                  {player.perks[perk.id] && (
                    <span className="perk-level-badge">Lv.{player.perks[perk.id]}</span>
                  )}
                </button>
                <p className="perk-desc">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === 'gameover' && (
        <div className="fullscreen-panel gameover">
          <img src={IC.game_over} alt="game over" className="screen-icon" />
          <p className="gameover-stats">Fase {player.phase} | Nivel {player.level}</p>
          <button className="img-btn" onClick={restart}>
            <img src={IC.proximo_enc} alt="Recomecar" />
          </button>
        </div>
      )}
    </div>
  )
}
