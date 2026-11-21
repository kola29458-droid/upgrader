import { memo, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLiveDrops } from '../hooks/useLiveDrops'
import type { BestDrop, LiveDrop } from '../hooks/useLiveDrops'
import type { DropItem } from '../liveDropsCatalog'

// Двойной шеврон вверх (плашка шанса)
function ChanceBadge({ chance, side }: { chance: number; side: 'row' | 'best' }) {
  return (
    <div className={`ld-chance ld-chance--${side}`}>
      <svg
        className="ld-chance__chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 11l6-6 6 6" />
        <path d="M6 18l6-6 6 6" />
      </svg>
      <span className="ld-chance__value">{chance.toFixed(2)}%</span>
    </div>
  )
}

const Row = memo(function Row({ drop, onImageError }: { drop: LiveDrop; onImageError: (id: string) => void }) {
  const { item, chance, player, avatarColor, isVs, isNew } = drop
  return (
    <div className={`ld-row-wrap${isNew ? ' ld-row-wrap--new' : ''}`}>
      <div className="ld-row-wrap__inner">
        <div className="ld-card ld-row" style={{ '--drop-color': item.color } as CSSProperties}>
          <ChanceBadge chance={chance} side="row" />

          <div className="ld-info">
            <span className="ld-info__name">{item.name}</span>
            <span className="ld-info__type">{item.type}</span>
          </div>

          <div className="ld-hover-user">
            <span className="ld-hover-user__avatar" style={{ background: avatarColor }}>
              {player.charAt(0).toUpperCase()}
            </span>
            <span className="ld-hover-user__name">{player}</span>
          </div>

          <svg className="ld-hover-arrows" width="60" height="90" viewBox="0 0 60 90" fill="#FBD506" aria-hidden="true">
            <path d="M24 17 0-.6-24 17V.6L0-17 24 .6Z" transform="translate(30 17)" opacity="0.3" />
            <path d="M30 21 0-.8-30 21V.8L0-21 30 .8Z" transform="translate(30 47)" />
            <path d="M24 17 0-.6-24 17V.6L0-17 24 .6Z" transform="translate(30 73)" opacity="0.3" />
          </svg>

          <img
            className="ld-image"
            src={item.image}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => onImageError(drop.id)}
          />

          {isVs && <span className="ld-vs">VS</span>}
        </div>
      </div>
    </div>
  )
})

function BestCard({ best, onImageError, onOpen }: { best: BestDrop; onImageError: () => void; onOpen: () => void }) {
  const { item, chance, player, avatarColor } = best
  return (
    <div
      key={best.key}
      className="ld-card ld-best"
      role="button"
      tabIndex={0}
      aria-label="Выбрать Best drop из каталога"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <svg className="ld-best__arrows" viewBox="0 0 60 90" fill="#FBD506" aria-hidden="true">
        <path d="M24 17 0-.6-24 17V.6L0-17 24 .6Z" transform="translate(30 30)" opacity="0.35" />
        <path d="M30 21 0-.8-30 21V.8L0-21 30 .8Z" transform="translate(30 60)" opacity="0.9" />
      </svg>

      <ChanceBadge chance={chance} side="best" />

      <div className="ld-info">
        <span className="ld-info__name">{item.name}</span>
        <span className="ld-info__type">{item.type}</span>
      </div>

      {/* при наведении: ник с аватаром снизу слева и цена сверху справа */}
      <div className="ld-hover-user">
        <span className="ld-hover-user__avatar" style={{ background: avatarColor }}>
          {player.charAt(0).toUpperCase()}
        </span>
        <span className="ld-hover-user__name ld-hover-user__name--best">{player}</span>
      </div>

      <div className="ld-best__price">
        <span className="ld-best__price-value">{item.price.toFixed(2)}</span>
        <img className="ld-best__price-coin" src="/profile-coin.png" alt="" draggable={false} />
      </div>

      <img className="ld-image" src={item.image} alt="" decoding="async" draggable={false} onError={onImageError} />
    </div>
  )
}

const PICKER_STEP = 60

function parseNum(v: string): number | null {
  const t = v.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// Окно выбора Best drop: затемнение + каталог по центру с фильтром по цене
function BestPicker({
  items,
  currentId,
  onPick,
  onClose,
}: {
  items: DropItem[]
  currentId: string
  onPick: (item: DropItem) => void
  onClose: () => void
}) {
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PICKER_STEP)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const lo = parseNum(min)
    const hi = parseNum(max)
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (lo !== null && i.price < lo) return false
      if (hi !== null && i.price > hi) return false
      if (q && !(`${i.name} ${i.type}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [items, min, max, query])

  const resetLimit = () => setLimit(PICKER_STEP)

  return createPortal(
    <div className="ld-modal" onClick={onClose}>
      <div className="ld-modal__dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="ld-modal__head">
          <span className="ld-modal__title">Best drop</span>
          <button type="button" className="ld-modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="ld-modal__filters">
          <input
            className="ld-modal__input"
            inputMode="decimal"
            placeholder="Мин. цена"
            value={min}
            onChange={(e) => {
              setMin(e.target.value)
              resetLimit()
            }}
          />
          <input
            className="ld-modal__input"
            inputMode="decimal"
            placeholder="Макс. цена"
            value={max}
            onChange={(e) => {
              setMax(e.target.value)
              resetLimit()
            }}
          />
          <input
            className="ld-modal__input ld-modal__input--wide"
            placeholder="Поиск по названию"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetLimit()
            }}
          />
        </div>

        <div className="ld-modal__count">Найдено: {filtered.length}</div>

        <div
          className="ld-modal__grid"
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
              setLimit((l) => (l < filtered.length ? l + PICKER_STEP : l))
            }
          }}
        >
          {filtered.slice(0, limit).map((item) => (
            <button
              type="button"
              key={item.id}
              className={`ld-pick${item.id === currentId ? ' ld-pick--current' : ''}`}
              style={{ '--drop-color': item.color } as CSSProperties}
              onClick={() => onPick(item)}
            >
              <img
                className="ld-pick__image"
                src={item.image}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={(e) => {
                  const card = e.currentTarget.closest('button')
                  if (card) card.style.display = 'none'
                }}
              />
              <span className="ld-pick__name">{item.name}</span>
              <span className="ld-pick__type">{item.type}</span>
              <span className="ld-pick__price">
                {item.price.toFixed(2)}
                <img className="ld-pick__coin" src="/profile-coin.png" alt="" draggable={false} />
              </span>
            </button>
          ))}
          {filtered.length === 0 && <div className="ld-modal__empty">Ничего не найдено</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function LiveDrops() {
  const { drops, best, removeDrop, bestImageFailed, pickBest, getAllItems } = useLiveDrops()
  const [pickerOpen, setPickerOpen] = useState(false)

  // каталог пуст или короткий: ничего не рендерим
  if (!best) return null

  return (
    <div className="ld-root">
      <BestCard key={best.key} best={best} onImageError={bestImageFailed} onOpen={() => setPickerOpen(true)} />
      <div className="ld-panel">
        <div className="ld-list" role="list" aria-label="Live drops">
          {drops.map((drop) => (
            <Row key={drop.id} drop={drop} onImageError={removeDrop} />
          ))}
        </div>
      </div>

      {pickerOpen && (
        <BestPicker
          items={getAllItems()}
          currentId={best.item.id}
          onPick={(item) => {
            pickBest(item)
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
