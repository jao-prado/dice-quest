// ─── UI Icons ─────────────────────────────────────────────────────────────────
import caveira         from './assets/ui/icons/caveira.png'
import coletar         from './assets/ui/icons/coletar.png'
import comecar_jogo    from './assets/ui/icons/comecar_jogo.png'
import enfrentar_boss  from './assets/ui/icons/enfrentar_boss.png'
import engrenagem      from './assets/ui/icons/engrenagem.png'
import escudo          from './assets/ui/icons/escudo.png'
import espada          from './assets/ui/icons/espada.png'
import estrela         from './assets/ui/icons/estrela.png'
import game_over       from './assets/ui/icons/game_over.png'
import level_up        from './assets/ui/icons/level_up.png'
import mochila         from './assets/ui/icons/mochila.png'
import peark_agilidade from './assets/ui/perks/peark_agilidade.png'
import peark_dano      from './assets/ui/perks/peark_dano.png'
import peark_defesa    from './assets/ui/perks/peark_defesa.png'
import peark_sorte     from './assets/ui/perks/peark_sorte.png'
import peark_vida      from './assets/ui/perks/peark_vida.png'
import pocao           from './assets/ui/icons/pocao.png'
import proximo_enc     from './assets/ui/icons/proximo_encontro.png'
import reroll          from './assets/ui/icons/reroll.png'
import titulo          from './assets/ui/icons/titulo.png'

// ─── Title Screen ─────────────────────────────────────────────────────────────
import ti_comecar_jogo from './assets/ui/title/comecar_jogo.png'
import ti_tutorial     from './assets/ui/title/tutorial.png'
import ti_menu         from './assets/ui/title/menu.png'
import ti_feedback     from './assets/ui/title/feedback.png'
import ti_titulo       from './assets/ui/title/titulo.png'
import ti_dice         from './assets/ui/title/dice.png'
import ti_config       from './assets/ui/title/config.png'
import ti_conquista    from './assets/ui/title/conquista.png'
import ti_estatistica  from './assets/ui/title/estatistica.png'

import nivel_fase1 from './assets/ui/icons/nivel_fase1.png'
import nivel_fase2 from './assets/ui/icons/nivel_fase2.png'
import nivel_fase3 from './assets/ui/icons/nivel_fase3.png'
import nivel_fase4 from './assets/ui/icons/nivel_fase4.png'
import nivel_fase5 from './assets/ui/icons/nivel_fase5.png'

export const IC = {
  caveira, coletar, comecar_jogo,
  enfrentar_boss, escudo, espada, estrela,
  game_over, level_up, mochila,
  peark_agilidade, peark_dano, peark_defesa, peark_sorte, peark_vida,
  engrenagem, pocao, proximo_enc, reroll, titulo,
  ti_comecar_jogo, ti_tutorial, ti_menu, ti_feedback,
  ti_titulo, ti_dice, ti_config, ti_conquista, ti_estatistica,
  nivel_fase1, nivel_fase2, nivel_fase3, nivel_fase4, nivel_fase5,
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
