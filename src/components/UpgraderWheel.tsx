import { useState, useEffect, useRef } from 'react'
import '../wheelLabels.css'
import '../upgradeSpin.css'

const SIZE = 365
const C = SIZE / 2

const THICK_R = 130
const THICK_W = 28
const THIN_R = 161
const THIN_W = 2
const THIN_OFFSET_X = 1
const OFFSET_X = -5
const OFFSET_Y = 1

// Стрелка: вращается вокруг центра колеса
const PIVOT_X = C + OFFSET_X + 0.5   // центр колеса по горизонтали
const PIVOT_Y = C + OFFSET_Y         // центр колеса по вертикали
const ARROW_TIP_R = 116              // расстояние от центра до кончика стрелки (внутренний край дуги)
const ARROW_IMG_TIP_Y = 6            // где в картинке кончик стрелки (сверху, px)
const ARROW_IMG_CENTER_X = 12        // где в картинке середина стрелки (слева, px)
const SPIN_EASING = 'cubic-bezier(0.12, 0.55, 0.12, 1)' // быстрый разгон и долгое замедление

type Props = {
  chance: number
  active: boolean
  spin?: { id: number; angle: number; duration: number } | null // крутка: угол (градусы) и время (мс)
  result?: 'win' | 'lose' | null                                // что показать в центре после крутки
}

function getLabel(chance: number) {
  if (chance < 20) return 'very low chance'
  if (chance < 40) return 'low chance'
  if (chance < 65) return 'medium chance'
  if (chance < 85) return 'high chance'
  return 'very high chance'
}

function arcPath(r: number, chance: number) {
  const clamped = Math.min(100, Math.max(0, chance))
  if (clamped <= 0) return ''
  if (clamped >= 99.99) {
    return `M ${C - r} ${C} A ${r} ${r} 0 1 0 ${C + r} ${C} A ${r} ${r} 0 1 0 ${C - r} ${C}`
  }

  const angleDeg = (clamped / 100) * 180
  const angleRad = (angleDeg * Math.PI) / 180

  const xLeft = C - r * Math.sin(angleRad)
  const yLeft = C + r * Math.cos(angleRad)
  const xRight = C + r * Math.sin(angleRad)
  const yRight = C + r * Math.cos(angleRad)

  const largeArc = clamped > 50 ? 1 : 0

  return `M ${xLeft} ${yLeft} A ${r} ${r} 0 ${largeArc} 0 ${xRight} ${yRight}`
}

type ArcProps = {
  r: number
  w: number
  chance: number
  offsetX?: number
}

function Arc({ r, w, chance, offsetX = 0 }: ArcProps) {
  const pathData = arcPath(r, chance)
  if (!pathData) return null

  return (
    <path 
      d={pathData} 
      fill="none" 
      stroke="url(#wheel-grad)" 
      strokeWidth={w} 
      transform={`translate(${offsetX}, 0)`}
    />
  )
}

