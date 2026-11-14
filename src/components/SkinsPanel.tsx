import { playSound } from '../sound'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { formatPrice } from './SkinCatalog'
import { getMaxBet } from '../upgraderMath'
import LockIcon from './LockIcon'
import type { Skin } from './SkinCatalog'
import { useSkins } from '../hooks/useSkins'
import type { OwnedSkin } from '../hooks/useInventory'

const PER_PAGE = 20
const MAX_CART = 50
const MAX_SELECT = 6
const ARROW_ICON = 'https://s3.upgrader.pro/cdn/fa/icons/arrow.svg'
const SEARCH_ICON = 'https://s3.upgrader.pro/cdn/fa/icons/search.svg'

type Tab = 'mine' | 'shop'
type SortOrder = 'asc' | 'desc'
type CartEntry = { skin: Skin; qty: number }

const toCents = (value: number) => Math.round(value * 100)

function parsePrice(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : null
}

function KnifeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path
        d="M14.9688 13.6426C14.7316 13.5188 14.5038 13.381 14.3101 13.1936C13.8269 12.7266 13.5882 12.167 13.6802 11.4871C13.7264 11.1461 13.8822 10.848 14.0663 10.5633C14.0941 10.5206 14.1184 10.4749 14.1512 10.4362C14.2496 10.3197 14.2991 10.1852 14.3356 10.0374C14.4892 9.41452 14.1546 8.82335 13.5397 8.64715C13.3538 8.59396 13.3404 8.56879 13.4005 8.39122C13.6108 7.77173 13.2378 6.97017 12.6323 6.73266C12.5402 6.69656 12.4457 6.67272 12.3517 6.64457C12.2141 6.6035 12.1986 6.57734 12.2339 6.43876C12.3484 5.98839 12.2783 5.58049 11.9505 5.2381C11.6286 4.90168 11.2281 4.80494 10.7868 4.91104C10.4145 5.00055 10.0519 5.12881 9.71324 5.31337C9.37057 5.50005 9.38787 5.43786 9.22647 5.19183C9.19118 5.13797 9.15481 5.08423 9.12426 5.02763C9.06035 4.90921 9.0559 4.79214 9.15503 4.6895C9.1932 4.65004 9.18664 4.62502 9.15416 4.58819C8.31505 3.63678 7.36374 2.83759 6.17167 2.36064C5.14073 1.94822 4.06799 1.81768 2.96549 1.8697C2.18563 1.90644 1.43121 2.08175 0.67956 2.27662C0.45362 2.33513 0.226338 2.38926 -0.000244141 2.44549C0.0276812 2.42146 0.0537781 2.39483 0.0834809 2.37361C1.42692 1.41768 2.89746 0.736653 4.49119 0.326318C5.51532 0.0627867 6.55126 0.0216991 7.59517 0.182786C7.7722 0.210126 7.94916 0.23767 8.12636 0.265061C8.44734 0.351068 8.76834 0.437076 9.08932 0.523093C9.11624 0.536646 9.14195 0.5539 9.17018 0.563364C9.78259 0.767205 10.3679 1.03168 10.9305 1.34737C11.0071 1.3903 11.0853 1.46625 11.1613 1.46419C11.2455 1.46201 11.2945 1.34996 11.3644 1.29213C11.3722 1.28576 11.3787 1.27779 11.3863 1.27093C11.4244 1.23547 11.467 1.23274 11.5058 1.26511C11.62 1.3602 11.7432 1.44756 11.8055 1.59112C11.8625 1.72249 11.9355 1.84462 12.0207 1.95961C12.0513 2.00101 12.079 2.0444 12.0537 2.10023C12.0268 2.16003 12.0516 2.16984 12.108 2.1636C12.1829 2.15534 12.2071 2.1948 12.1821 2.26425C12.1585 2.3296 12.1614 2.36293 12.2474 2.34157C12.3115 2.32556 12.3533 2.37862 12.3228 2.43792C12.2732 2.53521 12.304 2.53774 12.3911 2.5152C12.449 2.50027 12.4895 2.54134 12.4627 2.59827C12.4089 2.71303 12.4636 2.70082 12.5446 2.68447C12.602 2.67301 12.6449 2.70733 12.6172 2.76568C12.5647 2.87679 12.6023 2.8767 12.6942 2.84617C12.7542 2.82626 12.7864 2.86938 12.7662 2.93227C12.7406 3.0119 12.7602 3.03387 12.8453 3.01288C12.9147 2.99595 12.9482 3.01338 12.9251 3.08756C12.917 3.11433 12.9016 3.13474 12.9267 3.1603C12.9539 3.18808 12.9777 3.1784 13.0083 3.16547C13.0815 3.13454 13.1017 3.1685 13.0887 3.23818C13.0734 3.32055 13.0944 3.33907 13.1757 3.3101C13.204 3.29996 13.2281 3.29454 13.2503 3.31615C13.2671 3.33252 13.284 3.35244 13.2701 3.37898C13.2571 3.40383 13.221 3.42524 13.259 3.45592C13.2901 3.48119 13.3182 3.46885 13.3518 3.4516C13.405 3.42442 13.4412 3.44788 13.4312 3.50801C13.4136 3.61387 13.4592 3.61465 13.5391 3.58744C13.5941 3.56855 13.6367 3.58503 13.6194 3.65654C13.6001 3.73657 13.6381 3.7563 13.6985 3.72214C13.7701 3.68128 13.8034 3.70311 13.8289 3.77103C13.8418 3.80557 13.8574 3.85034 13.9058 3.83224C14.0246 3.78817 14.0928 3.86247 14.1553 3.93841C14.3063 4.12161 14.4535 4.30783 14.6006 4.4942C15.3945 5.49903 16.1534 6.52791 16.7714 7.65437C16.8238 7.74981 16.8428 7.82258 16.7389 7.89815C16.6686 7.94929 16.6911 8.034 16.774 8.05959C16.8158 8.07249 16.8599 8.0788 16.9033 8.08662C16.99 8.10248 17.0566 8.14886 17.0837 8.23265C17.1101 8.31461 17.0514 8.36484 16.9941 8.41039C16.9666 8.43239 16.9438 8.45442 16.958 8.49585C16.9716 8.53564 17.0027 8.54293 17.0371 8.54794C17.0639 8.55173 17.0919 8.55118 17.1173 8.55927C17.2103 8.58819 17.2967 8.62807 17.3226 8.73522C17.3458 8.83173 17.2911 8.88857 17.2166 8.93394C17.1982 8.94529 17.186 8.96254 17.1909 8.985C17.1979 9.01691 17.2243 9.02586 17.2524 9.02853C17.3364 9.03666 17.408 9.07425 17.4721 9.12565C17.5509 9.18908 17.5609 9.28161 17.5131 9.36078C17.4819 9.41228 17.3862 9.42961 17.4061 9.49223C17.4236 9.5475 17.5131 9.52598 17.5676 9.55454C17.7462 9.64825 17.7835 9.77481 17.6603 9.92084C17.6046 9.98692 17.6263 10.0057 17.6984 10.0262C17.8959 10.0827 18.0445 10.3717 17.9874 10.5727C17.9722 10.6261 17.9356 10.6582 17.8951 10.6896C17.8073 10.7577 17.7066 10.8032 17.6006 10.8533C17.7392 11.0295 17.792 11.2259 17.7927 11.4389L17.7239 11.6953C17.7005 11.7083 17.6967 11.7331 17.6888 11.7551C17.5229 12.2127 17.3796 12.6769 17.2481 13.1455C17.1917 13.3468 17.1828 13.555 17.1296 13.7554C17.0858 13.9196 17.0189 13.9492 16.8715 13.8708C16.6896 13.774 16.4962 13.7155 16.291 13.7002C15.9734 13.6766 15.6618 13.7919 15.343 13.7424L14.9688 13.6426ZM15.2233 13.0993C15.4593 13.1695 15.6943 13.157 15.9207 13.066C16.3763 12.883 16.743 12.583 16.979 12.1519C17.4134 11.3586 17.0634 10.3691 15.9472 10.2962C15.1724 10.2455 14.3957 10.9372 14.31 11.7109C14.2392 12.3486 14.6261 12.9367 15.2233 13.0993Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ShopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M13.9869 4.70663L13.195 1.53737C13.0979 1.148 12.7479 0.875 12.3462 0.875H1.65463C1.253 0.875 0.903 1.148 0.805 1.53737L0.013125 4.70663C0.004375 4.74075 0 4.77662 0 4.8125C0 6.01825 0.931875 7 2.07812 7C2.744 7 3.33812 6.66838 3.71875 6.15387C4.09937 6.66838 4.6935 7 5.35938 7C6.02525 7 6.61938 6.66838 7 6.15387C7.38062 6.66838 7.97388 7 8.64062 7C9.30737 7 9.90063 6.66838 10.2812 6.15387C10.6619 6.66838 11.2551 7 11.9219 7C13.0681 7 14 6.01825 14 4.8125C14 4.77662 13.9956 4.74075 13.9869 4.70663Z"
        fill="currentColor"
      />
      <path
        d="M11.9219 7.87461C11.326 7.87461 10.7599 7.69261 10.2812 7.36011C9.324 8.02598 7.95725 8.02598 7 7.36011C6.04275 8.02598 4.676 8.02598 3.71875 7.36011C3.24012 7.69261 2.674 7.87461 2.07812 7.87461C1.6485 7.87461 1.24338 7.77398 0.875 7.60248V12.2496C0.875 12.7326 1.267 13.1246 1.75 13.1246H5.25V9.62461H8.75V13.1246H12.25C12.733 13.1246 13.125 12.7326 13.125 12.2496V7.60248C12.7566 7.77398 12.3515 7.87461 11.9219 7.87461Z"
        fill="currentColor"
      />
    </svg>
  )
}

