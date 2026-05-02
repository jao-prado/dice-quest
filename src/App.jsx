import { useState, useEffect, useRef, useCallback } from 'react'
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
import { useCombatQueue } from './useCombatQueue'
import { useHeroDamagePopups } from './useHeroDamagePopups'

const PERKS = [
  { id: 'damage',  name: 'Dano',      icon: 'peark_dano',      desc: (lv) => `+${DMG_PER_LEVEL[Math.min(lv+1,5)]} dano` },
  { id: 'defense', name: 'Defesa',    icon: 'peark_defesa',    desc: (lv) => `-${DEF_PER_LEVEL[Math.min(lv+1,5)]} dano recebido` },
  { id: 'maxhp',   name: 'Vida',      icon: 'peark_vida',      desc: (lv) => `+${HP_PER_LEVEL[Math.min(lv+1,5)] - HP_PER_LEVEL[Math.min(lv,5)]} HP maximo` },
  { id: 'luck',    name: 'Sorte',     icon: 'peark_sorte',     desc: (lv) => `+${Math.round(LUCK_PER_LEVEL[Math.min(lv+1,5)]*100)}% chance de rolar melhor` },
  { id: 'agility', name: 'Agilidade', icon: 'peark_agilidade', desc: (lv) => `+${Math.round(AGIL_PER_LEVEL[Math.min(lv+1,5)]*100)}% chance de esquivar` },
]

const NORMAL_NAMES = ['Goblin', 'Orc', 'Esqueleto', 'Zumbi', 'Lobo']
const ELITE_NAMES  = ['Goblin Elite', 'Orc Bruto', 'Lich', 'Vampiro']
const BOSS_NAMES   = { 10: 'Necromante', 20: 'Dragão das Sombras', 30: 'Rei Lich' }

const XP_TO_LEVEL = (lvl) => 20 + lvl * 10

function normalStats(phase) {
  const hp  = 10 + phase * 2
  const dmg = 2 + Math.floor(phase / 5)
  const xp  = 6 + phase
  return { hp, dmg, xp }
}

function buildEnemy(phase, type, id) {
  const base = normalStats(phase)
  if (type === 'boss') {
    const hp  = Math.round(base.hp * 2.5)
    const dmg = base.dmg + 2
    const xp  = (6 + phase) * 4
    const name = BOSS_NAMES[phase] ?? 'Boss'
    return { name, hp, maxHp: hp, dmg, xp, type: 'boss', id }
  }
  if (type === 'elite') {
    const hp  = Math.round(base.hp * 1.6)
    const dmg = base.dmg + 1
    const xp  = (6 + phase) * 2
    const name = ELITE_NAMES[Math.floor(Math.random() * ELITE_NAMES.length)]
    return { name, hp, maxHp: hp, dmg, xp, type: 'elite', id }
  }
  const name = NORMAL_NAMES[Math.floor(Math.random() * NORMAL_NAMES.length)]
  return { name, hp: base.hp, maxHp: base.hp, dmg: base.dmg, xp: base.xp, type: 'normal', id }
}

function eliteChance(phase) {
  if (phase >= 21) return 0.25
  if (phase >= 16) return 0.20
  if (phase >= 11) return 0.15
  if (phase >= 6)  return 0.10
  return 0
}

function getEnemyCount(phase) {
  if (phase % 10 === 0) return 1 // boss
  if (phase <= 10)  return 1
  if (phase <= 17)  return Math.random() < 0.20 ? 1 : 2
  if (phase <= 25)  return Math.random() < 0.30 ? 3 : 2
  return Math.random() < 0.20 ? 2 : 3
}

function getEnemies(phase) {
  if (phase % 10 === 0) return [buildEnemy(phase, 'boss', 0)]
  const count = getEnemyCount(phase)
  const chance = eliteChance(phase)
  return Array.from({ length: count }, (_, i) => {
    const type = Math.random() < chance ? 'elite' : 'normal'
    return buildEnemy(phase, type, i)
  })
}

// dano reduzido em grupo
function groupDmgMult(count) {
  if (count >= 4) return 0.50
  if (count === 3) return 0.60
  if (count === 2) return 0.75
  return 1
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
  hp: 300000, maxHp: 3000, xp: 0, level: 1, phase: 1,
  perks: {}, inventory: ['poção', 'poção'],
  baseDmg: 200,
}

