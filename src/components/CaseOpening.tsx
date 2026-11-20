import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import '../caseOpening.css'
import { formatPrice } from './SkinCatalog'
import type { Skin } from './SkinCatalog'
import { pickBeltSkins } from '../compensation'
import { BELT, BELT_PROFILE, CASE_TIMING } from '../rouletteProfile'
import { makeProgress } from '../spinProfiles'
import { playSound } from '../sound'

// Открытие кейса после проигранного апгрейда (обычная прокрутка, вход больше CASE_THRESHOLD).
// Последовательность снята с видео-образца:
//   размытие страницы -> кейс падает, открывается, дым (видео без фона, со звуком) ->
//   панель с лентой скинов -> лента едет и тормозит -> вспышка и выезд выпавшего скина ->
//   экран «Here's your drop!» (Sell for N / Back to upgrade).
// Выпавший скин определяется заранее (compensation.ts), лента только красиво подводит к нему.

type Stage = 'case' | 'roulette' | 'pop' | 'drop'

type Props = {
  drop: Skin // что выпало (уже определено)
  catalog: Skin[] // каталог: из него набирается остальная лента
  input: number // сумма входа: от неё зависят цены карточек в ленте
  onSell: () => void // продать: вернуть стоимость на виртуальный баланс
  onKeep: () => void // оставить (Back to upgrade или крестик): скин уходит в инвентарь
}

const PITCH = BELT.cardW + BELT.gap
const progressAt = makeProgress(BELT_PROFILE)

function Chevrons() {
  return (
    <svg className="co-card__chevrons" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M8 22 L50 4 L92 22 L92 36 L50 18 L8 36 Z" />
      <path d="M8 46 L50 28 L92 46 L92 60 L50 42 L8 60 Z" />
      <path d="M8 70 L50 52 L92 70 L92 84 L50 66 L8 84 Z" />
    </svg>
  )
}

export function CaseCard({ skin, className = '' }: { skin: Skin; className?: string }) {
  return (
    <div className={`co-card ${className}`} style={{ '--rarity': skin.rarityColor } as CSSProperties}>
      <Chevrons />
      <span className="co-card__price">
        {formatPrice(skin.price)}
        <img src="/coins.png" alt="" draggable={false} />
      </span>
      <img className="co-card__image" src={skin.image} alt="" draggable={false} />
      <span className="co-card__weapon">{skin.weapon}</span>
      <span className="co-card__name">{skin.name}</span>
    </div>
  )
}

export default function CaseOpening({ drop, catalog, input, onSell, onKeep }: Props) {
  const [stage, setStage] = useState<Stage>('case')
  const [blurOn, setBlurOn] = useState(false)
  const [leaving, setLeaving] = useState(false) // плавное закрытие: сначала растворяется, потом отдаём управление странице

  // Лента и точка остановки выбираются один раз на открытие
  const [belt] = useState(() => {
    const others = pickBeltSkins(catalog, input, BELT.total - 1, new Set([drop.id]))
    const items: Skin[] = []
    let cursor = 0
    for (let i = 0; i < BELT.total; i++) {
      if (i === BELT.winnerIndex) items.push(drop)
      else items.push(others[cursor++ % Math.max(1, others.length)] ?? drop)
    }
    const offset = 0.1 + Math.random() * 0.8 // где внутри карточки остановится указатель
    const end = BELT.panelW / 2 - (BELT.winnerIndex * PITCH + offset * BELT.cardW)
    return { items, start: end + BELT.travel, end }
  })

  // Закрытие: Sell / Back to upgrade / крестик. Один раз, с плавным затуханием (250 мс).
  const leave = (action: () => void) => {
    if (leaving) return
    setLeaving(true)
    setBlurOn(false)
    window.setTimeout(action, 250)
  }

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const beltRef = useRef<HTMLDivElement | null>(null)

  // Таймлайн: кейс -> лента -> вспышка -> экран дропа
  useEffect(() => {
    const timers: number[] = []
    const t0 = CASE_TIMING.beltStartMs
    const stopAt = t0 + CASE_TIMING.beltMs + CASE_TIMING.stopHoldMs

    const frame = window.requestAnimationFrame(() => setBlurOn(true))
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      void video.play().catch(() => {})
    }
    playSound('caseOpen')

    timers.push(window.setTimeout(() => setStage('roulette'), t0))
    timers.push(window.setTimeout(() => setStage('pop'), stopAt))
    timers.push(window.setTimeout(() => setStage('drop'), stopAt + CASE_TIMING.popMs))

    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  // Движение ленты по профилю из оригинала (резкий разгон, долгое торможение)
  useEffect(() => {
    if (stage !== 'roulette') return undefined
    const element = beltRef.current
    if (!element) return undefined

    const startTime = performance.now()
    let frameId = 0

    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / CASE_TIMING.beltMs)
      const x = belt.start - BELT.travel * progressAt(t)
      element.style.transform = `translate3d(${x}px, 0, 0)`
      if (t < 1) frameId = window.requestAnimationFrame(animate)
    }

    element.style.transform = `translate3d(${belt.start}px, 0, 0)`
    frameId = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frameId)
  }, [stage, belt])

  const panelVisible = stage !== 'case'

  return (
    <>
      <div className={`co-blur${blurOn ? ' is-on' : ''}`} style={{ transitionDuration: `${CASE_TIMING.blurInMs}ms` }} />

      <video
        ref={videoRef}
        className={`co-clip${panelVisible ? ' is-hidden' : ''}${leaving ? ' is-leaving' : ''}`}
        src="/case/case-open.webm"
        muted
        playsInline
        preload="auto"
        style={{ transitionDuration: `${CASE_TIMING.panelFadeMs}ms` }}
      />

      <div
        className={`co-panel${panelVisible ? ' is-visible' : ''}${leaving ? ' is-leaving' : ''}`}
        style={{ transitionDuration: `${CASE_TIMING.panelFadeMs}ms` }}
      >
        {panelVisible && (
          <button type="button" className="co-close" onClick={() => leave(onKeep)} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {stage !== 'drop' && (
          <div className={`co-roulette${stage === 'pop' ? ' is-pop' : ''}`}>
            <div className="co-belt" ref={beltRef} style={{ transform: `translate3d(${belt.start}px, 0, 0)` }}>
              {belt.items.map((skin, index) => (
                <CaseCard
                  key={index}
                  skin={skin}
                  className={index === BELT.winnerIndex ? 'co-card--winner' : ''}
                />
              ))}
            </div>
            <span className="co-pointer-line" />
            <span className="co-pointer-tip" />
            {stage === 'pop' && <span className="co-flash" style={{ animationDuration: `${CASE_TIMING.popMs}ms` }} />}
          </div>
        )}

        {stage === 'drop' && (
          <div className="co-drop">
            <h2 className="co-drop__title">Here&apos;s your drop!</h2>
            <p className="co-drop__sub">You deserved it &mdash; take it!</p>
            <CaseCard skin={drop} className="co-card--drop" />
            <button type="button" className="co-btn co-btn--sell" onClick={() => leave(onSell)}>
              Sell for {formatPrice(drop.price)}
              <img src="/coins.png" alt="" draggable={false} />
            </button>
            <button type="button" className="co-btn co-btn--back" onClick={() => leave(onKeep)}>
              Back to upgrade
            </button>
          </div>
        )}
      </div>
    </>
  )
}