function SortButton({ order, onToggle }: { order: SortOrder; onToggle: () => void }) {
  const upColor = order === 'asc' ? '#FFFFFF' : '#FFFFFF33'
  const downColor = order === 'desc' ? '#FFFFFF' : '#FFFFFF33'

  return (
    <button
      type="button"
      className="sp-sort"
      onClick={onToggle}
      aria-label={order === 'desc' ? 'Sort ascending' : 'Sort descending'}
    >
      <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden="true">
        <path fill={upColor} d="M0.256285 6.31334C0.397714 6.43814 0.572403 6.4994 0.746534 6.49997H8.25287C8.66542 6.49997 8.99998 6.16046 8.99998 5.74182C8.99998 5.55206 8.93011 5.3694 8.80377 5.22957L5.17107 0.77453C4.90861 0.452322 4.43821 0.407224 4.12069 0.67384C4.08883 0.700218 4.05976 0.729432 4.03321 0.759781L0.183335 5.24432C-0.0872241 5.55972 -0.0545222 6.0385 0.256285 6.31334Z" />
      </svg>
      <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden="true">
        <path fill={downColor} d="M8.7437 0.56163C8.60227 0.43683 8.42758 0.37557 8.25345 0.375H0.747112C0.334565 0.375 3.66e-08 0.71451 0 1.13315C-1.65e-08 1.32291 0.0698757 1.5056 0.19621 1.6454L3.82891 6.1004C4.09137 6.4227 4.56177 6.4677 4.87929 6.2011C4.91115 6.1748 4.94022 6.1455 4.96677 6.1152L8.81665 1.6306C9.0872 1.31525 9.0545 0.83647 8.7437 0.56163Z" />
      </svg>
    </button>
  )
}

