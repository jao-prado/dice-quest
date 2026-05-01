import { useAudio } from './audio/useAudio'
import { playSfx } from './audio/AudioManager'

export default function AudioSettings() {
  const { muted, bgmVol, sfxVol, handleToggleMute, handleBgmVolume, handleSfxVolume } = useAudio()

  return (
    <div className="audio-settings">
      <p className="audio-settings-title">🔊 AUDIO</p>

      <div className="audio-row">
        <span>Música</span>
        <input
          type="range" min="0" max="1" step="0.01"
          value={bgmVol}
          onChange={e => handleBgmVolume(parseFloat(e.target.value))}
        />
        <span>{Math.round(bgmVol * 100)}</span>
      </div>

      <div className="audio-row">
        <span>Efeitos</span>
        <input
          type="range" min="0" max="1" step="0.01"
          value={sfxVol}
          onChange={e => { handleSfxVolume(parseFloat(e.target.value)); playSfx('click') }}
        />
        <span>{Math.round(sfxVol * 100)}</span>
      </div>

      <button
        className={`mute-btn${muted ? ' muted' : ''}`}
        onClick={() => { playSfx('click'); handleToggleMute() }}
      >
        {muted ? '🔇 MUDO' : '🔊 SOM ON'}
      </button>
    </div>
  )
}