const HP_PER_LEVEL    = [0, 3, 6, 9, 13, 18]
const DEF_PER_LEVEL   = [0, 1, 2, 4, 6, 9]
const DMG_PER_LEVEL   = [0, 1, 2, 4, 6, 9]
const LUCK_PER_LEVEL  = [0, 0.05, 0.10, 0.18, 0.28, 0.40]
const AGIL_PER_LEVEL  = [0, 0.06, 0.12, 0.20, 0.30, 0.40]

// dano base cresce +2 a cada 3 fases
function playerBaseDmg(baseDmg, phase) {
  return baseDmg + Math.floor((phase - 1) / 3) * 2
}

function applyPerks(base, perks, phase = 1) {
  return {
    ...base,
    baseDmg: playerBaseDmg(base.baseDmg, phase) + DMG_PER_LEVEL[Math.min(perks.damage || 0, 5)],
    defense: DEF_PER_LEVEL[Math.min(perks.defense || 0, 5)],
    agility: AGIL_PER_LEVEL[Math.min(perks.agility || 0, 5)],
  }
}

function HeroSprite({ anim }) {
  const src = anim === 'atk2' ? heroi_ataque2 : anim === 'atk1' ? heroi_ataque1 : heroi_parado
  return <img src={src} alt="hero" className="sprite hero-sprite" />
}

function EnemySprite({ anim, type, dying, dead, onDyingDone }) {
  const src = anim === 'atk' ? monstro_ataque : monstro_parado
  const isBoss  = type === 'boss'
  const isElite = type === 'elite'
  const cls = `sprite enemy-sprite${isBoss ? ' boss-sprite' : isElite ? ' elite-sprite' : ''}${dying ? ' enemy-dying' : ''}`
  return (
    <img
      src={src} alt="enemy" className={cls}
      style={dead ? { visibility: 'hidden' } : undefined}
      onAnimationEnd={dying ? onDyingDone : undefined}
    />
  )
}

