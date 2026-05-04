import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { unlockAudio, playSfx, playHover, fadeToBgm, stopBgm } from './audio/AudioManager'
import AudioSettings from './AudioSettings'
import campoBatalha from './assets/backgrounds/cenario.png'
import bgTituloImg  from './assets/backgrounds/background_titulo.png'
import heroi_parado   from './assets/sprites/hero/heroi_parado.png'
import heroi_ataque1  from './assets/sprites/hero/heroi_comecando_atacar.png'
import heroi_ataque2  from './assets/sprites/hero/heroi_ataque_finalizado.png'
import monstro_parado from './assets/sprites/enemy/monstro_parado.png'
import monstro_ataque from './assets/sprites/enemy/monstro_ataque_finalizado.png'
import ChestOverlay from './ChestOverlay'
import CombatScene from './CombatScene'
import { LOOT_TABLE } from './ItemStage'
import DiceRollAnimation from './DiceRollAnimation'
import DamagePopup from './DamagePopup'
import { Icon, IC } from './icons'
import InventoryMenu, { ITEM_DATA } from './InventoryMenu'
import StageTrail from './StageTrail'
import { useCombatQueue } from './useCombatQueue'
import { useHeroDamagePopups } from './useHeroDamagePopups'
import { INITIAL_PLAYER, HP_PER_LEVEL, DEF_PER_LEVEL, DMG_PER_LEVEL, LUCK_PER_LEVEL, AGIL_PER_LEVEL, XP_TO_LEVEL, DEFEND_FAIL_MULT } from './game/constants'
import { rollD8, getDiceEffect, applyPerks, calculatePlayerAttackDamage, calculateCounterDamage, calculateEnemyAttackDamage, applyMaxHpPerk } from './game/combatLogic'
import { spawnEnemyWave } from './game/enemySystem'
import { PERKS, pickPerks } from './game/perkSystem'
import { logCombatEvent, logDamage, logPerkTrigger } from './game/debugLog'



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
  const [player,      setPlayer]      = useState(INITIAL_PLAYER)
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
  const [chestLoot,     setChestLoot]     = useState(null)
  const [waitingForChest, setWaitingForChest] = useState(false)
  const [currentPhase,  setCurrentPhase]  = useState(1)
  const [screenCount,   setScreenCount]   = useState(0)
  const [titleBgmStarted, setTitleBgmStarted] = useState(false)
  const [showMusicPrompt, setShowMusicPrompt] = useState(true)
  const [fading,        setFading]        = useState(false)
  const [trailPlayer,   setTrailPlayer]   = useState(null)
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
  const stageAdvancedRef = useRef(false)
  useEffect(() => { enemiesRef.current = enemies }, [enemies])
  useEffect(() => { playerRef.current  = player  }, [player])

  // fase real começa em 1, ciclo de 5 para o indicador visual
  const cycleStep = ((player.phase - 1) % 5) + 1
  const isBossStep = cycleStep === 5
  const isBossPhase = isBossStep

  useEffect(() => {
    if (combatOver && !waitingForChest) {
      setTrailPlayer({ ...playerRef.current })
      setTimeout(() => setGameState('trail'), 600)
    }
  }, [combatOver, waitingForChest])

  const fadeToState = (state, delay = 0) => {
    setFading(true)
    setTimeout(() => { setGameState(state); setTimeout(() => setFading(false), 200) }, 300 + delay)
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

  // item drop acontece a cada 3 fases reais (futuro: será inline na fase)
  const { enqueueAll, resolveAnimation, waitForAnim } = useCombatQueue()
  const { spawnDmgPopup, removePopup, clearAll: clearDmgPopups, flushDamage } = useHeroDamagePopups(setDmgPopups, setTotalPopup)

  const spawnHeroDmgEvt = (type) => {
    setHeroDmgEvt(prev => ({ type, token: (prev?.token ?? 0) + 1 }))
  }

  const startPhase = (p = player) => {
    setCurrentPhase(p.phase)
    setChestLoot(null)
    const es = spawnEnemyWave(p.phase)
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
    stageAdvancedRef.current = false
    const cycleStep = ((p.phase - 1) % 5) + 1
    fadeToBgm(cycleStep === 5 ? 'boss' : 'overworld')
    setGameState('combat')
  }

  const handleCollect = (loot) => {
    playSfx('item_collect')
    setChestLoot(null)
    setWaitingForChest(false)
    setPlayer(p => ({ ...p, inventory: [...p.inventory, loot.id] }))
    if (perkQueue.length > 0) {
      fadeToState('levelup')
    } else {
      fadeToState('menu')
    }
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
    const p = playerRef.current
    const { dmg, sfx, mult } = calculatePlayerAttackDamage(p, roll)
    if ((p.tempDmg || 0) > 0) setPlayer(prev => ({ ...prev, tempDmg: 0 }))
    logCombatEvent('playerAttack', { roll, dmg, targetId })
    playHeroAttack(() => {
      setEnemies(prev => prev.map(e => e.id === targetId ? { ...e, hp: Math.max(0, e.hp - dmg) } : e))
      setEnemyHit(true)
      setEnemyDmgPop({ id: targetId, dmg })
      playSfx(sfx, mult >= 2 ? 0.25 : 1)
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
      const result = calculateEnemyAttackDamage(playerRef.current, enemiesRef.current, e, { allowDodge })
      logCombatEvent('enemyAttack', { enemy: e.name, result })
      if (result.type === 'dodge') {
        playSfx('esquiva')
        spawnHeroDmgEvt('dodge')
        setHeroAnimEvt(prev => ({ type: 'dodge', token: prev.token + 1 }))
        await waitForAnim()
      } else if (result.type === 'block') {
        if ((playerRef.current.tempDefense || 0) > 0)
          setPlayer(prev => ({ ...prev, tempDefense: 0 }))
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
      events.push(async () => {
        await new Promise(resolve => {
          playEnemyAttack(alive[0]?.id ?? 0, resolve)
        })
        playSfx('defend')
        spawnHeroDmgEvt('block')
        setHeroAnimEvt(prev => ({ type: 'block', token: prev.token + 1 }))
        await waitForAnim()
      })
      if (roll === 8) {
        events.push(async () => {
          const p = playerRef.current
          const counterDmg = calculateCounterDamage(p)
          logCombatEvent('counterAttack', { counterDmg })
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
      const remaining = alive.slice(1)
      if (remaining.length > 0) {
        events.push(...remaining.map(e => async () => {
          if (playerRef.current.hp <= 0) return
          await new Promise(resolve => {
            playEnemyAttack(e.id, resolve)
          })
          const result = calculateEnemyAttackDamage(playerRef.current, enemiesRef.current, e, { allowDodge: true })
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
      const failMult = DEFEND_FAIL_MULT[roll] ?? 1
      const events = []
      events.push(async () => {
        await new Promise(resolve => {
          playEnemyAttack(alive[0]?.id ?? 0, resolve)
        })
        const result = calculateEnemyAttackDamage(playerRef.current, enemiesRef.current, alive[0], { failMult, allowDodge: false })
        logCombatEvent('defendFail', { roll, failMult, result })
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
          const result = calculateEnemyAttackDamage(playerRef.current, enemiesRef.current, e, { allowDodge: true })
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

  const applyHeroDamage = (dmg) => {
    logDamage(dmg, 'enemy→hero')
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
        if (!stageAdvancedRef.current) {
          stageAdvancedRef.current = true
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
            // Chance de 20% de spawnar baú
            if (Math.random() < 0.2) {
              const loot = LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)]
              setChestLoot(loot)
              setWaitingForChest(true)
            } else {
              setWaitingForChest(false)
            }
            
            if (levelsGained > 0) {
              playSfx('levelup', 0.3)
              playSfx('levelup_complete', 0.3)
              const choices = Array.from({ length: levelsGained }, () => pickPerks())
              setPerkQueue(choices)
              setPerkChoices(choices[0])
              setPerkChosen(false)
            }
            return { ...p, xp, level, maxHp, hp, phase: phase + 1 }
          })
        }
        return []
      })
    }, 100)
  }

  const choosePerk = (perk) => {
    if (perkChosen) return
    setPerkChosen(true)
    playSfx('click')
    logPerkTrigger(perk.id, 'chosen')
    setPlayer(p => {
      const current = Math.min(p.perks[perk.id] || 0, 4)
      const nextLv = current + 1
      let updated = { ...p, perks: { ...p.perks, [perk.id]: nextLv } }
      if (perk.id === 'maxhp') updated = applyMaxHpPerk(p, current, nextLv)
      updated.perks = { ...p.perks, [perk.id]: nextLv }
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
    setPlayer(INITIAL_PLAYER)
    setGameState('title')
    setDiceResult(null)
    setScreenCount(0)
  }

  const hpPct   = (player.hp / player.maxHp) * 100
  const xpPct   = (player.xp / XP_TO_LEVEL(player.level)) * 100
  const potions = player.inventory.filter(i => i === 'pocao').length
  const faseIdx = ((player.phase - 1) % 5) + 1

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
              <button className="ti-btn" onClick={() => { startTitleBgm(); playSfx('click'); startPhase(INITIAL_PLAYER) }}>
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
                  {isBossStep && <span className="boss-warn">BOSS!</span>}
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
                    <img src={IC.pocao} alt="" style={{width:10,height:10,imageRendering:'pixelated',verticalAlign:'middle'}} /> x{qty}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="img-btn menu-btn" onClick={() => startPhase(player)}>
            {isBossStep
              ? <img src={IC.enfrentar_boss} alt="Enfrentar Boss" />
              : <img src={IC.proximo_enc}    alt="Proximo Encontro" />}
          </button>

          <AudioSettings />
        </div>
      )}

      {/* COMBAT */}
      {gameState === 'combat' && (
        <div className="combat-screen">
          <CombatScene bgSrc={campoBatalha} isBoss={isBossPhase}>

            <img src={IC[`nivel_fase${faseIdx}`]} alt="fase" className="level-progress-indicator" />

            <div key={heroAnimEvt.token} className={`scene-hero${heroAnimEvt.type === 'hit' ? ' hero-hit' : heroAnimEvt.type === 'dodge' ? ' hero-dodge' : heroAnimEvt.type === 'block' ? ' hero-block' : ''}`} onAnimationEnd={() => resolveAnimation()}>
              <div className="hero-bars">
                <div className="hero-hp-name">HERO <span>Lv.{player.level}</span></div>
                <div className="bar enemy-bar"><div className="bar-fill hp" style={{ width: `${hpPct}%` }} /></div>
                <div className="bar hero-xp-track"><div className="bar-fill xp" style={{ width: `${xpPct}%` }} /></div>
              </div>
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

            <img
              src={IC.engrenagem}
              alt="Menu"
              className="combat-menu-btn"
              style={{ opacity: rolling ? 0.35 : 1, cursor: rolling ? 'not-allowed' : 'pointer' }}
              onClick={() => { if (rolling) return; playSfx('click'); setRolling(false); setShowDice(false); setPendingDice(null); setGameState('menu') }}
            />

            <div className="action-bar">
              <button className="img-btn" onClick={handleAttack} disabled={rolling || selectingTarget || combatOver || waitingForChest}>
                <img src={IC.peark_dano} alt="Attack" />
                {canCounterAttack && <span className="counter-badge">ATACAR!</span>}
              </button>
              <button className="img-btn" onClick={handleDefend} disabled={rolling || canCounterAttack || selectingTarget || combatOver || waitingForChest}>
                <img src={IC.peark_defesa} alt="Defend" />
              </button>
              <button className="img-btn" onClick={() => setShowInventory(true)} disabled={rolling || canCounterAttack || selectingTarget || combatOver || waitingForChest}>
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
            {chestLoot && (
              <ChestOverlay item={chestLoot} onCollect={() => handleCollect(chestLoot)} />
            )}

          </CombatScene>
        </div>
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
      {/* TRAIL */}
      {gameState === 'trail' && trailPlayer && (
        <StageTrail
          player={trailPlayer}
          onNext={() => {
            playSfx('click')
            if (perkQueue.length > 0) fadeToState('levelup')
            else { setFading(true); setTimeout(() => { startPhase(playerRef.current); setTimeout(() => setFading(false), 200) }, 300) }
          }}
          onSaveQuit={() => {
            playSfx('click')
            // salva no localStorage e volta ao título
            try { localStorage.setItem('dicequest_save', JSON.stringify(player)) } catch {}
            setGameState('title')
            fadeToBgm('title')
          }}
        />
      )}

      {fading && <div className="screen-fade" />}
    </div>
  )
}
