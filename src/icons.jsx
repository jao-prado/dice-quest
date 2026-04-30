import caveira         from './ARTES/ICONS/caveira.png'
import coletar         from './ARTES/ICONS/coletar.png'
import comecar_jogo    from './ARTES/ICONS/começar_jogo.png'
import enfrentar_boss  from './ARTES/ICONS/enfrentar_boss.png'
import escudo          from './ARTES/ICONS/escudo.png'
import espada          from './ARTES/ICONS/espada.png'
import estrela         from './ARTES/ICONS/estrela.png'
import game_over       from './ARTES/ICONS/game_over.png'
import level_up        from './ARTES/ICONS/level_up.png'
import mochila         from './ARTES/ICONS/mochila.png'
import peark_agilidade from './ARTES/ICONS/peark_agilidade.png'
import peark_dano      from './ARTES/ICONS/peark_dano.png'
import peark_defesa    from './ARTES/ICONS/peark_defesa.png'
import peark_sorte     from './ARTES/ICONS/peark_sorte.png'
import peark_vida      from './ARTES/ICONS/peark_vida.png'
import pocao           from './ARTES/ICONS/pocao.png'
import proximo_enc     from './ARTES/ICONS/proximo_encontro.png'
import reroll          from './ARTES/ICONS/REROLL.png'
import titulo          from './ARTES/ICONS/titulo.png'

export const IC = {
  caveira, coletar, comecar_jogo,
  enfrentar_boss, escudo, espada, estrela,
  game_over, level_up, mochila,
  peark_agilidade, peark_dano, peark_defesa, peark_sorte, peark_vida,
  pocao, proximo_enc, reroll, titulo,
}

export function Icon({ name, size = 22, style = {} }) {
  return (
    <img
      src={IC[name]}
      alt={name}
      style={{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'contain', verticalAlign: 'middle', ...style }}
    />
  )
}
