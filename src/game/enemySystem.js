import { NORMAL_NAMES, ELITE_NAMES, BOSS_NAMES } from './constants'

function normalStats(phase) {
  return {
    hp:  10 + phase * 2,
    dmg: 2 + Math.floor(phase / 5),
    xp:  6 + phase,
  }
}

export function buildEnemy(phase, type, id) {
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
  if (phase % 10 === 0) return 1
  if (phase <= 10)  return 1
  if (phase <= 17)  return Math.random() < 0.20 ? 1 : 2
  if (phase <= 25)  return Math.random() < 0.30 ? 3 : 2
  return Math.random() < 0.20 ? 2 : 3
}

/** Gera a lista de inimigos para uma fase */
export function spawnEnemyWave(phase) {
  if (phase % 10 === 0) return [buildEnemy(phase, 'boss', 0)]
  const count = getEnemyCount(phase)
  const chance = eliteChance(phase)
  return Array.from({ length: count }, (_, i) => {
    const type = Math.random() < chance ? 'elite' : 'normal'
    return buildEnemy(phase, type, i)
  })
}
