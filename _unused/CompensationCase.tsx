import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { formatPrice } from './SkinCatalog'
import type { Skin } from './SkinCatalog'
import { playSound } from '../sound'
import { COMPENSATION_WINNER_INDEX } from '../compensation'
import type { Compensation } from '../compensation'
import '../compensation.css'

// Тайминги (мс от появления кейса)
const CASE_HIDE_AT = 1800   // кейс убирается
const REEL_START_AT = 2000  // рулетка начинает ехать
const REEL_MS = 3200        // сколько едет рулетка
const HOLD_MS = 1000        // сколько висит итог после остановки
const OUT_MS = 260          // плавное исчезновение
const CARD_W = 232.2        // ширина карточки рулетки (1161 / 5)
const VIEW_W = 1161

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

const SMOKE = [
  { dx: '-150px', dy: '10px', delay: '0ms' },
  { dx: '-95px', dy: '-12px', delay: '60ms' },
  { dx: '-45px', dy: '18px', delay: '30ms' },
  { dx: '45px', dy: '18px', delay: '30ms' },
  { dx: '95px', dy: '-12px', delay: '60ms' },
  { dx: '150px', dy: '10px', delay: '0ms' },
]

function CaseArt() {
  return (
    <svg className="comp__case-svg" viewBox="0 0 230 190" width="230" height="190" aria-hidden="true">
      <defs>
        <linearGradient id="compBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#47484e" />
          <stop offset="1" stopColor="#222326" />
        </linearGradient>
        <linearGradient id="compLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2d31" />
          <stop offset="1" stopColor="#4d4e54" />
        </linearGradient>
        <radialGradient id="compGlow" cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor="#ffb21b" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffb21b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="comp__lid">
        <polygon points="34,78 196,78 184,8 46,8" fill="url(#compLid)" stroke="#5c5d64" strokeWidth="2" />
        <polygon points="44,72 186,72 177,18 53,18" fill="#16171a" />
        <polygon points="44,72 186,72 177,18 53,18" fill="url(#compGlow)" />
      </g>
      <rect x="14" y="76" width="202" height="104" rx="9" fill="url(#compBody)" stroke="#5a5b62" strokeWidth="2" />
      <rect x="14" y="76" width="202" height="14" rx="6" fill="#55565d" />
      <rect x="24" y="100" width="182" height="70" rx="5" fill="none" stroke="#17181a" strokeWidth="2" />
      <path d="M99 138 L115 122 L131 138 L124 138 L115 129 L106 138 Z" fill="#f2a516" />
      <path d="M99 150 L115 134 L131 150 L124 150 L115 141 L106 150 Z" fill="#fcd711" />
      <text x="115" y="166" textAnchor="middle" fontSize="9" fontWeight="700" fill="#e6e6ea" fontFamily="Exo 2, sans-serif">UPGRADER</text>
      <circle cx="30" cy="112" r="3" fill="#18191b" />
      <circle cx="200" cy="112" r="3" fill="#18191b" />
    </svg>
  )
}

function ReelCard({ skin, win }: { skin: Skin; win: boolean }) {
  return (
    <div className={`comp__card${win ? ' comp__card--win' : ''}`} style={{ '--rarity': skin.rarityColor } as CSSProperties}>
      <div className="comp__card-in">
        <span className="comp__card-price">
          {formatPrice(skin.price)}
          <img src="/coins.png" alt="" draggable={false} />
        </span>
        <img className="comp__card-img" src={skin.image} alt="" draggable={false} />
        <span className="comp__card-name">
          <span className="comp__card-weapon">{skin.weapon}</span>
          {skin.name}
        </span>
      </div>
    </div>
  )
}

type Props = {
  comp: Compensation
  onReveal: () => void // рулетка остановилась: скин выдан
  onDone: () => void   // всё закончилось, можно вернуть интерфейс
}

// Обычная скорость: после проигрыша падает кейс с дымом, затем рулетка останавливается на скине-компенсации
export default function CompensationCase({ comp, onReveal, onDone }: Props) {
  const [caseHidden, setCaseHidden] = useState(false)
  const [reelOn, setReelOn] = useState(false)
  const [done, setDone] = useState(false)
  const [out, setOut] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const revealRef = useRef(onReveal)
  const doneRef = useRef(onDone)
  revealRef.current = onReveal
  doneRef.current = onDone

  useEffect(() => {
    const timers: number[] = []
    let raf = 0
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    playSound('click')
    at(CASE_HIDE_AT, () => setCaseHidden(true))
    at(REEL_START_AT - 200, () => setReelOn(true))

    // Конечная позиция: победная карточка у указателя (по центру) с небольшим случайным смещением
    const jitter = (Math.random() - 0.5) * CARD_W * 0.6
    const finalOffset = COMPENSATION_WINNER_INDEX * CARD_W + CARD_W / 2 + jitter - VIEW_W / 2

    at(REEL_START_AT, () => {
      const startedAt = performance.now()
      let lastCard = -1
      const frame = (now: number) => {
        const t = Math.min(1, (now - startedAt) / REEL_MS)
        const offset = finalOffset * easeOutQuart(t)
        if (trackRef.current) trackRef.current.style.transform = `translateX(${-offset}px)`
        const card = Math.floor((offset + VIEW_W / 2) / CARD_W)
        if (card !== lastCard) {
          if (lastCard !== -1) playSound('tick')
          lastCard = card
        }
        if (t < 1) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    })

    at(REEL_START_AT + REEL_MS, () => {
      setDone(true)
      playSound('click')
      revealRef.current()
    })
    at(REEL_START_AT + REEL_MS + HOLD_MS, () => setOut(true))
    at(REEL_START_AT + REEL_MS + HOLD_MS + OUT_MS, () => doneRef.current())

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className={`comp${out ? ' comp--out' : ''}`} aria-label="Compensation">
      <div className="comp__blur comp__blur--left" />
      <div className="comp__blur comp__blur--right" />

      <div className="comp__stage">
        {SMOKE.map((puff, i) => (
          <span
            key={i}
            className="comp__smoke"
            style={{ '--dx': puff.dx, '--dy': puff.dy, animationDelay: `calc(480ms + ${puff.delay})` } as CSSProperties}
          />
        ))}
        <div className={`comp__case${caseHidden ? ' comp__case--hide' : ''}`}>
          <CaseArt />
        </div>
      </div>

      <div className={`comp__reel${reelOn ? ' comp__reel--on' : ''}${done ? ' comp__reel--done' : ''}`}>
        <div className="comp__marker" />
        <div className="comp__track" ref={trackRef}>
          {comp.reel.map((skin, index) => (
            <ReelCard key={index} skin={skin} win={index === COMPENSATION_WINNER_INDEX} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Быстрая скорость: без кейса, скин-компенсация показывается в левой карточке с подписью «Компенсация»
export function CompensationPanel({ skin }: { skin: Skin }) {
  return (
    <div className="selected-skin-panel comp-panel" style={{ '--rarity': skin.rarityColor } as CSSProperties}>
      <span className="selected-skin-panel__weapon">{skin.weapon}</span>
      <span className="selected-skin-panel__name">{skin.name}</span>
      <img className="selected-skin-panel__image" src={skin.image} alt={`${skin.weapon} | ${skin.name}`} draggable={false} />
      <span className="selected-skin-panel__price">
        {formatPrice(skin.price)}
        <img src="/coins.png" alt="" draggable={false} />
      </span>
      <span className="comp-panel__label">Компенсация</span>
    </div>
  )
}
