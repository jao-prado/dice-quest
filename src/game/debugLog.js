// Ative via: localStorage.setItem('rogueDebug', '1') e recarregue
const DEBUG = typeof window !== 'undefined' && localStorage.getItem('rogueDebug') === '1'

function log(tag, ...args) {
  if (!DEBUG) return
  console.log(`[${tag}]`, ...args)
}

export const logCombatEvent = (event, data) => log('COMBAT', event, data)
export const logDamage      = (value, src)  => log('DMG', `${src ?? '?'} → ${value}`)
export const logPerkTrigger = (perkName, data) => log('PERK', perkName, data)