type ArrowsProps = {
  page: number
  pages: number
  onChange: (page: number) => void
}

function Arrows({ page, pages, onChange }: ArrowsProps) {
  return (
    <div className="sp-arrows">
      <button
        type="button"
        className="sp-arrow"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <img className="sp-arrow__icon sp-arrow__icon--prev" src={ARROW_ICON} alt="" draggable={false} />
      </button>
      <button
        type="button"
        className="sp-arrow"
        disabled={page >= pages - 1}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <img className="sp-arrow__icon sp-arrow__icon--next" src={ARROW_ICON} alt="" draggable={false} />
      </button>
    </div>
  )
}

type TileProps = {
  skin: Skin | OwnedSkin
  isSelected?: boolean
  qty?: number
  onPick?: () => void
  onInc?: () => void
  onDec?: () => void
  canInc?: boolean
  locked?: boolean
}

function SkinTile({ skin, isSelected, qty, onPick, onInc, onDec, canInc = true, locked = false }: TileProps) {
  const isShop = Boolean(onInc)
  const inCart = qty !== undefined
  const clickable = Boolean(onPick)

  const lastQty = useRef(1)
  if (qty !== undefined) lastQty.current = qty

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onPick || locked) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPick()
    }
  }

  return (
    <article
      className={`skin-card${inCart || isSelected ? ' skin-card--selected' : ''}${clickable ? '' : ' sp-tile--static'}${isShop ? ' sp-shop-tile' : ''}${locked ? ' skin-card--locked' : ''}`}
      style={{ '--rarity': skin.rarityColor } as CSSProperties}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !locked ? 0 : undefined}
      aria-disabled={locked || undefined}
      onClick={locked ? undefined : onPick}
      onKeyDown={handleKeyDown}
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

      {isShop && (
        <div
          className={`sp-qty${inCart ? ' sp-qty--show' : ''}`}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={onDec} aria-label="Decrease">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M6 12h12" />
            </svg>
          </button>
          <span>{qty ?? lastQty.current}</span>
          <button type="button" onClick={onInc} disabled={!canInc} aria-label="Increase">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M12 6v12M6 12h12" />
            </svg>
          </button>
        </div>
      )}

      {!inCart && (
        <span className="skin-card__mark" aria-hidden="true">
          <svg className="skin-card__mark-check" viewBox="0 0 24 24" fill="none">
            <path d="M3.5 12.5L9.5 18.5L20.5 6.5" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg className="skin-card__mark-cross" viewBox="0 0 24 24" fill="none">
            <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      )}

      {locked && <LockIcon />}

      <div className="skin-card__bottom">
        <span className="skin-card__weapon" title={skin.weapon}>{skin.weapon}</span>
        <span className="skin-card__name" title={skin.name}>{skin.name}</span>
      </div>
    </article>
  )
}

