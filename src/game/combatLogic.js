import {
  LUCK_PER_LEVEL, AGIL_PER_LEVEL, DEF_PER_LEVEL, DMG_PER_LEVEL,
  HP_PER_LEVEL, GROUP_DMG_MULT,
} from './constants'

// ─── Dado ─────────────────────────────────────────────────────────────────────

export function rollD8(luckLevel = 0) {
  const roll = Math.floor(Math.random() * 8) + 1
  const luckChance = LUCK_PER_LEVEL[Math.min(luckLevel, 5)]
  if (luckChance > 0 && Math.random() < luckChance) return Math.min(8, roll + 1)
  return roll
}

export function getDiceEffect(roll) {
  if (roll === 1) return { mult: 0 }
  if (roll <= 3)  return { mult: 0.75 }
  if (roll <= 6)  return { mult: 1 }
  if (roll === 7) return { mult: 1.5 }
  return              { mult: 2 }
}

// ─── Stats do jogador ─────────────────────────────────────────────────────────

export function playerBaseDmg(baseDmg, phase) {
  return baseDmg + Math.floor((phase - 1) / 3) * 2
}

/** Retorna stats derivados (baseDmg, defense, agility) aplicando perks */
export function applyPerks(base, perks, phase = 1) {
  return {
    ...base,
    baseDmg:  playerBaseDmg(base.baseDmg, phase) + DMG_PER_LEVEL[Math.min(perks.damage  || 0, 5)],
    defense:  DEF_PER_LEVEL [Math.min(perks.defense  || 0, 5)],
    agility:  AGIL_PER_LEVEL[Math.min(perks.agility  || 0, 5)],
  }
}

// ─── Dano do jogador ──────────────────────────────────────────────────────────

/**
 * Calcula o dano do jogador para um ataque.
 * @returns {{ dmg: number, sfx: string }}
 */
export function calculatePlayerAttackDamage(player, roll) {
  const { mult } = getDiceEffect(roll)
  const stats = applyPerks(player, player.perks, player.phase)
  const forcaBonus = player.tempDmg || 0
  const base = stats.baseDmg + forcaBonus
  const dmg = mult === 0 ? 0 : Math.max(1, Math.round(base * mult))
  const sfx = mult >= 2 ? 'attack_critical' : mult >= 1.5 ? 'attack_strong' : mult === 0 ? 'defend' : 'attack'
  return { dmg, sfx, mult }
}

/** Dano de contra-ataque (20% do baseDmg) */
export function calculateCounterDamage(player) {
  const stats = applyPerks(player, player.perks, player.phase)
  return Math.max(1, Math.round((stats.baseDmg + (player.tempDmg || 0)) * 0.2))
}

// ─── Dano do inimigo ──────────────────────────────────────────────────────────

/**
 * Calcula o resultado de um ataque inimigo.
 * @returns {{ type: 'dodge'|'block'|'hit'|'none', dmg?: number }}
 */
export function calculateEnemyAttackDamage(player, enemies, attacker, opts = {}) {
  const { failMult = 1, allowDodge = true } = opts
  if (!attacker) return { type: 'none' }

  const stats = applyPerks(player, player.perks, player.phase)
  const aliveCount = enemies.filter(e => e.hp > 0).length
  const groupMult = GROUP_DMG_MULT[Math.min(aliveCount, 4)] ?? 0.50

  if (allowDodge && stats.agility > 0 && Math.random() < stats.agility)
    return { type: 'dodge' }

  if ((player.tempDefense || 0) > 0)
    return { type: 'block', dmg: 0 }

  const eRoll = rollD8()
  const { mult: eMult } = getDiceEffect(eRoll)
  let dmg = Math.max(1, Math.round(attacker.dmg * eMult * failMult * groupMult))
  dmg = Math.max(0, dmg - (stats.defense || 0))

  if (dmg === 0) return { type: 'block', dmg: 0 }
  return { type: 'hit', dmg }
}

// ─── Perk: maxhp ──────────────────────────────────────────────────────────────

/** Aplica o ganho de HP ao subir nível de maxhp */
export function applyMaxHpPerk(player, currentLv, nextLv) {
  const hpGain = HP_PER_LEVEL[nextLv] - HP_PER_LEVEL[currentLv]
  return {
    ...player,
    maxHp: player.maxHp + hpGain,
    hp: Math.min(player.hp + hpGain, player.maxHp + hpGain),
  }
}
