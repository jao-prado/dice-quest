import { useState, useCallback } from 'react'
import {
  toggleMute, setBgmVolume, setSfxVolume,
  getMuted, getBgmVolume, getSfxVolume,
} from './AudioManager'

export function useAudio() {
  const [muted,     setMuted]     = useState(getMuted)
  const [bgmVol,    setBgmVol]    = useState(getBgmVolume)
  const [sfxVol,    setSfxVol]    = useState(getSfxVolume)

  const handleToggleMute = useCallback(() => {
    setMuted(toggleMute())
  }, [])

  const handleBgmVolume = useCallback((v) => {
    setBgmVolume(v)
    setBgmVol(v)
  }, [])

  const handleSfxVolume = useCallback((v) => {
    setSfxVolume(v)
    setSfxVol(v)
  }, [])

  return { muted, bgmVol, sfxVol, handleToggleMute, handleBgmVolume, handleSfxVolume }
}