type SkinsPanelProps = {
  inventory: OwnedSkin[]
  onBuy: (skins: Skin[]) => boolean
  balance: number
  currentBet?: number
  targetPrice?: number
  onSelectionChange?: (skins: OwnedSkin[], bet: number) => void
  onSkinsLoaded?: (skins: Skin[]) => void
  locked?: boolean                                  // идёт крутка: ничего нельзя менять
  clearSelectionKey?: number                        // при изменении числа выбор слева сбрасывается
  selectRequest?: { uid: string; nonce: number } | null // выбрать скин из инвентаря (Add to upgrade)
}

export default function SkinsPanel({
  inventory = [],
  onBuy,
  balance,
  targetPrice,
  onSelectionChange,
  onSkinsLoaded,
  locked = false,
  clearSelectionKey = 0,
  selectRequest = null,
}: SkinsPanelProps) {
  const { skins, status } = useSkins()
  const safeInventory = Array.isArray(inventory) ? inventory : []

  // Во время крутки баланс «замораживаем», чтобы выбор слева не менялся из-за списания ставки
  const frozenBalance = useRef(balance)
  if (!locked) frozenBalance.current = balance
  const usableBalance = locked ? frozenBalance.current : balance

  const [tab, setTab] = useState<Tab>('mine')
  const [mineSort, setMineSort] = useState<SortOrder>('desc')
  const [shopSort, setShopSort] = useState<SortOrder>('asc')
  const [minePage, setMinePage] = useState(0)
  const [shopPage, setShopPage] = useState(0)
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [nameOpen, setNameOpen] = useState(false)
  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const [buyFailed, setBuyFailed] = useState(false)

  const [selectedMine, setSelectedMine] = useState<OwnedSkin[]>([])
  const [bet, setBet] = useState(0)

  const failTimer = useRef<number | undefined>(undefined)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Когда скин снят (любым способом), ставка с баланса сбрасывается на ноль
  const prevSelectedCount = useRef(0)
  useEffect(() => {
    if (selectedMine.length < prevSelectedCount.current) setBet(0)
    prevSelectedCount.current = selectedMine.length
  }, [selectedMine.length])

  useEffect(() => {
    if (nameOpen) nameInputRef.current?.focus()
  }, [nameOpen])

  useEffect(() => () => window.clearTimeout(failTimer.current), [])

  useEffect(() => {
    if (status === 'ready' && skins.length > 0) {
      onSkinsLoaded?.(skins)
    }
  }, [status, skins, onSkinsLoaded])

  const mineSorted = useMemo(
    () =>
      [...safeInventory].sort((a, b) =>
        mineSort === 'desc' ? b.price - a.price : a.price - b.price,
      ),
    [safeInventory, mineSort],
  )

  const mineTotalCents = useMemo(
    () => safeInventory.reduce((sum, item) => sum + toCents(item.price), 0),
    [safeInventory],
  )

  const minePages = Math.max(1, Math.ceil(mineSorted.length / PER_PAGE))
  const safeMinePage = Math.min(minePage, minePages - 1)
  const mineVisible = mineSorted.slice(safeMinePage * PER_PAGE, (safeMinePage + 1) * PER_PAGE)

  const shopList = useMemo(() => {
    const min = parsePrice(priceFrom)
    const max = parsePrice(priceTo)
    const tokens = nameQuery.toLowerCase().split(/\s+/).filter(Boolean)

    const list = skins.filter((skin) => {
      if (min !== null && skin.price < min) return false
      if (max !== null && skin.price > max) return false
      if (tokens.length > 0) {
        const haystack = `${skin.weapon} ${skin.name}`.toLowerCase()
        if (!tokens.every((token) => haystack.includes(token))) return false
      }
      return true
    })

    list.sort((a, b) => (shopSort === 'desc' ? b.price - a.price : a.price - b.price))
    return list
  }, [skins, priceFrom, priceTo, nameQuery, shopSort])

  const shopPages = Math.max(1, Math.ceil(shopList.length / PER_PAGE))
  const safeShopPage = Math.min(shopPage, shopPages - 1)
  const shopVisible = shopList.slice(safeShopPage * PER_PAGE, (safeShopPage + 1) * PER_PAGE)

  const cartEntries = Object.values(cart)
  const cartCount = cartEntries.reduce((sum, entry) => sum + entry.qty, 0)
  const cartTotalCents = cartEntries.reduce(
    (sum, entry) => sum + toCents(entry.skin.price) * entry.qty,
    0,
  )
  const cartFull = cartCount >= MAX_CART

  const lastCart = useRef({ count: 0, total: 0 })
  if (cartCount > 0) lastCart.current = { count: cartCount, total: cartTotalCents }
  const shownCount = cartCount > 0 ? cartCount : lastCart.current.count
  const shownTotal = cartCount > 0 ? cartTotalCents : lastCart.current.total

  const addToCart = (skin: Skin) => {
    if (locked) return
    setCart((current) => {
      if (current[skin.id]) return current
      const count = Object.values(current).reduce((sum, entry) => sum + entry.qty, 0)
      if (count >= MAX_CART) return current
      return { ...current, [skin.id]: { skin, qty: 1 } }
    })
  }

  const changeQty = (skin: Skin, delta: number) => {
    if (locked) return
    setCart((current) => {
      const entry = current[skin.id]
      if (!entry) return current

      const next = entry.qty + delta
      if (next <= 0) {
        const copy = { ...current }
        delete copy[skin.id]
        return copy
      }

      if (delta > 0) {
        const count = Object.values(current).reduce((sum, item) => sum + item.qty, 0)
        if (count >= MAX_CART) return current
      }

      return { ...current, [skin.id]: { ...entry, qty: next } }
    })
  }

  const clearCart = () => {
    if (!locked) setCart({})
  }

  const handleBuy = () => {
    if (cartCount === 0 || locked) return

    const toBuy: Skin[] = []
    cartEntries.forEach(({ skin, qty }) => {
      for (let i = 0; i < qty; i += 1) toBuy.push(skin)
    })

    if (onBuy(toBuy)) {
      setCart({})
      setTab('mine')
      setMinePage(0)
      return
    }

    setBuyFailed(true)
    window.clearTimeout(failTimer.current)
    failTimer.current = window.setTimeout(() => setBuyFailed(false), 450)
  }

  const changeFrom = (value: string) => {
    setPriceFrom(value)
    setShopPage(0)
  }

  const changeTo = (value: string) => {
    setPriceTo(value)
    setShopPage(0)
  }

  const changeName = (value: string) => {
    setNameQuery(value)
    setShopPage(0)
  }

  const toggleName = () => {
    if (nameOpen) {
      setNameQuery('')
      setShopPage(0)
    }
    setNameOpen((current) => !current)
  }

  // Сброс выбора слева (после крутки)
  const lastClearKey = useRef(clearSelectionKey)
  useEffect(() => {
    if (clearSelectionKey === lastClearKey.current) return
    lastClearKey.current = clearSelectionKey
    setSelectedMine([])
    setBet(0)
  }, [clearSelectionKey])

  // Выбрать скин из инвентаря по запросу (кнопка Add to upgrade)
  const lastSelectNonce = useRef(0)
  useEffect(() => {
    if (!selectRequest || selectRequest.nonce === lastSelectNonce.current) return
    const item = safeInventory.find((s) => s.uid === selectRequest.uid)
    if (!item) return
    lastSelectNonce.current = selectRequest.nonce
    setTab('mine')
    setSelectedMine((prev) =>
      prev.some((s) => s.uid === item.uid) || prev.length >= MAX_SELECT ? prev : [...prev, item],
    )
  }, [selectRequest, safeInventory])

  const handleToggleMineSkin = (item: OwnedSkin) => {
    if (locked) return
    playSound('click')
    setSelectedMine((prev) => {
      if (prev.some((s) => s.uid === item.uid)) {
        return prev.filter((s) => s.uid !== item.uid)
      }
      if (prev.length >= MAX_SELECT) return prev
      return [...prev, item]
    })
  }

  const removeSelected = (uid: OwnedSkin['uid']) => {
    if (locked) return
    setSelectedMine((prev) => prev.filter((s) => s.uid !== uid))
  }

  const selectedTotalCents = selectedMine.reduce((sum, s) => sum + toCents(s.price), 0)
  // Максимум ставки: ограничен балансом и потолком шанса (MAX_CHANCE) для выбранной цели
  const maxBet = getMaxBet(usableBalance, selectedTotalCents / 100, targetPrice)
  const effectiveBet = selectedMine.length > 0 ? Math.min(bet, maxBet) : 0
  const showBetCell = effectiveBet > 0 && selectedMine.length < MAX_SELECT

  useEffect(() => {
    onSelectionChange?.(selectedMine, effectiveBet)
  }, [selectedMine, effectiveBet]) // eslint-disable-line react-hooks/exhaustive-deps

  const showSingle = selectedMine.length === 1 && effectiveBet === 0
  const showMulti = selectedMine.length > 1 || (selectedMine.length === 1 && effectiveBet > 0)
  const gridItems = selectedMine.length + (showBetCell ? 1 : 0)

  const hasSkins = safeInventory.length > 0
  const solid = tab === 'shop' || hasSkins

  return (
    <>
      {showSingle && (
        <div
          className="selected-skin-panel"
          style={{ '--rarity': selectedMine[0].rarityColor, left: '477px', top: '100px' } as CSSProperties}
        >
          <button
            type="button"
            className="selected-skin-panel__close"
            onClick={() => {
              if (!locked) setSelectedMine([])
            }}
            aria-label="Remove selected skin"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>

          <span className="selected-skin-panel__weapon">{selectedMine[0].weapon}</span>
          <span className="selected-skin-panel__name">{selectedMine[0].name}</span>

          <img
            className="selected-skin-panel__image"
            src={selectedMine[0].image}
            alt={`${selectedMine[0].weapon} | ${selectedMine[0].name}`}
            draggable={false}
          />

          <span className="selected-skin-panel__price">
            {formatPrice(selectedMine[0].price)}
            <img src="/coins.png" alt="" draggable={false} />
          </span>
        </div>
      )}

      {showMulti && (
        <div className="multi-panel" style={{ left: '477px', top: '100px' } as CSSProperties}>
          <div
            className="multi-panel__grid"
            style={{ '--cols': Math.min(gridItems, 3) } as CSSProperties}
          >
            {selectedMine.map((item) => (
              <article
                key={item.uid}
                className="skin-card multi-panel__card"
                style={{ '--rarity': item.rarityColor } as CSSProperties}
                onClick={() => removeSelected(item.uid)}
              >
                <div className="skin-card__top">
                  <span className="skin-card__price">
                    {formatPrice(item.price)}
                    <img src="/coins.png" alt="" draggable={false} />
                  </span>
                </div>

                <img
                  className="skin-card__image"
                  src={item.image}
                  alt={`${item.weapon} | ${item.name}`}
                  draggable={false}
                />

                <div className="skin-card__bottom">
                  <span className="skin-card__weapon">{item.weapon}</span>
                  <span className="skin-card__name">{item.name}</span>
                </div>
              </article>
            ))}

            {showBetCell && (
              <div className="multi-panel__bet">
                <span className="multi-panel__bet-title">Bet</span>
                <span className="multi-panel__bet-value">
                  {formatPrice(effectiveBet)}
                  <img src="/coins.png" alt="" draggable={false} />
                </span>
              </div>
            )}
          </div>

          <span className="selected-skin-panel__price multi-panel__total">
            {formatPrice((selectedTotalCents + toCents(effectiveBet)) / 100)}
            <img src="/coins.png" alt="" draggable={false} />
          </span>
        </div>
      )}

      <div
        className={`balance-block${selectedMine.length === 0 || locked ? ' balance-block--disabled' : ''}`}
        style={{ left: '477px', top: '460px' } as CSSProperties}
      >
        <div className="balance-block__row">
          <span className="balance-block__label">Balance amount:</span>
          <div className="balance-block__right">
            <span className="balance-block__value">
              {Number(effectiveBet.toFixed(2))}
              <img src="/coins.png" alt="" draggable={false} />
            </span>
            <span className="balance-block__max">(max {formatPrice(selectedMine.length > 0 && !locked ? maxBet : 0)})</span>
          </div>
        </div>

        <input
          type="range"
          className={`custom-range${effectiveBet === 0 ? ' custom-range--zero' : ''}`}
          min="0"
          max={maxBet}
          step="0.01"
          value={effectiveBet}
          disabled={selectedMine.length === 0 || locked}
          onChange={(event) => setBet(Number(event.target.value))}
          style={{ '--range-progress': `${maxBet > 0 ? (effectiveBet / maxBet) * 100 : 0}%` } as CSSProperties}
        />
      </div>

      <div className={`skins-panel${solid ? ' skins-panel--solid' : ''}`}>
        <div className="sp-header">
          <div className="sp-tabs">
            <button
              type="button"
              className={`sp-tab${tab === 'mine' ? ' sp-tab--active' : ''}`}
              onClick={() => setTab('mine')}
              aria-label="My skins"
            >
              <KnifeIcon />
            </button>
            <button
              type="button"
              className={`sp-tab${tab === 'shop' ? ' sp-tab--active' : ''}`}
              onClick={() => setTab('shop')}
              aria-label="Shop"
            >
              <ShopIcon />
            </button>
          </div>

          <span className="sp-title">{tab === 'mine' ? 'My skins' : 'Shop'}</span>

          {tab === 'mine' && hasSkins && (
            <>
              <div className="sp-push">
                <SortButton
                  order={mineSort}
                  onToggle={() => {
                    setMineSort((current) => (current === 'desc' ? 'asc' : 'desc'))
                    setMinePage(0)
                  }}
                />
              </div>
              <div className="sp-total">
                <span>Skins total</span>
                <b>{formatPrice(mineTotalCents / 100)}</b>
                <img src="/coins.png" alt="" draggable={false} />
              </div>
            </>
          )}

          {tab === 'shop' && (
            <>
              <SortButton
                order={shopSort}
                onToggle={() => {
                  setShopSort((current) => (current === 'desc' ? 'asc' : 'desc'))
                  setShopPage(0)
                }}
              />

              <div className={`sp-filter${nameOpen ? ' sp-filter--open' : ''}`}>
                <div className="sp-price">Price</div>

                <div className="sp-range">
                  <label className="sp-field sp-field--from">
                    <img src="/coins.png" alt="" draggable={false} />
                    <input
                      name="priceFrom"
                      placeholder="from"
                      type="number"
                      min="0"
                      value={priceFrom}
                      onChange={(event) => changeFrom(event.target.value)}
                    />
                  </label>
                  <label className="sp-field sp-field--to">
                    <img src="/coins.png" alt="" draggable={false} />
                    <input
                      name="priceTo"
                      placeholder="to"
                      type="number"
                      min="0"
                      value={priceTo}
                      onChange={(event) => changeTo(event.target.value)}
                    />
                  </label>
                </div>

                <input
                  ref={nameInputRef}
                  name="itemName"
                  className="sp-name"
                  placeholder="Name"
                  type="text"
                  value={nameQuery}
                  tabIndex={nameOpen ? 0 : -1}
                  onChange={(event) => changeName(event.target.value)}
                />

                <button type="button" className="sp-search" onClick={toggleName} aria-label="Search">
                  <img src={SEARCH_ICON} alt="" draggable={false} />
                </button>
              </div>

              <div className="sp-cart-btn" aria-label="Cart">
                <img src="https://s3.upgrader.pro/cdn/fa/icons/black-shop.svg" alt="" draggable={false} />
                <span className="sp-badge">{cartCount}</span>
              </div>
            </>
          )}
        </div>

        {tab === 'mine' && !hasSkins && (
          <button
            type="button"
            className="sp-empty-shop"
            onClick={() => setTab('shop')}
            aria-label="Open shop"
          />
        )}

        {tab === 'mine' && hasSkins && (
          <>
            <div className="sp-grid">
              {Array.from({ length: PER_PAGE }, (_, index) => {
                const item = mineVisible[index]
                return item ? (
                  <SkinTile
                    key={item.uid}
                    skin={item}
                    isSelected={selectedMine.some((s) => s.uid === item.uid)}
                    onPick={() => handleToggleMineSkin(item)}
                    locked={locked}
                  />
                ) : (
                  <div key={`empty-${index}`} className="sp-empty" />
                )
              })}
            </div>

            {minePages > 1 && (
              <div className="sp-bottom">
                <Arrows page={safeMinePage} pages={minePages} onChange={setMinePage} />
              </div>
            )}
          </>
        )}

        {tab === 'shop' && (
          <>
            {status === 'loading' && <div className="sp-message">Loading skins...</div>}
            {status === 'error' && (
              <div className="sp-message">Не удалось загрузить /skins.json. Проверь, что файл лежит в папке public.</div>
            )}
            {status === 'ready' && shopList.length === 0 && (
              <div className="sp-message">Скины не найдены</div>
            )}

            {status === 'ready' && shopList.length > 0 && (
              <div className="sp-grid">
                {shopVisible.map((skin) => (
                  <SkinTile
                    key={skin.id}
                    skin={skin}
                    qty={cart[skin.id]?.qty}
                    onPick={() => addToCart(skin)}
                    onInc={() => changeQty(skin, 1)}
                    onDec={() => changeQty(skin, -1)}
                    canInc={!cartFull}
                    locked={locked}
                  />
                ))}
              </div>
            )}

            <div className={`sp-bottom sp-bottom--shop${cartCount > 0 ? ' sp-bottom--cart' : ''}`}>
              <div className="sp-arrows-wrap">
                <Arrows page={safeShopPage} pages={shopPages} onChange={setShopPage} />
              </div>

              <div className="sp-cart-actions">
                <button type="button" className="sp-trash" onClick={clearCart} aria-label="Clear cart">
                  <img src="https://s3.upgrader.pro/cdn/fa/icons/trash.svg" alt="" draggable={false} />
                </button>
                <button
                  type="button"
                  className={`sp-buy${buyFailed ? ' sp-buy--fail' : ''}`}
                  onClick={handleBuy}
                  disabled={locked}
                  aria-label="Buy"
                >
                  <span className="sp-buy__price">
                    <img src="https://s3.upgrader.pro/cdn/fa/icons/coins-black.svg" alt="" draggable={false} />
                    <span className="sp-buy__amount">{formatPrice(shownTotal / 100)}</span>
                  </span>
                  <img
                    className="sp-buy__shop"
                    src="https://s3.upgrader.pro/cdn/fa/icons/black-shop.svg"
                    alt=""
                    draggable={false}
                  />
                  <span className="sp-badge">{shownCount}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}