export default function UpgraderWheel({ chance, active, spin = null, result = null }: Props) {
  const targetChance = active ? Math.min(100, Math.max(0, chance)) : 50

  const [displayChance, setDisplayChance] = useState(targetChance)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = displayChance
    const startTime = performance.now()
    const duration = 350

    const updateAnimation = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      const current = startValue + (targetChance - startValue) * easeProgress
      setDisplayChance(current)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(updateAnimation)
      }
    }

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(updateAnimation)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [targetChance])

  // Стрелка: стоит внизу, при крутке делает обороты по часовой стрелке
  const [arrow, setArrow] = useState({ angle: 0, ms: 0 })
  const arrowRef = useRef(arrow)
  arrowRef.current = arrow

  useEffect(() => {
    let raf = 0
    let timer = 0

    if (spin) {
      // старт снизу без анимации, затем разгон до нужного угла
      setArrow({ angle: 0, ms: 0 })
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setArrow({ angle: spin.angle, ms: spin.duration }))
      })
    } else if (arrowRef.current.angle !== 0) {
      // крутка закончилась: плавно возвращаем стрелку вниз по ближайшей дороге
      const rest = arrowRef.current.angle % 360
      const home = rest > 180 ? 360 : 0
      setArrow({ angle: rest, ms: 0 })
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setArrow({ angle: home, ms: 600 }))
      })
      timer = window.setTimeout(() => setArrow({ angle: 0, ms: 0 }), 700)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [spin?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Подпись светлеет, когда цветная дуга дошла до неё.
  // Угол дуги считается от низа колеса (0% внизу, 50% сбоку, 100% вверху).
  const arcAngle = (Math.min(100, Math.max(0, displayChance)) / 100) * 180
  const coveredBottom = arcAngle >= 3
  const coveredSides = arcAngle >= 90
  const coveredTop = displayChance >= 99.99

  return (
    <div className="upgrader-wheel">
      <img src="/wheel-no-labels.png" alt="" className="upgrader-wheel__bg" draggable={false} />
      
      <svg 
        className="upgrader-wheel__svg" 
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: `translate(${OFFSET_X}px, ${OFFSET_Y}px)` }}
      >
        <defs>
          <linearGradient id="wheel-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={SIZE}>
            <stop offset="0.12" stopColor="#2fdc12" />
            <stop offset="0.7" stopColor="#e8d414" />
            <stop offset="0.90" stopColor="#e8532b" />
          </linearGradient>
        </defs>
        
        <Arc r={THICK_R} w={THICK_W} chance={displayChance} />
        <Arc r={THIN_R} w={THIN_W} chance={displayChance} offsetX={THIN_OFFSET_X} />
      </svg>

      {/* Подписи 100% / 50% / 0%: поверх дуги, чтобы она их не закрывала */}
      <svg className="upgrader-wheel__labels" viewBox="0 0 365 362" preserveAspectRatio="none">
        <text x="178.5" y="57" className={coveredTop ? 'is-covered' : undefined}>100%</text>
        <text x="48.5" y="187" className={coveredSides ? 'is-covered' : undefined}>50%</text>
        <text x="308.5" y="187" className={coveredSides ? 'is-covered' : undefined}>50%</text>
        <text x="180.5" y="317" className={coveredBottom ? 'is-covered' : undefined}>0%</text>
      </svg>

      {/* Стрелка */}
      <div
        className="upgrader-wheel__arrow"
        style={{
          transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
          transform: `rotate(${arrow.angle}deg)`,
          transition: arrow.ms ? `transform ${arrow.ms}ms ${SPIN_EASING}` : 'none',
        }}
      >
        <img
          src="/wheel-arrow.png"
          alt=""
          draggable={false}
          style={{
            left: PIVOT_X - ARROW_IMG_CENTER_X,
            top: PIVOT_Y + ARROW_TIP_R - ARROW_IMG_TIP_Y,
            transform: 'rotate(180deg)',
          }}
        />
      </div>

      {result === 'lose' ? (
        <div className="upgrader-wheel__center upgrader-wheel__result">
          <span className="upgrader-wheel__lose">
            NO
            <br />
            PROBLEM
          </span>
          <span className="upgrader-wheel__lose-sub">try again?</span>
        </div>
      ) : result === 'win' ? (
        <div className="upgrader-wheel__center upgrader-wheel__result">
          <span className="upgrader-wheel__percent">{Number(displayChance).toFixed(2)}%</span>
          <span className="upgrader-wheel__label upgrader-wheel__label--win">Upgrade successful!</span>
        </div>
      ) : (
        <div className="upgrader-wheel__center">
          <span className="upgrader-wheel__percent">{Number(displayChance).toFixed(2)}%</span>
          <span className="upgrader-wheel__label">{getLabel(displayChance)}</span>
        </div>
      )}
    </div>
  )
}