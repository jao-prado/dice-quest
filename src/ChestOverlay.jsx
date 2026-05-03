import { useState, useEffect } from 'react'
import { playSfx } from './audio/AudioManager'
import bau_fechado from './assets/sprites/items/bau.png'
import bau_abrindo from './assets/sprites/items/bau_abrindo.png'
import bau_aberto  from './assets/sprites/items/coletando_item.png'
import imgColetar  from './assets/ui/icons/coletar.png'

const BAU_SRC = { closed: bau_fechado, opening: bau_abrindo, open: bau_aberto }

export default function ChestOverlay({ item, onCollect }) {
  const [frame, setFrame] = useState('closed')

  useEffect(() => {
    const t1 = setTimeout(() => { setFrame('opening'); playSfx('chest_open') }, 600)
    const t2 = setTimeout(() => setFrame('open'), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="chest-overlay">
      <div className="chest-overlay-content">
        <p className="chest-found-msg">Você achou um item!</p>
        <div className="chest-overlay-bau">
          <img src={BAU_SRC[frame]} alt="baú" className={`sprite chest-sprite${frame === 'open' ? ' chest-open' : ''}`} />
        </div>
        {frame === 'open' && (
          <div className="chest-item-info">
            <img src={item.sprite} alt={item.name} className="item-popup-sprite" />
            <p className="item-popup-name">{item.name}</p>
            <p className="item-popup-desc">{item.desc}</p>
            <button className="img-btn item-popup-btn" onClick={onCollect}>
              <img src={imgColetar} alt="Coletar" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
