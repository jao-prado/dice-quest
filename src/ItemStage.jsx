import { useState, useEffect } from 'react'
import { playSfx } from './audio/AudioManager'
import heroi_parado from './assets/sprites/hero/heroi_parado.png'
import bau_fechado  from './assets/sprites/items/bau.png'
import bau_abrindo  from './assets/sprites/items/bau_abrindo.png'
import bau_aberto   from './assets/sprites/items/coletando_item.png'
import cenario      from './assets/backgrounds/cenario.png'
import ItemPopup    from './ItemPopup'

import pocao_vida   from './assets/sprites/items/pocao_vida.png'
import pocao_cura   from './assets/sprites/items/pocao_cura.png'
import pocao_defesa from './assets/sprites/items/pocao_defesa.png'
import pocao_forca  from './assets/sprites/items/pocao_forca.png'

import { IC } from './icons'

export const LOOT_TABLE = [
  { id: 'poção',        name: 'POÇÃO DE VIDA',   desc: 'Restaura 5 HP',          sprite: pocao_vida   },
  { id: 'poção cura',   name: 'POÇÃO DE CURA',   desc: 'Restaura 10 HP',         sprite: pocao_cura   },
  { id: 'poção defesa', name: 'POÇÃO DE DEFESA', desc: 'Bloqueia o próx. ataque recebido', sprite: pocao_defesa },
  { id: 'poção força',  name: 'POÇÃO DE FORÇA',  desc: '+50% dano no próx. ataque',      sprite: pocao_forca  },
]

export function rollLoot(phase) {
  if (phase >= 4) return LOOT_TABLE[Math.floor(Math.random() * LOOT_TABLE.length)]
  return LOOT_TABLE[0]
}

const BAU_SRC = { closed: bau_fechado, opening: bau_abrindo, open: bau_aberto }

export default function ItemStage({ player, phase, onCollect }) {
  const [frame,      setFrame]      = useState('closed')
  const [loot]                      = useState(() => rollLoot(phase))
  const [showPopup,  setShowPopup]  = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => { setFrame('opening'); playSfx('chest_open') }, 800)
    const t2 = setTimeout(() => setFrame('open'),    1600)
    const t3 = setTimeout(() => setShowPopup(true),  2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const handleCollect = () => {
    setShowPopup(false)
    setTimeout(() => onCollect(loot), 400)
  }

  const hpPct = (player.hp / player.maxHp) * 100

  return (
    <div className="combat-screen">
      <div className="combat-scene" style={{ backgroundImage: `url(${cenario})` }}>

        <img src={IC[`nivel_fase${((phase - 1) % 5) + 1}`]} alt="fase" className="level-progress-indicator" />

        {/* herói */}
        <div className="scene-hero">
          <div className="hero-bars">
            <div className="hero-hp-name">HERO <span>Lv.{player.level}</span></div>
            <div className="bar enemy-bar"><div className="bar-fill hp" style={{ width: `${hpPct}%` }} /></div>
          </div>
          <img src={heroi_parado} alt="hero" className="sprite hero-sprite" />
        </div>

        {/* baú */}
        <div className="scene-chest">
          <img
            src={BAU_SRC[frame]}
            alt="chest"
            className={`sprite chest-sprite${frame === 'open' ? ' chest-open' : ''}`}
          />
        </div>

        {/* popup do item — igual ao dado */}
        {showPopup && <ItemPopup item={loot} onCollect={handleCollect} />}
      </div>
    </div>
  )
}
