// ─── Balanceamento ────────────────────────────────────────────────────────────
export const HP_PER_LEVEL   = [0, 3, 6, 9, 13, 18]
export const DEF_PER_LEVEL  = [0, 1, 2, 4, 6, 9]
export const DMG_PER_LEVEL  = [0, 1, 2, 4, 6, 9]
export const LUCK_PER_LEVEL = [0, 0.05, 0.10, 0.18, 0.28, 0.40]
export const AGIL_PER_LEVEL = [0, 0.06, 0.12, 0.20, 0.30, 0.40]

export const XP_TO_LEVEL = (lvl) => 20 + lvl * 10

export const INITIAL_PLAYER = {
  hp: 300000, maxHp: 3000, xp: 0, level: 1, phase: 1,
  perks: {}, inventory: ['poção', 'poção'],
  baseDmg: 200,
}

// ─── Inimigos ─────────────────────────────────────────────────────────────────
export const NORMAL_NAMES = ['Goblin', 'Orc', 'Esqueleto', 'Zumbi', 'Lobo']
export const ELITE_NAMES  = ['Goblin Elite', 'Orc Bruto', 'Lich', 'Vampiro']
export const BOSS_NAMES   = { 10: 'Necromante', 20: 'Dragão das Sombras', 30: 'Rei Lich' }

// Multiplicador de dano reduzido em grupo
export const GROUP_DMG_MULT = { 1: 1, 2: 0.75, 3: 0.60, 4: 0.50 }

// Multiplicador de dano por resultado do dado de defesa falha
export const DEFEND_FAIL_MULT = { 4: 1.10, 3: 1.15, 2: 1.23, 1: 1.35 }
