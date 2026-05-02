import { DMG_PER_LEVEL, DEF_PER_LEVEL, HP_PER_LEVEL, LUCK_PER_LEVEL, AGIL_PER_LEVEL } from './constants'

/**
 * Definição centralizada de todas as perks.
 * Para adicionar uma nova perk: adicione aqui e implemente os hooks relevantes.
 *
 * Hooks disponíveis (chamados em App.jsx nos momentos certos):
 *   onPlayerAttack(player, dmg)   → retorna dmg modificado
 *   onEnemyAttack(player, dmg)    → retorna dmg modificado
 *   onDamageTaken(player, dmg)    → retorna dmg modificado
 *   onDamageDealt(player, dmg)    → retorna dmg modificado
 *   onTurnStart(player)           → efeitos no início do turno
 *   onTurnEnd(player)             → efeitos no fim do turno
 */
export const PERK_DEFS = {
  damage: {
    id: 'damage', name: 'Dano', icon: 'peark_dano', maxLevel: 5,
    desc: (lv) => `+${DMG_PER_LEVEL[Math.min(lv + 1, 5)]} dano`,
  },
  defense: {
    id: 'defense', name: 'Defesa', icon: 'peark_defesa', maxLevel: 5,
    desc: (lv) => `-${DEF_PER_LEVEL[Math.min(lv + 1, 5)]} dano recebido`,
  },
  maxhp: {
    id: 'maxhp', name: 'Vida', icon: 'peark_vida', maxLevel: 5,
    desc: (lv) => `+${HP_PER_LEVEL[Math.min(lv + 1, 5)] - HP_PER_LEVEL[Math.min(lv, 5)]} HP maximo`,
  },
  luck: {
    id: 'luck', name: 'Sorte', icon: 'peark_sorte', maxLevel: 5,
    desc: (lv) => `+${Math.round(LUCK_PER_LEVEL[Math.min(lv + 1, 5)] * 100)}% chance de rolar melhor`,
  },
  agility: {
    id: 'agility', name: 'Agilidade', icon: 'peark_agilidade', maxLevel: 5,
    desc: (lv) => `+${Math.round(AGIL_PER_LEVEL[Math.min(lv + 1, 5)] * 100)}% chance de esquivar`,
  },
}

/** Array de perks para uso em UI (lista, escolha de level up) */
export const PERKS = Object.values(PERK_DEFS)

/** Retorna 3 perks aleatórias para a tela de level up */
export function pickPerks() {
  return [...PERKS].sort(() => Math.random() - 0.5).slice(0, 3)
}

/**
 * Executa todos os hooks de um tipo para as perks ativas do jogador.
 * Retorna o valor modificado (para hooks que transformam dano).
 *
 * @example
 * const finalDmg = runPerkHooks('onDamageTaken', player, rawDmg)
 */
export function runPerkHooks(hookName, player, value) {
  let result = value
  for (const [perkId, level] of Object.entries(player.perks)) {
    const def = PERK_DEFS[perkId]
    if (def?.[hookName]) result = def[hookName](player, result, level)
  }
  return result
}
