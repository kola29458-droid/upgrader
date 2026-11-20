import { playSound } from '../sound'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { isTargetAllowed } from '../upgraderMath'
import '../catalogLocks.css'

const PAGE_SIZE = 19
const ARROW_ICON = '/icons/arrow.svg'
const SEARCH_ICON = '/icons/search.svg'

type SortOrder = 'desc' | 'asc'

export type Skin = {
  id: string
  weapon: string
  name: string
  wear: string
  price: number
  image: string
  rarityColor: string
}

export function formatPrice(value: number) {
  return value
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/,/g, ' ')
    .replace('.', ',')
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : null
}

type SortButtonProps = {
  order: SortOrder
  onToggle: () => void
}

function SortButton({ order, onToggle }: SortButtonProps) {
  const upColor = order === 'asc' ? '#FFFFFF' : '#FFFFFF1A'
  const downColor = order === 'desc' ? '#FFFFFF' : '#FFFFFF1A'

  return (
    <button
      type="button"
      data-testid="sort-button"
      className="skin-sort-button"
      onClick={onToggle}
      aria-label={order === 'desc' ? 'Sort ascending' : 'Sort descending'}
    >
      <svg width="9" height="7" viewBox="0 0 9 7" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill={upColor} d="M0.256285 6.31334C0.397714 6.43814 0.572403 6.4994 0.746534 6.49997H8.25287C8.66542 6.49997 8.99998 6.16046 8.99998 5.74182C8.99998 5.55206 8.93011 5.3694 8.80377 5.22957L5.17107 0.77453C4.90861 0.452322 4.43821 0.407224 4.12069 0.67384C4.08883 0.700218 4.05976 0.729432 4.03321 0.759781L0.183335 5.24432C-0.0872241 5.55972 -0.0545222 6.0385 0.256285 6.31334Z" />
      </svg>
      <svg width="9" height="7" viewBox="0 0 9 7" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill={downColor} d="M8.7437 0.56163C8.60227 0.43683 8.42758 0.37557 8.25345 0.375H0.747112C0.334565 0.375 3.66e-08 0.71451 0 1.13315C-1.65e-08 1.32291 0.0698757 1.5056 0.19621 1.6454L3.82891 6.1004C4.09137 6.4227 4.56177 6.4677 4.87929 6.2011C4.91115 6.1748 4.94022 6.1455 4.96677 6.1152L8.81665 1.6306C9.0872 1.31525 9.0545 0.83647 8.7437 0.56163Z" />
      </svg>
    </button>
  )
}

type SkinFiltersProps = {
  from: string
  to: string
  name: string
  nameOpen: boolean
  onChangeFrom: (value: string) => void
  onChangeTo: (value: string) => void
  onChangeName: (value: string) => void
  onToggleName: () => void
}

function SkinFilters({
  from,
  to,
  name,
  nameOpen,
  onChangeFrom,
  onChangeTo,
  onChangeName,
  onToggleName,
}: SkinFiltersProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (nameOpen) nameInputRef.current?.focus()
  }, [nameOpen])

  return (
    <div className={`skin-filter${nameOpen ? ' skin-filter--name-open' : ''}`}>
      <div className="skin-filter__group">
        <label className="skin-filter__field skin-filter__field--from">
          <img src="/coins.png" alt="" draggable={false} />
          <input
            name="priceFrom"
            data-testid="shop-filters-price-from"
            placeholder="from"
            type="number"
            min="0"
            value={from}
            onChange={(event) => onChangeFrom(event.target.value)}
          />
        </label>

        <label className="skin-filter__field skin-filter__field--to">
          <img src="/coins.png" alt="" draggable={false} />
          <input
            name="priceTo"
            data-testid="shop-filters-price-to"
            placeholder="to"
            type="number"
            min="0"
            value={to}
            onChange={(event) => onChangeTo(event.target.value)}
          />
        </label>
      </div>

      <input
        ref={nameInputRef}
        name="itemName"
        data-testid="shop-filters-name"
        className="skin-filter__name"
        placeholder="Name"
        type="text"
        value={name}
        tabIndex={nameOpen ? 0 : -1}
        onChange={(event) => onChangeName(event.target.value)}
      />

      <button
        type="button"
        data-testid="shop-filters-toggle"
        className="skin-filter__search"
        data-tooltip="Search by name"
        onClick={onToggleName}
      >
        <img src={SEARCH_ICON} alt="Search" draggable={false} />
      </button>
    </div>
  )
}

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

function CatalogPagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <div className="catalog-pagination">
      <button
        type="button"
        data-testid="arrow-pagination-prev"
        className="catalog-arrow"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        <img alt="Previous" className="catalog-arrow__icon catalog-arrow__icon--prev" src={ARROW_ICON} draggable={false} />
      </button>

      <button
        type="button"
        data-testid="arrow-pagination-next"
        className="catalog-arrow"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        <img alt="Next" className="catalog-arrow__icon catalog-arrow__icon--next" src={ARROW_ICON} draggable={false} />
      </button>
    </div>
  )
}

type SkinCatalogProps = {
  selected: Skin | null
  onSelect: (skin: Skin | null) => void
  currentBet?: number
  lockAll?: boolean
}

export default function SkinCatalog({ selected, onSelect, currentBet = 0, lockAll = false }: SkinCatalogProps) {
  const [skins, setSkins] = useState<Skin[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [page, setPage] = useState(0)
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [nameOpen, setNameOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('/skins.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<Skin[]>
      })
      .then((data) => {
        if (cancelled) return
        setSkins(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredSkins = useMemo(() => {
    const min = parsePrice(priceFrom)
    const max = parsePrice(priceTo)
    const tokens = nameQuery.toLowerCase().split(/\s+/).filter(Boolean)

    return skins.filter((skin) => {
      if (min !== null && skin.price < min) return false
      if (max !== null && skin.price > max) return false
      if (tokens.length > 0) {
        const haystack = `${skin.weapon} ${skin.name}`.toLowerCase()
        if (!tokens.every((token) => haystack.includes(token))) return false
      }
      return true
    })
  }, [skins, priceFrom, priceTo, nameQuery])

  const sortedSkins = useMemo(
    () =>
      [...filteredSkins].sort((a, b) =>
        sortOrder === 'desc' ? b.price - a.price : a.price - b.price,
      ),
    [filteredSkins, sortOrder],
  )

  const totalPages = Math.max(1, Math.ceil(sortedSkins.length / PAGE_SIZE))

  const visible = useMemo(
    () => sortedSkins.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sortedSkins, page],
  )

  // Когда скин выбран снаружи (кнопки x2, x4, 25% и т.д.) и его не видно в каталоге,
// подставляем диапазон цен вокруг него (от дешёвых к дорогим) и показываем страницу со скином
useEffect(() => {
  if (!selected || status !== 'ready') return
  if (visible.some((skin) => skin.id === selected.id)) return

  let from = Math.floor(selected.price * 0.995)
  const to = Math.max(Math.round(selected.price * 1.1), Math.ceil(selected.price))

  const inRange = (min: number) =>
    skins
      .filter((skin) => skin.price >= min && skin.price <= to)
      .sort((a, b) => a.price - b.price)

  let list = inRange(from)
  let index = list.findIndex((skin) => skin.id === selected.id)

  // У дешёвых скинов цены очень плотные: поднимаем нижнюю границу, чтобы скин был на первой странице
  if (index >= PAGE_SIZE) {
    from = list[index - 10].price
    list = inRange(from)
    index = list.findIndex((skin) => skin.id === selected.id)
  }

  setNameQuery('')
  setNameOpen(false)
  setPriceFrom(String(from))
  setPriceTo(String(to))
  setSortOrder('asc')
  setPage(index > 0 ? Math.floor(index / PAGE_SIZE) : 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selected?.id, status])

  const toggleSort = () => {
    setSortOrder((current) => (current === 'desc' ? 'asc' : 'desc'))
    setPage(0)
  }

  const changePriceFrom = (value: string) => {
    setPriceFrom(value)
    setPage(0)
  }

  const changePriceTo = (value: string) => {
    setPriceTo(value)
    setPage(0)
  }

  const changeName = (value: string) => {
    setNameQuery(value)
    setPage(0)
  }

  const toggleName = () => {
    if (nameOpen) {
      setNameQuery('')
      setPage(0)
    }
    setNameOpen((current) => !current)
  }

  // Скин заблокирован, если при текущей сумме входа его шанс вне допустимых границ.
  // Уже выбранный скин не блокируется, чтобы его всегда можно было снять.
  const isLocked = (skin: Skin) =>
  selected?.id !== skin.id && (lockAll || !isTargetAllowed(currentBet, skin.price))

  const handleSelect = (skin: Skin) => {
  if (lockAll || isLocked(skin)) return
    playSound('click')
    onSelect(selected?.id === skin.id ? null : skin)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, skin: Skin) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect(skin)
    }
  }

  if (status === 'loading') {
    return <section className="skin-catalog"><div className="skin-catalog__message">Loading skins...</div></section>
  }

  if (status === 'error') {
    return (
      <section className="skin-catalog">
        <div className="skin-catalog__message">
          Не удалось загрузить /skins.json. Проверь, что файл лежит в папке public.
        </div>
      </section>
    )
  }

  return (
    <section className="skin-catalog" aria-label="Skins catalog">
      <SortButton order={sortOrder} onToggle={toggleSort} />

      <SkinFilters
        from={priceFrom}
        to={priceTo}
        name={nameQuery}
        nameOpen={nameOpen}
        onChangeFrom={changePriceFrom}
        onChangeTo={changePriceTo}
        onChangeName={changeName}
        onToggleName={toggleName}
      />

      {sortedSkins.length === 0 ? (
        <div className="skin-catalog__message">Скины не найдены</div>
      ) : (
        <div className="skin-grid">
          <div className="skin-grid__reserved" aria-hidden="true" />

          {visible.map((skin) => {
            const locked = isLocked(skin)

            return (
            <article
              key={skin.id}
              className={`skin-card${selected?.id === skin.id ? ' skin-card--selected' : ''}${locked ? ' skin-card--locked' : ''}`}
              style={{ '--rarity': skin.rarityColor } as CSSProperties}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-pressed={selected?.id === skin.id}
              aria-disabled={locked}
              onClick={() => handleSelect(skin)}
              onKeyDown={(event) => handleCardKeyDown(event, skin)}
            >
              <span className="skin-card__sel-bg" aria-hidden="true" />
              <span className="skin-card__sel-border" aria-hidden="true" />

              <div className="skin-card__top">
                <span className="skin-card__price">
                  {formatPrice(skin.price)}
                  <img src="/coins.png" alt="" draggable={false} />
                </span>
                {skin.wear && <span className="skin-card__wear">{skin.wear}</span>}
              </div>

              <img
                className="skin-card__image"
                src={skin.image}
                alt={`${skin.weapon} | ${skin.name}`}
                loading="lazy"
                decoding="async"
                draggable={false}
              />

              <span className="skin-card__mark" aria-hidden="true">
                <svg className="skin-card__mark-check" viewBox="0 0 24 24" fill="none">
                  <path d="M3.5 12.5L9.5 18.5L20.5 6.5" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg className="skin-card__mark-cross" viewBox="0 0 24 24" fill="none">
                  <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>

              {locked && (
                <span className="skin-card__lock" aria-hidden="true">
                  <svg viewBox="10 9 24 28.2" fill="none">
                    <path d="M16.5 19V16.8A5.5 5.5 0 0 1 27.5 16.8V19" stroke="currentColor" strokeWidth="2.7" />
                    <rect x="11.2" y="18.4" width="21.6" height="18.5" rx="4.8" fill="currentColor" />
                    <circle cx="22" cy="25.4" r="2.5" fill="#191918" />
                    <rect x="20.9" y="26.6" width="2.2" height="4" rx="1.1" fill="#191918" />
                  </svg>
                </span>
              )}

              <div className="skin-card__bottom">
                <span className="skin-card__weapon" title={skin.weapon}>{skin.weapon}</span>
                <span className="skin-card__name" title={skin.name}>{skin.name}</span>
              </div>
            </article>
            )
          })}
        </div>
      )}

      <CatalogPagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  )
}