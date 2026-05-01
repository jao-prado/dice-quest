const BGM_FILES = {
  overworld: '/audio/bgm/overworld.mp3',
  boss:      '/audio/bgm/boss.mp3',
}

const SFX_FILES = {
  click:           '/audio/sfx/click.mp3',
  attack:          '/audio/sfx/attack.mp3',
  attack_strong:   '/audio/sfx/attack_strong.mp3',
  attack_critical: '/audio/sfx/attack_critical.mp3',
  defend:          '/audio/sfx/defend.mp3',
  dice_roll:       '/audio/sfx/dice_roll.mp3',
  hit:             '/audio/sfx/hit.mp3',
  chest_open:      '/audio/sfx/chest_open.mp3',
  item_collect:    '/audio/sfx/item_collect.mp3',
  drink_potion:    '/audio/sfx/drink_potion.mp3',
  levelup:         '/audio/sfx/level_up.mp3',
  levelup_complete:'/audio/sfx/levelup_complete.mp3',
  gameover:        '/audio/sfx/game_over.mp3',
  start_run:       '/audio/bgm/battle.mp3',
}

const FADE_DURATION = 800

let bgmAudio = null
let currentBgm = null
let bgmVolume = parseFloat(localStorage.getItem('bgmVolume') ?? '0.5')
let sfxVolume = parseFloat(localStorage.getItem('sfxVolume') ?? '0.8')
let muted = localStorage.getItem('muted') === 'true'
let unlocked = false

// Preload SFX into Audio objects pool
const sfxPool = {}
Object.entries(SFX_FILES).forEach(([name, src]) => {
  sfxPool[name] = new Audio(src)
  sfxPool[name].preload = 'auto'
})

export function unlockAudio() {
  if (unlocked) return
  unlocked = true
}

export function playSfx(name, volumeScale = 1) {
  if (!unlocked) return
  const original = sfxPool[name]
  if (!original) return
  const clone = original.cloneNode()
  clone.volume = Math.min(1, sfxVolume * volumeScale)
  clone.play().catch(() => {})
}

export function playBgm(name, loop = true) {
  if (currentBgm === name && bgmAudio && !bgmAudio.paused) return
  stopBgm()
  if (!BGM_FILES[name]) return
  currentBgm = name
  bgmAudio = new Audio(BGM_FILES[name])
  bgmAudio.loop = loop
  bgmAudio.volume = muted ? 0 : bgmVolume * 0.15
  bgmAudio.play().catch(() => {})
}

export function stopBgm() {
  if (!bgmAudio) return
  bgmAudio.pause()
  bgmAudio.currentTime = 0
  bgmAudio = null
  currentBgm = null
}

export function fadeToBgm(name, loop = true) {
  if (currentBgm === name && bgmAudio && !bgmAudio.paused) return
  if (!bgmAudio) { playBgm(name, loop); return }

  const old = bgmAudio
  const targetVol = bgmVolume
  const steps = 20
  const interval = FADE_DURATION / steps
  let step = 0

  const fadeOut = setInterval(() => {
    step++
    old.volume = Math.max(0, targetVol * 0.15 * (1 - step / steps))
    if (step >= steps) {
      clearInterval(fadeOut)
      old.pause()
      bgmAudio = null
      currentBgm = null
      playBgm(name, loop)
    }
  }, interval)
}

export function setBgmVolume(value) {
  bgmVolume = value
  localStorage.setItem('bgmVolume', value)
  if (bgmAudio && !muted) bgmAudio.volume = value * 0.15
}

export function setSfxVolume(value) {
  sfxVolume = value
  localStorage.setItem('sfxVolume', value)
}

export function toggleMute() {
  muted = !muted
  localStorage.setItem('muted', muted)
  if (bgmAudio) bgmAudio.volume = muted ? 0 : bgmVolume * 0.15
  return muted
}

export function getMuted()     { return muted }
export function getBgmVolume() { return bgmVolume }
export function getSfxVolume() { return sfxVolume }
