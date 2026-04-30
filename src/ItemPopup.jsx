import imgColetar from './ARTES/ICONS/coletar.png'

export default function ItemPopup({ item, onCollect }) {
  return (
    <div className="item-popup-overlay">
      <div className="item-popup">
        <p className="item-popup-title">VOCÊ ENCONTROU!</p>
        <img src={item.sprite} alt={item.name} className="item-popup-sprite" />
        <p className="item-popup-name">{item.name}</p>
        <p className="item-popup-desc">{item.desc}</p>
        <button className="img-btn item-popup-btn" onClick={onCollect}>
          <img src={imgColetar} alt="Coletar" />
        </button>
      </div>
    </div>
  )
}
