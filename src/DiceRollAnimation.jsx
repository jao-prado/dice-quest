import { useState, useEffect } from 'react'

import frame1 from './ARTES/DADOS/frames_1-removebg-preview.png'
import frame2 from './ARTES/DADOS/frame_2-removebg-preview.png'
import frame3 from './ARTES/DADOS/frame_3-removebg-preview.png'

import num1 from './ARTES/DADOS/1.png'
import num2 from './ARTES/DADOS/2.png'
import num3 from './ARTES/DADOS/3.png'
import num4 from './ARTES/DADOS/4.png'
import num5 from './ARTES/DADOS/5.png'
import num6 from './ARTES/DADOS/6.png'
import num7 from './ARTES/DADOS/7.png'
import num8 from './ARTES/DADOS/8.png'

import imgFalha   from './ARTES/DADOS/falha.png'
import imgFraco   from './ARTES/DADOS/fraco.png'
import imgNormal  from './ARTES/DADOS/normal.png'
import imgForte   from './ARTES/DADOS/forte.png'
import imgCritico from './ARTES/DADOS/critico.png'

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
    // loop de frames
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

        {/* frame do dado */}
        <img
          src={FRAMES[frameIdx]}
          alt="dado"
          className={`dice-frame-img${phase !== 'rolling' ? ' dice-landed' : ''}`}
        />

        {/* número — aparece após parar */}
        {(phase === 'number' || phase === 'label') && (
          <img
            src={NUMS[result]}
            alt={result}
            className="dice-num-img dice-pop"
          />
        )}

        {/* texto resultado */}
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
