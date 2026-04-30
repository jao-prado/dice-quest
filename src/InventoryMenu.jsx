import pocao_vida   from './ARTES/ITEM/pocao_vida.png'
import pocao_cura   from './ARTES/ITEM/pocao_cura.png'
import pocao_defesa from './ARTES/ITEM/pocao_defesa.png'
import pocao_forca  from './ARTES/ITEM/pocao_forca.png'
import { IC } from './icons'

// mapa de id → sprite + info
export const ITEM_DATA = {
  'pocao':         { name: 'Pocao de Vida',   sprite: pocao_vida,   effect: (p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 5)  }) },
  'poção':         { name: 'Pocao de Vida',   sprite: pocao_vida,   effect: (p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 5)  }) },
  'poção cura':    { name: 'Pocao de Cura',   sprite: pocao_cura,   effect: (p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 10) }) },
  'pocao cura':    { name: 'Pocao de Cura',   sprite: pocao_cura,   effect: (p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 10) }) },
  'poção defesa':  { name: 'Pocao de Defesa', sprite: pocao_defesa, effect: (p) => ({ ...p, tempDefense: (p.tempDefense||0)+2 }) },
  'pocao defesa':  { name: 'Pocao de Defesa', sprite: pocao_defesa, effect: (p) => ({ ...p, tempDefense: (p.tempDefense||0)+2 }) },
  'poção força':   { name: 'Pocao de Forca',  sprite: pocao_forca,  effect: (p) => ({ ...p, tempDmg: (p.tempDmg||0)+3 }) },
  'pocao forca':   { name: 'Pocao de Forca',  sprite: pocao_forca,  effect: (p) => ({ ...p, tempDmg: (p.tempDmg||0)+3 }) },
}

export default function InventoryMenu({ inventory, onUse, onClose }) {
  // agrupa itens por id com contagem
  const grouped = inventory.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  const entries = Object.entries(grouped)

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-panel" onClick={e => e.stopPropagation()}>

        <div className="inv-header">
          <img src={IC.mochila} alt="mochila" className="inv-title-icon" />
          <span>MOCHILA</span>
          <button className="inv-close" onClick={onClose}>X</button>
        </div>

        {entries.length === 0 && (
          <p className="inv-empty">Inventario vazio</p>
        )}

        <div className="inv-list">
          {entries.map(([id, qty]) => {
            const data = ITEM_DATA[id]
            if (!data) return null
            return (
              <button key={id} className="inv-item-btn" onClick={() => onUse(id)}>
                <img src={data.sprite} alt={data.name} className="inv-item-sprite" />
                <span className="inv-item-name">{data.name}</span>
                <span className="inv-item-qty">x{qty}</span>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