export default function App() {
  const [player,      setPlayer]      = useState(initialPlayer)
  const [gameState,   setGameState]   = useState('title')
  const [enemies,     setEnemies]     = useState([])
  const [diceResult,  setDiceResult]  = useState(null)
  const [perkChoices, setPerkChoices] = useState([])
  const [rolling,     setRolling]     = useState(false)
  const [heroAnim,    setHeroAnim]    = useState('idle')
  const [enemyAnims,  setEnemyAnims]  = useState({})
  const [showDice,    setShowDice]    = useState(false)
  const [pendingDice, setPendingDice] = useState(null)
  const [enemyDmgPop, setEnemyDmgPop] = useState(null)
  const [dmgPopups,    setDmgPopups]    = useState([])
  const [totalPopup,   setTotalPopup]   = useState(null)
  const [heroDmgEvt,   setHeroDmgEvt]   = useState(null)
  const [perkChosen, setPerkChosen] = useState(false)
  const [perkQueue,  setPerkQueue]  = useState([])
  const [canCounterAttack, setCanCounterAttack] = useState(false)
  const [selectingTarget, setSelectingTarget] = useState(false)
  const [pendingRoll,   setPendingRoll]   = useState(null)
  const [dyingIds,      setDyingIds]      = useState([])
  const [allEnemies,    setAllEnemies]    = useState([])
  const [combatOver,    setCombatOver]    = useState(false)
  const [titleBgmStarted, setTitleBgmStarted] = useState(false)
  const [showMusicPrompt, setShowMusicPrompt] = useState(true)
  const [fading,        setFading]        = useState(false)
  // combatPhase: 'idle' | 'hit' | 'dying' | 'deathAnim' | 'dead'
  const [combatPhase, setCombatPhase] = useState('idle')
  const combatPhaseRef = useRef('idle')
  const setCombatPhaseSync = (val) => { combatPhaseRef.current = val; setCombatPhase(val) }
  const [heroAnimEvt, setHeroAnimEvt] = useState({ type: null, token: 0 })
  const [showInventory, setShowInventory] = useState(false)
  const [enemyHit, setEnemyHit] = useState(false)
  const hoveredBtn = useRef(null)
  const lastHoverTime = useRef(0)
  const enemiesRef = useRef([])
  const playerRef  = useRef(player)
  useEffect(() => { enemiesRef.current = enemies }, [enemies])
  useEffect(() => { playerRef.current  = player  }, [player])

  const isBossPhase = player.phase % 10 === 0

  useEffect(() => {
    if (gameState === 'title') return
    if (gameState === 'combat') {
      if (isBossPhase) fadeToBgm('boss')
    } else if (gameState === 'menu') {
      fadeToBgm('overworld')
    } else if (gameState === 'gameover') {
      stopBgm()
      playSfx('gameover')
    }
  }, [gameState, isBossPhase])

  const fadeToState = (state, delay = 0) => {
    setFading(true)
    setTimeout(() => { setGameState(state); setFading(false) }, 200 + delay)
  }

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

  const playEnemyAttack = (id, cb) => {
    setEnemyAnims(prev => ({ ...prev, [id]: 'atk' }))
    setTimeout(() => { setEnemyAnims(prev => ({ ...prev, [id]: 'idle' })); cb() }, 400)
  }

  const isItemPhase = (phase) => phase % 3 === 0 && phase % 5 !== 0

  const { enqueueAll, resolveAnimation, waitForAnim } = useCombatQueue()
  const { spawnDmgPopup, removePopup, clearAll: clearDmgPopups, flushDamage } = useHeroDamagePopups(setDmgPopups, setTotalPopup)

  const spawnHeroDmgEvt = (type) => {
    setHeroDmgEvt(prev => ({ type, token: (prev?.token ?? 0) + 1 }))
  }

  const startPhase = (p = player) => {
    if (isItemPhase(p.phase)) { setGameState('item'); return }
    const es = getEnemies(p.phase)
    setEnemies(es)
    setAllEnemies(es)
    setDyingIds([])
    setCombatOver(false)
    setRolling(false)
    setCombatPhaseSync('idle')
    setHeroAnimEvt(prev => ({ type: 'idle', token: prev.token }))
    setHeroDmgEvt(null)
    clearDmgPopups()
    setEnemyAnims(Object.fromEntries(es.map(e => [e.id, 'idle'])))
    setDiceResult(null)
    setHeroAnim('idle')
    setCanCounterAttack(false)
    setSelectingTarget(false)
    setPendingRoll(null)
    setGameState('combat')
  }

  const handleCollect = (loot) => {
    playSfx('item_collect')
    setPlayer(p => ({ ...p, inventory: [...p.inventory, loot.id], phase: p.phase + 1 }))
    setGameState('menu')
  }

  const handleAttack = () => {
    if (rolling) return
    const roll = rollD8(player.perks.luck || 0)
    setPendingRoll(roll)
    const alive = enemiesRef.current.filter(e => e.hp > 0)
    if (alive.length > 1) {
      setSelectingTarget(true)
    } else {
      const targetId = alive[0]?.id ?? 0
      setRolling(true)
      playSfx('dice_roll')
      setDiceResult(roll)
      setShowDice(true)
      setPendingDice({ roll, action: canCounterAttack ? 'counter' : 'attack', targetId })
    }
  }

  const confirmAttack = (targetId = 0) => {
    setSelectingTarget(false)
    setRolling(true)
    playSfx('dice_roll')
    const roll = pendingRoll ?? rollD8(player.perks.luck || 0)
    setDiceResult(roll)
    setShowDice(true)
    setPendingDice({ roll, action: canCounterAttack ? 'counter' : 'attack', targetId })
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
    const { roll, action, targetId } = pendingDice
    if (action === 'attack')  resolveAttack(roll, targetId ?? 0)
    else if (action === 'counter') resolveCounter(roll, targetId ?? 0)
    else resolveDefend(roll)
  }

  const doHeroAttack = (roll, targetId, afterCb) => {
    const { mult } = getDiceEffect(roll)
    const p = playerRef.current
    const stats = applyPerks(p, p.perks, p.phase)
    const forcaBonus = p.tempDmg || 0
    const baseDmgTotal = stats.baseDmg + forcaBonus
    const dmg = Math.max(mult === 0 ? 0 : 1, Math.round(baseDmgTotal * mult))
    if (forcaBonus > 0) setPlayer(prev => ({ ...prev, tempDmg: 0 }))
    const sfxHit = mult >= 2 ? 'attack_critical' : mult >= 1.5 ? 'attack_strong' : 'attack'
    playHeroAttack(() => {
      setEnemies(prev => prev.map(e => e.id === targetId ? { ...e, hp: Math.max(0, e.hp - dmg) } : e))
      setEnemyHit(true)
      setEnemyDmgPop({ id: targetId, dmg })
      if (mult === 0) playSfx('defend')
      else playSfx(sfxHit, mult >= 2 ? 0.25 : 1)
      setTimeout(() => setEnemyHit(false), 500)
      const target = enemiesRef.current.find(e => e.id === targetId)
      if (target && Math.max(0, target.hp - dmg) <= 0) {
        setRolling(true)
        setCombatPhaseSync({ type: 'hit', targetId })
        afterCb('afterDeath')
        return
      }
      afterCb()
    })
  }

  const enqueueEnemyTurns = (enemyList, allowDodge = true) => {
    const events = enemyList.map(e => async () => {
      if (playerRef.current.hp <= 0) return
      await new Promise(resolve => playEnemyAttack(e.id, resolve))
      const result = calcEnemyDamage(false, 0, 1, allowDodge, e)
      if (result.type === 'dodge') {
        playSfx('esquiva')
        spawnHeroDmgEvt('dodge')
        setHeroAnimEvt(prev => ({ type: 'dodge', token: prev.token + 1 }))
        await waitForAnim()
      } else if (result.type === 'block') {
        playSfx('defend')
        spawnHeroDmgEvt('block')
        setHeroAnimEvt(prev => ({ type: 'block', token: prev.token + 1 }))
        await waitForAnim()
      } else if (result.type === 'hit') {
        playSfx('hit')
        spawnDmgPopup(result.dmg)
      }
    })
    enqueueAll(events)
  }

  const afterDeathCbRef = useRef(null)

  const resolveAttack = (roll, targetId = 0) => {
    doHeroAttack(roll, targetId, (flag) => {
      const run = () => {
        const alive = enemiesRef.current.filter(e => e.hp > 0)
        enqueueEnemyTurns(alive)
        // No final da fila, mostrar acumulador se houver
        enqueueAll([async () => {
          // aguarda o merge timer do hook disparar e aplicar o dano
          await new Promise(r => setTimeout(r, 700))
          flushDamage(applyHeroDamage)
          setRolling(false)
        }])
      }
      if (flag === 'afterDeath') { afterDeathCbRef.current = run }
      else { setTimeout(run, 1500) }
    })
  }

  const resolveCounter = (roll, targetId = 0) => {
    setCanCounterAttack(false)
    doHeroAttack(roll, targetId, (flag) => {
      const run = () => {
        const alive = enemiesRef.current.filter(e => e.hp > 0)
        enqueueEnemyTurns(alive)
        enqueueAll([async () => {
          await new Promise(r => setTimeout(r, 700))
          flushDamage(applyHeroDamage)
          setRolling(false)
        }])
      }
      if (flag === 'afterDeath') { afterDeathCbRef.current = run }
      else { setTimeout(run, 1500) }
    })
  }

  const resolveDefend = (roll) => {
    const blocked = roll >= 5
    const alive = enemiesRef.current.filter(e => e.hp > 0)
    if (blocked) {
      const events = []
      // Primeiro inimigo ataca e é bloqueado
      events.push(async () => {
        await new Promise(resolve => {
          playEnemyAttack(alive[0]?.id ?? 0, resolve)
        })
        playSfx('defend')
        spawnHeroDmgEvt('block')
        setHeroAnimEvt(prev => ({ type: 'block', token: prev.token + 1 }))
        await waitForAnim()
      })
      // Se roll === 8, contra-ataque
      if (roll === 8) {
        events.push(async () => {
          const p = playerRef.current
          const stats = applyPerks(p, p.perks, p.phase)
          const counterDmg = Math.max(1, Math.round((stats.baseDmg + (p.tempDmg || 0)) * 0.2))
          const firstAlive = alive[0]
          if (firstAlive) {
            // 1. mostra "CONTRA-ATAQUE!" no inimigo antes do dano
            setEnemyDmgPop({ id: firstAlive.id, dmg: 0, type: 'counter' })
            await waitForAnim() // aguarda popup counter sumir
            // 2. aplica dano — pequeno delay para o popup de dano aparecer antes de continuar
            const newHp = Math.max(0, firstAlive.hp - counterDmg)
            setEnemies(prev => prev.map(e => e.id === firstAlive.id ? { ...e, hp: newHp } : e))
            setEnemyHit(true)
            setEnemyDmgPop({ id: firstAlive.id, dmg: counterDmg })
            playSfx('attack_strong')
            setTimeout(() => setEnemyHit(false), 500)
            await new Promise(r => setTimeout(r, 500))
            if (newHp <= 0) {
              setCombatPhaseSync({ type: 'hit', targetId: firstAlive.id })
              return
            }
          }
        })
      }
      // Inimigos restantes atacam sem allowDodge
      const remaining = alive.slice(1)
      if (remaining.length > 0) {
        events.push(...remaining.map(e => async () => {
          if (playerRef.current.hp <= 0) return
          await new Promise(resolve => {
            playEnemyAttack(e.id, resolve)
          })
          const result = calcEnemyDamage(false, 0, 1, true, e) // remaining podem esquivar normalmente
          if (result.type === 'dodge') {
            playSfx('esquiva')
            spawnHeroDmgEvt('dodge')
            setHeroAnimEvt(prev => ({ type: 'dodge', token: prev.token + 1 }))
            await waitForAnim()
          } else if (result.type === 'block') {
            playSfx('defend')
            spawnHeroDmgEvt('block')
            setHeroAnimEvt(prev => ({ type: 'block', token: prev.token + 1 }))
            await waitForAnim()
          } else if (result.type === 'hit') {
            playSfx('hit')
            spawnDmgPopup(result.dmg)
          }
        }))
      }
      events.push(async () => {
        await new Promise(r => setTimeout(r, 700))
        flushDamage(applyHeroDamage)
        if (enemiesRef.current.filter(e => e.hp > 0).length > 0) {
          setCanCounterAttack(true)
          setRolling(false)
        }
      })
      enqueueAll(events)
    } else {
      // Defesa falhou
      const failMult = { 4: 1.10, 3: 1.15, 2: 1.23, 1: 1.35 }[roll] ?? 1
      const events = []
      events.push(async () => {
        await new Promise(resolve => {
          playEnemyAttack(alive[0]?.id ?? 0, resolve)
        })
        const result = calcEnemyDamage(false, 0, failMult, false, alive[0])
        if (result.type === 'hit') {
          playSfx('hit')
          spawnDmgPopup(result.dmg)
        }
      })
      const rest = alive.slice(1)
      if (rest.length > 0) {
        events.push(...rest.map(e => async () => {
          if (playerRef.current.hp <= 0) return
          await new Promise(resolve => {
            playEnemyAttack(e.id, resolve)
          })
          const result = calcEnemyDamage(false, 0, 1, true, e)
          if (result.type === 'dodge') {
            playSfx('esquiva')
            spawnHeroDmgEvt('dodge')
            setHeroAnimEvt(prev => ({ type: 'dodge', token: prev.token + 1 }))
            await waitForAnim()
          } else if (result.type === 'block') {
            playSfx('defend')
            spawnHeroDmgEvt('block')
            setHeroAnimEvt(prev => ({ type: 'block', token: prev.token + 1 }))
            await waitForAnim()
          } else if (result.type === 'hit') {
            playSfx('hit')
            spawnDmgPopup(result.dmg)
          }
        }))
      }
      events.push(async () => {
        await new Promise(r => setTimeout(r, 700))
        flushDamage(applyHeroDamage)
        setRolling(false)
      })
      enqueueAll(events)
    }
  }

  const calcEnemyDamage = (isDefending, defRoll, failMult = 1, allowDodge = true, attacker = null) => {
    const currentEnemies = enemiesRef.current
    const src = attacker ?? currentEnemies.find(e => e.hp > 0) ?? currentEnemies[0]
    if (!src) return { type: 'none' }
    const p = playerRef.current
    const stats = applyPerks(p, p.perks, p.phase)
    const aliveCount = currentEnemies.filter(e => e.hp > 0).length
    const groupMult = groupDmgMult(aliveCount)
    const dodged = allowDodge && stats.agility > 0 && Math.random() < stats.agility
    if (dodged) return { type: 'dodge' }
    const tempDefense = p.tempDefense || 0
    if (tempDefense > 0) {
      setPlayer(prev => ({ ...prev, tempDefense: 0 }))
      return { type: 'block', dmg: 0 }
    }
    const eRoll = rollD8()
    const { mult: eMult } = getDiceEffect(eRoll)
    let dmg = Math.max(1, Math.round(src.dmg * eMult * failMult * groupMult))
    if (isDefending) dmg = Math.max(0, dmg - Math.floor(defRoll / 2))
    dmg = Math.max(0, dmg - (stats.defense || 0))
    if (dmg === 0) return { type: 'block', dmg: 0 }
    return { type: 'hit', dmg }
  }

  const applyHeroDamage = (dmg) => {
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

  const enemyDied = (targetId) => {
    setDyingIds(prev => [...prev, targetId])
    setTimeout(() => {
      setEnemies(prev => {
        const remaining = prev.filter(e => e.id !== targetId)
        if (remaining.length > 0) {
          setCombatPhaseSync('idle')
          // não reseta rolling — inimigos ainda vão atacar via afterDeathCb
          return remaining
        }
        setCombatOver(true)
        // rolling permanece true, action bar travada até trocar de tela
        const xpGain = prev.reduce((s, e) => s + e.xp, 0)
        setPlayer(p => {
          let { xp, level, maxHp, hp, phase } = p
          xp += xpGain
          let levelsGained = 0
          while (xp >= XP_TO_LEVEL(level)) {
            xp -= XP_TO_LEVEL(level)
            level++
            maxHp += 3
            hp = Math.min(hp + 3, maxHp)
            levelsGained++
          }
          if (levelsGained > 0) {
            playSfx('levelup', 0.3)
            playSfx('levelup_complete', 0.3)
            const choices = Array.from({ length: levelsGained }, () => pickPerks())
            setPerkQueue(choices)
            setPerkChoices(choices[0])
            setPerkChosen(false)
            setTimeout(() => fadeToState('levelup'), 100)
          } else {
            setTimeout(() => fadeToState('menu'), 100)
          }
          return { ...p, xp, level, maxHp, hp, phase: phase + 1 }
        })
        return []
      })
    }, 100)
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
      return updated
    })
    // avança para próximo perk da fila ou vai pro menu
    const remaining = perkQueue.slice(1)
    setPerkQueue(remaining)
    if (remaining.length > 0) {
      setPerkChoices(remaining[0])
      setPerkChosen(false)
    } else {
      setTimeout(() => fadeToState('menu'), 100)
    }
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
    <div className="game">

      {/* TITLE */}
      {gameState === 'title' && (
        <div className="title-screen" onMouseOver={(e) => {
          const btn = e.target.closest('button')
          const now = Date.now()
          if (btn && btn !== hoveredBtn.current && now - lastHoverTime.current > 80) {
            hoveredBtn.current = btn
            lastHoverTime.current = now
            playHover()
          }
          if (!btn) hoveredBtn.current = null
        }}>
          <img src={bgTituloImg} alt="" className="title-bg-img" />

          <div className="title-content">
            <img src={IC.ti_titulo} alt="Dice Quest" className="ti-logo" />

            <div className="ti-buttons">
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click'); setGameState('menu') }}>
                <img src={IC.ti_comecar_jogo} alt="Começar Jogo" />
              </button>
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click') }}>
                <img src={IC.ti_tutorial} alt="Tutorial" />
              </button>
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click'); setGameState('menu') }}>
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
                  {player.phase % 10 === 0 && <span className="boss-warn">BOSS!</span>}
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
            {player.phase % 10 === 0
              ? <img src={IC.enfrentar_boss} alt="Enfrentar Boss" />
              : <img src={IC.proximo_enc}    alt="Proximo Encontro" />}
          </button>

          <AudioSettings />
        </div>
      )}

      {/* COMBAT */}
      {gameState === 'combat' && (
        <div className="combat-screen">
          <div className="combat-scene" style={{ backgroundImage: `url(${campoBatalha})` }}>

            <div key={heroAnimEvt.token} className={`scene-hero${heroAnimEvt.type === 'hit' ? ' hero-hit' : heroAnimEvt.type === 'dodge' ? ' hero-dodge' : heroAnimEvt.type === 'block' ? ' hero-block' : ''}`} onAnimationEnd={() => resolveAnimation()}>
              <HeroSprite anim={heroAnim} />
            </div>

            <div className="enemies-container">
              {allEnemies.map((ae, i) => {
                const e = enemies.find(x => x.id === ae.id) ?? ae
                const isDead = !enemies.find(x => x.id === ae.id) && !dyingIds.includes(ae.id)
                const isDying = dyingIds.includes(e.id)
                const isHit = enemyHit && enemyDmgPop?.id === e.id
                const isTargetable = selectingTarget && !isDying && !isDead
                return (
                  <div
                    key={e.id}
                    className={`scene-enemy-wrap${isHit ? ' hit' : ''}${isTargetable ? ' targetable' : ''}`}
                    style={{ '--enemy-idx': i, '--enemy-count': allEnemies.length, visibility: isDead ? 'hidden' : 'visible' }}
                    onClick={isTargetable ? () => confirmAttack(e.id) : undefined}
                  >
                    {!isDying && !isDead && (
                    <div className="enemy-hp-bar">
                      <div className="enemy-hp-name">
                        {e.name}
                        {e.type === 'elite' && <span className="enemy-type-badge elite">ELITE</span>}
                        {e.type === 'boss'  && <span className="enemy-type-badge boss">BOSS</span>}
                      </div>
                      <div className="bar enemy-bar"><div className="bar-fill enemy-hp" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} /></div>
                    </div>
                    )}
                    {enemyDmgPop?.id === e.id && (
                      <DamagePopup
                        damage={enemyDmgPop.dmg}
                        type={enemyDmgPop.type ?? 'enemy'}
                        onDone={() => {
                          const snap = enemyDmgPop
                          setEnemyDmgPop(null)
                          if (snap?.type === 'counter') resolveAnimation()
                          if (typeof combatPhaseRef.current === 'object' && combatPhaseRef.current.type === 'hit' && combatPhaseRef.current.targetId === e.id)
                            setCombatPhaseSync({ type: 'dying', targetId: e.id })
                        }}
                      />
                    )}
                    {isTargetable && <div className="target-selector" />}
                    <EnemySprite
                      anim={enemyAnims[e.id] ?? 'idle'}
                      type={e.type}
                      dying={typeof combatPhase === 'object' && combatPhase.type === 'dying' && combatPhase.targetId === e.id
                      }
                      dead={isDead || dyingIds.includes(e.id)}
                      onDyingDone={() => {
                        setCombatPhaseSync('idle')
                        enemyDied(e.id)
                        if (afterDeathCbRef.current) {
                          const cb = afterDeathCbRef.current
                          afterDeathCbRef.current = null
                          setTimeout(cb, 300)
                        }
                      }}
                    />
                  </div>
                )
              })}
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

            {heroDmgEvt && (
              <div className="hero-dmg-pos">
                <DamagePopup
                  key={heroDmgEvt.token}
                  damage={0}
                  type={heroDmgEvt.type}
                  onDone={() => setHeroDmgEvt(null)}
                />
              </div>
            )}

            {dmgPopups.map((p, i) => (
              <div key={p.id} className="hero-dmg-pos">
                <DamagePopup
                  damage={p.value}
                  type="individual"
                  yOffset={i * 28}
                  onDone={() => removePopup(p.id)}
                />
              </div>
            ))}

            {totalPopup && (
              <div className="hero-dmg-pos hero-dmg-pos--total">
                <DamagePopup
                  key={totalPopup.id}
                  damage={totalPopup.value}
                  type="total"
                  onDone={() => setTotalPopup(null)}
                />
              </div>
            )}

            {selectingTarget && (
              <div className="target-prompt">Escolha um alvo</div>
            )}

            {showDice && pendingDice && (
              <DiceRollAnimation result={pendingDice.roll} onDone={onDiceAnimDone} />
            )}

            <button className="img-btn" style={{ position: 'absolute', top: 12, right: 0, zIndex: 6, padding: 0, transform: 'translateY(-30%)' }} disabled={rolling} onClick={() => { playSfx('click'); setRolling(false); setShowDice(false); setPendingDice(null); setGameState('menu') }}>
              <img src={IC.engrenagem} alt="Menu" style={{ height:200, imageRendering: 'auto' }} />
            </button>

            <div className="action-bar">
              <button className="img-btn" onClick={handleAttack} disabled={rolling || selectingTarget || combatOver}>
                <img src={IC.peark_dano} alt="Attack" />
                {canCounterAttack && <span className="counter-badge">ATACAR!</span>}
              </button>
              <button className="img-btn" onClick={handleDefend} disabled={rolling || canCounterAttack || selectingTarget || combatOver}>
                <img src={IC.peark_defesa} alt="Defend" />
              </button>
              <button className="img-btn" onClick={() => setShowInventory(true)} disabled={rolling || canCounterAttack || selectingTarget || combatOver}>
                <img src={IC.mochila} alt="Mochila" />
              </button>
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
      {fading && <div className="screen-fade" />}
    </div>
  )
}
