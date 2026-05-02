import { useState, useEffect, useRef } from 'react'
import './App.css'
import { unlockAudio, playSfx, playHover, fadeToBgm, stopBgm } from './audio/AudioManager'
import AudioSettings from './AudioSettings'
import campoBatalha from './assets/cenario.png'
import bgTituloImg  from './assets/background_tela_inicial.png'
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
  { id: 'damage',  name: 'Dano',      icon: 'peark_dano',      desc: (lv) => `+${DMG_PER_LEVEL[Math.min(lv+1,5)]} dano` },
  { id: 'defense', name: 'Defesa',    icon: 'peark_defesa',    desc: (lv) => `-${DEF_PER_LEVEL[Math.min(lv+1,5)]} dano recebido` },
  { id: 'maxhp',   name: 'Vida',      icon: 'peark_vida',      desc: (lv) => `+${HP_PER_LEVEL[Math.min(lv+1,5)] - HP_PER_LEVEL[Math.min(lv,5)]} HP maximo` },
  { id: 'luck',    name: 'Sorte',     icon: 'peark_sorte',     desc: (lv) => `+${Math.round(LUCK_PER_LEVEL[Math.min(lv+1,5)]*100)}% chance de rolar melhor` },
  { id: 'agility', name: 'Agilidade', icon: 'peark_agilidade', desc: (lv) => `+${Math.round(AGIL_PER_LEVEL[Math.min(lv+1,5)]*100)}% chance de esquivar` },
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

const rollD8 = (luckLevel = 0) => {
  const roll = Math.floor(Math.random() * 8) + 1
  const luckChance = LUCK_PER_LEVEL[Math.min(luckLevel, 5)]
  if (luckChance > 0 && Math.random() < luckChance) return Math.min(8, roll + 1)
  return roll
}

const initialPlayer = {
  hp: 20, maxHp: 20, xp: 0, level: 1, phase: 1,
  perks: {}, inventory: ['pocao', 'pocao'],
  baseDmg: 20,
}

const HP_PER_LEVEL    = [0, 3, 6, 9, 13, 18]
const DEF_PER_LEVEL   = [0, 1, 2, 4, 6, 9]
const DMG_PER_LEVEL   = [0, 1, 2, 4, 6, 9]
const LUCK_PER_LEVEL  = [0, 0.05, 0.10, 0.18, 0.28, 0.40]
const AGIL_PER_LEVEL  = [0, 0.06, 0.12, 0.20, 0.30, 0.40]

function applyPerks(base, perks) {
  return {
    ...base,
    baseDmg: base.baseDmg + DMG_PER_LEVEL[Math.min(perks.damage || 0, 5)],
    defense: DEF_PER_LEVEL[Math.min(perks.defense || 0, 5)],
    agility: AGIL_PER_LEVEL[Math.min(perks.agility || 0, 5)],
  }
}

function HeroSprite({ anim }) {
  const src = anim === 'atk2' ? heroi_ataque2 : anim === 'atk1' ? heroi_ataque1 : heroi_parado
  return <img src={src} alt="hero" className="sprite hero-sprite" />
}

