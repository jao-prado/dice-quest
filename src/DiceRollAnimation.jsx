import { useState, useEffect } from 'react'

import frame1 from './assets/sprites/dice/frame1.png'
import frame2 from './assets/sprites/dice/frame2.png'
import frame3 from './assets/sprites/dice/frame3.png'

import num1 from './assets/sprites/dice/1.png'
import num2 from './assets/sprites/dice/2.png'
import num3 from './assets/sprites/dice/3.png'
import num4 from './assets/sprites/dice/4.png'
import num5 from './assets/sprites/dice/5.png'
import num6 from './assets/sprites/dice/6.png'
import num7 from './assets/sprites/dice/7.png'
import num8 from './assets/sprites/dice/8.png'

import imgFalha   from './assets/sprites/dice/falha.png'
import imgFraco   from './assets/sprites/dice/fraco.png'
import imgNormal  from './assets/sprites/dice/normal.png'
import imgForte   from './assets/sprites/dice/forte.png'
import imgCritico from './assets/sprites/dice/critico.png'

const FRAMES   = [frame1, frame2, frame3]
const NUMS     = [null, num1, num2, num3, num4, num5, num6, num7, num8]
const LABEL_IMG = {
  1: imgFalha,
  2: imgFraco, 3: imgFraco,
  4: imgNormal, 5: imgNormal, 6: imgNormal,
  7: imgForte,
  8: imgCritico,
}

export default function DiceRollAnimation({ result, onDone }) {
  const [frameIdx,  setFrameIdx]  = useState(0)
  const [phase,     setPhase]     = useState('rolling') // rolling | number | label | done

  useEffect(() => {
    const spin = setInterval(() => {
      setFrameIdx(i => (i + 1) % 3)
    }, 100)

    const t1 = setTimeout(() => {
      clearInterval(spin)
      setFrameIdx(2)
      setPhase('number')
    }, 800)

    const t2 = setTimeout(() => setPhase('label'),  1100)
    const t3 = setTimeout(() => { setPhase('done'); onDone() }, 2000)

    return () => { clearInterval(spin); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="dice-overlay">
      <div className="dice-modal-sprite">

        <img
          src={FRAMES[frameIdx]}
          alt="dado"
          className={`dice-frame-img${phase !== 'rolling' ? ' dice-landed' : ''}`}
        />

        {(phase === 'number' || phase === 'label') && (
          <img
            src={NUMS[result]}
            alt={result}
            className="dice-num-img dice-pop"
          />
        )}

        {phase === 'label' && (
          <img
            src={LABEL_IMG[result]}
            alt="resultado"
            className="dice-label-img dice-pop"
          />
        )}
      </div>
    </div>
  )
}