function EnemySprite({ anim, isBoss, dying, onDyingDone }) {
  const src = anim === 'atk' ? monstro_ataque : monstro_parado
  const cls = `sprite enemy-sprite${isBoss ? ' boss-sprite' : ''}${dying ? ' enemy-dying' : ''}`
  const style = isBoss ? { filter: 'hue-rotate(270deg) saturate(2) brightness(0.85)' } : {}
  return (
    <img
      src={src} alt="enemy" className={cls} style={style}
      onAnimationEnd={dying ? onDyingDone : undefined}
    />
  )
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
  const [heroHit,     setHeroHit]     = useState(false)
  const [heroDodge,   setHeroDodge]   = useState(false)
  const [heroBlock,   setHeroBlock]   = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [perkChosen, setPerkChosen] = useState(false)
  const [canCounterAttack, setCanCounterAttack] = useState(false)
  const [titleBgmStarted, setTitleBgmStarted] = useState(false)
  const [showMusicPrompt, setShowMusicPrompt] = useState(true)
  // combatPhase: 'idle' | 'hit' | 'dying' | 'deathAnim' | 'dead'
  const [combatPhase, setCombatPhase] = useState('idle')
  const hoveredBtn = useRef(null)
  const lastHoverTime = useRef(0)

  // BGM automático por estado
  useEffect(() => {
    if (gameState === 'combat') {
      if (enemy?.type === 'boss') fadeToBgm('boss')
      else fadeToBgm('overworld')
    } else if (gameState === 'gameover') {
      stopBgm()
      playSfx('gameover')
    }
  }, [gameState, enemy?.type])

  const startTitleBgm = () => {
    unlockAudio()
    if (!titleBgmStarted) { setTitleBgmStarted(true); fadeToBgm('title') }
  }

  const acceptMusic = () => {
    setShowMusicPrompt(false)
    unlockAudio()
    setTitleBgmStarted(true)
    fadeToBgm('title')
  }

  const declineMusic = () => {
    setShowMusicPrompt(false)
    unlockAudio()
  }

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
    playSfx('click')
    if (isItemPhase(p.phase)) { setGameState('item'); return }
    const e = getEnemy(p.phase)
    setEnemy({ ...e, maxHp: e.hp })
    setDiceResult(null)
    setHeroAnim('idle')
    setEnemyAnim('idle')
    setCombatPhase('idle')
    setCanCounterAttack(false)
    setGameState('combat')
  }

  const handleCollect = (loot) => {
    playSfx('item_collect')
    setPlayer(p => ({ ...p, inventory: [...p.inventory, loot.id], phase: p.phase + 1 }))
    setGameState('menu')
  }

  const handleAttack = () => {
    if (rolling) return
    setRolling(true)
    playSfx('dice_roll')
    const roll = rollD8(player.perks.luck || 0)
    setDiceResult(roll)
    setShowDice(true)
    setPendingDice({ roll, action: canCounterAttack ? 'counter' : 'attack' })
  }

  const handleDefend = () => {
    if (rolling) return
    setRolling(true)
    playSfx('dice_roll')
    const roll = rollD8(player.perks.luck || 0)
    setDiceResult(roll)
    setShowDice(true)
    setPendingDice({ roll, action: 'defend' })
  }

  const onDiceAnimDone = () => {
    setShowDice(false)
    const { roll, action } = pendingDice
    if (action === 'attack')  resolveAttack(roll)
    else if (action === 'counter') resolveCounter(roll)
    else resolveDefend(roll)
  }

  const doHeroAttack = (roll, afterCb) => {
    const { mult } = getDiceEffect(roll)
    const stats = applyPerks(player, player.perks)
    const forcaBonus = player.tempDmg || 0
    const baseDmgTotal = stats.baseDmg + forcaBonus
    const dmg = Math.max(mult === 0 ? 0 : 1, Math.round(baseDmgTotal * mult))
    if (forcaBonus > 0) setPlayer(p => ({ ...p, tempDmg: 0 }))
    const newEnemyHp = Math.max(0, enemy.hp - dmg)
    const sfxHit = mult >= 2 ? 'attack_critical' : mult >= 1.5 ? 'attack_strong' : 'attack'
    playHeroAttack(() => {
      setEnemy(e => ({ ...e, hp: newEnemyHp }))
      setEnemyHit(true)
      setEnemyDmgPop(dmg)
      if (mult === 0) playSfx('defend')
      else playSfx(sfxHit, mult >= 2 ? 0.25 : 1)
      setTimeout(() => setEnemyHit(false), 500)
      if (newEnemyHp <= 0) { setCombatPhase('hit'); return }
      afterCb()
    })
  }

  const resolveAttack = (roll) => {
    doHeroAttack(roll, () => {
      setTimeout(() => {
        playEnemyAttack(() => {
          doEnemyDamage(false, 0)
          setTimeout(() => setRolling(false), 1500)
        })
      }, 1500)
    })
  }

  const resolveCounter = (roll) => {
    setCanCounterAttack(false)
    doHeroAttack(roll, () => {
      setTimeout(() => {
        playEnemyAttack(() => {
          doEnemyDamage(false, 0)
          setTimeout(() => setRolling(false), 1500)
        })
      }, 1500)
    })
  }

  const resolveDefend = (roll) => {
    const blocked = roll >= 5
    if (blocked) {
      playEnemyAttack(() => {
        playSfx('defend')
        playSfx('hit', 0.15)
        setHeroDmgPop(0)
        setHeroBlock(true)
        setTimeout(() => setHeroBlock(false), 450)
        if (roll === 8) {
          const stats = applyPerks(player, player.perks)
          const counterDmg = Math.max(1, Math.round((stats.baseDmg + (player.tempDmg || 0)) * 0.2))
          const newEnemyHp = Math.max(0, enemy.hp - counterDmg)
          setEnemy(e => ({ ...e, hp: newEnemyHp }))
          setEnemyHit(true)
          setEnemyDmgPop(counterDmg)
          setHeroDmgPop('counter')
          playSfx('attack_strong')
          setTimeout(() => setEnemyHit(false), 500)
          if (newEnemyHp <= 0) { setCombatPhase('hit'); setRolling(false); return }
        }
        setCanCounterAttack(true)
        setRolling(false)
      })
      return
    }
    const failMult = { 4: 1.10, 3: 1.15, 2: 1.23, 1: 1.35 }[roll] ?? 1
    playEnemyAttack(() => {
      doEnemyDamage(false, 0, failMult, false)
      setTimeout(() => setRolling(false), 1500)
    })
  }

  const doEnemyDamage = (isDefending, defRoll, failMult = 1, allowDodge = true) => {
    const stats = applyPerks(player, player.perks)
    if (allowDodge && stats.agility > 0 && Math.random() < stats.agility) {
      playSfx('esquiva')
      setHeroDmgPop('dodge')
      setHeroDodge(true)
      setTimeout(() => setHeroDodge(false), 550)
      return
    }
    const tempDefense = player.tempDefense || 0
    if (tempDefense > 0) {
      setPlayer(p => ({ ...p, tempDefense: 0 }))
      setHeroDmgPop(0)
      playSfx('defend')
      return
    }
    const eRoll = rollD8()
    const { mult: eMult } = getDiceEffect(eRoll)
    let dmg = Math.max(1, Math.round(enemy.dmg * eMult * failMult))
    if (isDefending) dmg = Math.max(0, dmg - Math.floor(defRoll / 2))
    dmg = Math.max(0, dmg - (stats.defense || 0))
    if (dmg === 0) {
      if (allowDodge) {
        playSfx('defend')
        setHeroDmgPop(0)
        setHeroBlock(true)
        setTimeout(() => setHeroBlock(false), 450)
        return
      }
      dmg = 1
    }
    playSfx('hit')
    setHeroDmgPop(dmg)
    setHeroHit(true)
    setTimeout(() => setHeroHit(false), 500)
    setPlayer(p => {
      const newHp = p.hp - dmg
      if (newHp <= 0) {
        setTimeout(() => setGameState('gameover'), 1800)
        return { ...p, hp: 0 }
      }
      return { ...p, hp: newHp }
    })
  }

  const handleUseItem = (id) => {
    const data = ITEM_DATA[id]
    if (!data) return
    playSfx('drink_potion')
    setPlayer(p => {
      const inv = [...p.inventory]
      const idx = inv.indexOf(id)
      if (idx === -1) return p
      inv.splice(idx, 1)
      return data.effect({ ...p, inventory: inv })
    })
    setShowInventory(false)
  }

  const enemyDied = () => {
    const xpGain = enemy.xp
    setPlayer(p => {
      const newXp = p.xp + xpGain
      const needed = XP_TO_LEVEL(p.level)
      if (newXp >= needed) {
        playSfx('levelup', 0.3)
        playSfx('levelup_complete', 0.3)
        setPerkChoices(pickPerks())
        setPerkChosen(false)
        setTimeout(() => setGameState('levelup'), 100)
        return { ...p, xp: newXp - needed, level: p.level + 1, phase: p.phase + 1 }
      }
      setTimeout(() => setGameState('menu'), 100)
      return { ...p, xp: newXp, phase: p.phase + 1 }
    })
  }

  const choosePerk = (perk) => {
    if (perkChosen) return
    setPerkChosen(true)
    playSfx('click')
    setPlayer(p => {
      const current = Math.min(p.perks[perk.id] || 0, 4)
      const nextLv = current + 1
      const updated = { ...p, perks: { ...p.perks, [perk.id]: nextLv } }
      if (perk.id === 'maxhp') {
        const hpGain = HP_PER_LEVEL[nextLv] - HP_PER_LEVEL[current]
        updated.maxHp = p.maxHp + hpGain
        updated.hp = Math.min(p.hp + hpGain, updated.maxHp)
      }
      setTimeout(() => setGameState('menu'), 100)
      return updated
    })
  }

  const removeOne = (arr, item) => {
    const i = arr.indexOf(item)
    return i >= 0 ? [...arr.slice(0, i), ...arr.slice(i + 1)] : arr
  }

  const restart = () => {
    playSfx('click')
    setPlayer(initialPlayer)
    setGameState('title')
    setDiceResult(null)
  }

  const hpPct   = (player.hp / player.maxHp) * 100
  const xpPct   = (player.xp / XP_TO_LEVEL(player.level)) * 100
  const potions = player.inventory.filter(i => i === 'pocao').length

  return (
    <div className="game" onMouseOver={(e) => {
      const btn = e.target.closest('button')
      const now = Date.now()
      if (btn && btn !== hoveredBtn.current && now - lastHoverTime.current > 80) {
        hoveredBtn.current = btn
        lastHoverTime.current = now
        playHover()
      }
      if (!btn) hoveredBtn.current = null
    }}>

      {/* TITLE */}
      {gameState === 'title' && (
        <div className="title-screen">
          <img src={bgTituloImg} alt="" className="title-bg-img" />

          <div className="title-content">
            <img src={IC.ti_titulo} alt="Dice Quest" className="ti-logo" />

            <div className="ti-buttons">
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click'); fadeToBgm('overworld'); setGameState('menu') }}>
                <img src={IC.ti_comecar_jogo} alt="Começar Jogo" />
              </button>
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click') }}>
                <img src={IC.ti_tutorial} alt="Tutorial" />
              </button>
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click'); fadeToBgm('overworld'); setGameState('menu') }}>
                <img src={IC.ti_menu} alt="Menu" />
              </button>
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click') }}>
                <img src={IC.ti_feedback} alt="Feedback" />
              </button>
            </div>
          </div>

          <div className="ti-bottom-left">
            <button className="ti-icon-btn" onClick={() => { startTitleBgm(); playSfx('click') }}><img src={IC.ti_config}      alt="Config" /></button>
            <button className="ti-icon-btn" onClick={() => { startTitleBgm(); playSfx('click') }}><img src={IC.ti_conquista}   alt="Conquistas" /></button>
            <button className="ti-icon-btn" onClick={() => { startTitleBgm(); playSfx('click') }}><img src={IC.ti_estatistica} alt="Estatísticas" /></button>
          </div>

          {showMusicPrompt && (
            <div className="music-prompt">
              <p>🎵 Ativar músicas e sons?</p>
              <div className="music-prompt-btns">
                <button onClick={acceptMusic}>SIM</button>
                <button onClick={declineMusic}>NÃO</button>
              </div>
            </div>
          )}
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

          <AudioSettings />
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

            <div className={`scene-hero${heroHit ? ' hero-hit' : heroDodge ? ' hero-dodge' : heroBlock ? ' hero-block' : ''}`}>
              <HeroSprite anim={heroAnim} />
            </div>

            <div className={`scene-enemy${enemyHit ? ' hit' : ''}`}>
              {enemyDmgPop !== null && (
                <DamagePopup damage={enemyDmgPop} type="enemy" onDone={() => {
                  setEnemyDmgPop(null)
                  if (combatPhase === 'hit') setCombatPhase('dying')
                }} />
              )}
              {combatPhase === 'dead'
                ? null
                : <EnemySprite anim={enemyAnim} isBoss={enemy.type === 'boss'}
                    dying={combatPhase === 'dying'}
                    onDyingDone={() => { setCombatPhase('dead'); enemyDied(); setRolling(false) }}
                  />
              }
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
                <DamagePopup damage={heroDmgPop === 'dodge' || heroDmgPop === 'counter' ? 0 : heroDmgPop} type={heroDmgPop === 'dodge' ? 'dodge' : heroDmgPop === 'counter' ? 'counter' : 'hero'} onDone={() => setHeroDmgPop(null)} />
              </div>
            )}

            {showDice && pendingDice && (
              <DiceRollAnimation result={pendingDice.roll} onDone={onDiceAnimDone} />
            )}

            <button className="img-btn" style={{ position: 'absolute', top: 12, right: 0, zIndex: 6, padding: 0, transform: 'translateY(-30%)' }} disabled={rolling} onClick={() => { playSfx('click'); setRolling(false); setShowDice(false); setPendingDice(null); setGameState('menu') }}>
              <img src={IC.engrenagem} alt="Menu" style={{ height:200, imageRendering: 'auto' }} />
            </button>

            <div className="action-bar">
              <button className="img-btn" onClick={handleAttack} disabled={rolling}>
                <img src={IC.peark_dano} alt="Attack" />
                {canCounterAttack && <span className="counter-badge">ATACAR!</span>}
              </button>
              <button className="img-btn" onClick={handleDefend} disabled={rolling || canCounterAttack}>
                <img src={IC.peark_defesa} alt="Defend" />
              </button>
              <button className="img-btn" onClick={() => { playSfx('click'); setShowInventory(true) }} disabled={rolling || canCounterAttack}>
                <img src={IC.mochila} alt="Mochila" />
              </button>
            </div>

            {showInventory && (
              <InventoryMenu
                inventory={player.inventory}
                onUse={handleUseItem}
                onClose={() => { playSfx('click'); setShowInventory(false) }}
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
                <button className="img-btn perk-btn" onClick={() => choosePerk(perk)} disabled={perkChosen}>
                  <img src={IC[perk.icon]} alt={perk.name} />
                  {player.perks[perk.id] && (
                    <span className="perk-level-badge">Lv.{player.perks[perk.id]}</span>
                  )}
                </button>
                <p className="perk-desc">{perk.desc(player.perks[perk.id] || 0)}</p>
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
          <AudioSettings />
        </div>
      )}
    </div>
  )
}
