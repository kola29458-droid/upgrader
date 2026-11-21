import { useCallback, useEffect, useRef, useState } from 'react'
import { loadCatalog } from '../liveDropsCatalog'
import type { DropItem } from '../liveDropsCatalog'

// ==========================================
// НАСТРОЙКИ (всё в одном месте)
// ==========================================
export const LIVE_DROPS = {
  DROP_INTERVAL_MIN_MS: 900, // минимальная пауза между выпадениями
  DROP_INTERVAL_MAX_MS: 1100, // максимальная пауза между выпадениями
  MAX_ROWS: 14, // сколько строк максимум держим в ленте
  INITIAL_DROPS: 14, // сколько строк есть сразу при загрузке
  PRICE_WEIGHT_POWER: 0.8, // вес предмета = 1 / цена^степень (дешёвые чаще)
  FEED_MIN_PERCENTILE: 0.1, // нижняя граница цены ленты (перцентиль каталога)
  FEED_MAX_PERCENTILE: 0.85, // верхняя граница цены ленты (перцентиль каталога)
  FEED_MAX_BEST_SHARE: 0.5, // лента не дороже этой доли цены Best drop
  KNIFE_GLOVE_MAX_SHARE: 0.08, // максимальная доля ножей и перчаток в ленте
  RECENT_NO_REPEAT: 10, // не повторять предмет среди последних N строк
  CHANCE_MIN: 10, // минимальный шанс строки, %
  CHANCE_MAX: 85, // максимальный шанс строки, %
  VS_SHARE: 0.1, // доля строк с меткой VS
  BEST_START_MIN_PERCENTILE: 0.8, // старт Best drop: от этого перцентиля цены
  BEST_START_MAX_PERCENTILE: 0.95, // старт Best drop: до этого перцентиля цены
  BEST_STEP_COUNT: 3, // новый Best drop выбирается из N следующих по цене
  BEST_REFRESH_MS: 120000, // как часто проверять замену Best drop (2 минуты)
  BEST_UPGRADE_CHANCE: 0.4, // вероятность замены при проверке
  BEST_CHANCE_MIN: 0.5, // шанс на Best drop от, %
  BEST_CHANCE_MAX: 80, // шанс на Best drop до, % (разброс как в оригинале: 5%, 53%, 78%...)
  BEST_ROW_CHANCE_MIN: 0.3, // шанс строки, в которую превращается новый Best drop, от %
  BEST_ROW_CHANCE_MAX: 80, // то же, до %
  DEBUG_FAST_BEST: false, // true: проверка раз в 10 секунд и замена всегда (для теста)
}

export type LiveDrop = {
  id: string
  item: DropItem
  chance: number
  player: string
  avatarColor: string
  isVs: boolean
  isNew: boolean // добавлена после старта (для анимации въезда)
}

export type BestDrop = {
  key: string
  item: DropItem
  chance: number
  player: string
  avatarColor: string
}

// ~40 вымышленных ников
const NICKNAMES = [
  'Nordik', 'Vasyl_K', 'ShadowFox', 'Mriya', 'Kozak77', 'BlueRaven', 'Lemur', 'Dnipro',
  'IronMoth', 'Zirka', 'Tarantino', 'Borsch', 'NeonWolf', 'Hryts', 'PixelBear', 'Orest',
  'Viktor_91', 'SilentOwl', 'Karpaty', 'Mavka', 'Dyma', 'RedLynx', 'Oleksa', 'Cobalt',
  'Sniper_UA', 'Yarik', 'Lviv_Lion', 'FrostByte', 'Taras', 'Kvitka', 'Rudy', 'Zubr',
  'Stalker_X', 'Bohdan', 'AquaFish', 'Sparrow', 'Maksym', 'Halia', 'Tundra', 'Kalyna',
]

const AVATAR_COLORS = [
  '#E5484D', '#F76B15', '#F5A524', '#30A46C', '#12A594', '#0091FF', '#6E56CF', '#D6409F', '#8E8E94',
]

// ---------- вспомогательные функции ----------

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function isKnifeOrGlove(item: DropItem) {
  return item.type.startsWith('★ ')
}

function percentilePrice(sorted: DropItem[], p: number) {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))
  return sorted[idx].price
}

// первый индекс, где цена > price (sorted по возрастанию)
function firstIndexAbove(sorted: DropItem[], price: number) {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].price > price) hi = mid
    else lo = mid + 1
  }
  return lo
}

// первый индекс, где цена >= price
function firstIndexFrom(sorted: DropItem[], price: number) {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].price >= price) hi = mid
    else lo = mid + 1
  }
  return lo
}

function pickWeighted(list: DropItem[]): DropItem {
  let total = 0
  const weights = new Array<number>(list.length)
  for (let i = 0; i < list.length; i++) {
    const w = 1 / Math.pow(Math.max(list[i].price, 0.01), LIVE_DROPS.PRICE_WEIGHT_POWER)
    weights[i] = w
    total += w
  }
  let r = Math.random() * total
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]
    if (r <= 0) return list[i]
  }
  return list[list.length - 1]
}

function weightSum(list: DropItem[]) {
  let s = 0
  for (const it of list) s += 1 / Math.pow(Math.max(it.price, 0.01), LIVE_DROPS.PRICE_WEIGHT_POWER)
  return s
}

let dropCounter = 0
function makeDrop(item: DropItem, chance: number, isNew: boolean): LiveDrop {
  const player = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]
  return {
    id: `d${Date.now().toString(36)}-${dropCounter++}`,
    item,
    chance,
    player,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    isVs: Math.random() < LIVE_DROPS.VS_SHARE,
    isNew,
  }
}

type FeedContext = {
  all: DropItem[] // каталог (только предметы с картинкой), по возрастанию цены
  bestPrice: number
  recentIds: string[] // последние показанные предметы, самые новые первыми
}

// Единственная точка, откуда берутся выпадения ленты.
// Позже её можно заменить запросом к серверу.
export function nextFeedDrop(ctx: FeedContext, isNew: boolean): LiveDrop | null {
  const { all, bestPrice, recentIds } = ctx
  if (all.length < 2) return null

  const minPrice = percentilePrice(all, LIVE_DROPS.FEED_MIN_PERCENTILE)
  const maxPrice = Math.min(
    percentilePrice(all, LIVE_DROPS.FEED_MAX_PERCENTILE),
    LIVE_DROPS.FEED_MAX_BEST_SHARE * bestPrice,
  )

  const lo = firstIndexFrom(all, minPrice)
  const hi = firstIndexAbove(all, maxPrice)
  let pool = hi > lo ? all.slice(lo, hi) : []
  if (pool.length === 0) pool = all // пул пуст: берём всё без фильтра

  const normal = pool.filter((i) => !isKnifeOrGlove(i))
  const special = pool.filter(isKnifeOrGlove)

  let useSpecial = false
  if (special.length > 0 && normal.length > 0) {
    const wS = weightSum(special)
    const natural = wS / (wS + weightSum(normal))
    useSpecial = Math.random() < Math.min(LIVE_DROPS.KNIFE_GLOVE_MAX_SHARE, natural)
  } else if (normal.length === 0) {
    useSpecial = true
  }
  const source = useSpecial ? special : normal

  const blocked = new Set(recentIds.slice(0, LIVE_DROPS.RECENT_NO_REPEAT))
  let item = pickWeighted(source)
  for (let i = 0; i < 25 && blocked.has(item.id); i++) item = pickWeighted(source)

  // Шанс: случайный, у более дорогих смещён вниз
  const span = Math.max(1e-9, Math.log(maxPrice / Math.max(minPrice, 0.01)))
  const t = Math.min(1, Math.max(0, Math.log(Math.max(item.price, 0.01) / Math.max(minPrice, 0.01)) / span))
  const chance = LIVE_DROPS.CHANCE_MIN + (LIVE_DROPS.CHANCE_MAX - LIVE_DROPS.CHANCE_MIN) * Math.pow(Math.random(), 1 + t * 1.5)

  return makeDrop(item, chance, isNew)
}

function makeBest(item: DropItem): BestDrop {
  return {
    key: `b${Date.now().toString(36)}-${dropCounter++}`,
    item,
    chance: rand(LIVE_DROPS.BEST_CHANCE_MIN, LIVE_DROPS.BEST_CHANCE_MAX),
    player: NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)],
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  }
}

// ---------- хук ----------

export function useLiveDrops() {
  const [drops, setDrops] = useState<LiveDrop[]>([])
  const [best, setBest] = useState<BestDrop | null>(null)

  const allRef = useRef<DropItem[]>([])
  const bestRef = useRef<BestDrop | null>(null)
  const dropsRef = useRef<LiveDrop[]>([])
  const failedImages = useRef<Set<string>>(new Set())

  const commitDrops = useCallback((next: LiveDrop[]) => {
    dropsRef.current = next
    setDrops(next)
  }, [])

  const commitBest = useCallback((next: BestDrop) => {
    bestRef.current = next
    setBest(next)
  }, [])

  // новая строка сверху ленты
  const pushDrop = useCallback(
    (drop: LiveDrop) => {
      commitDrops([drop, ...dropsRef.current].slice(0, LIVE_DROPS.MAX_ROWS))
    },
    [commitDrops],
  )

  // загрузка каталога и стартовое заполнение
  useEffect(() => {
    let cancelled = false
    let dropTimer: number | undefined
    let bestTimer: number | undefined

    const recent = () => dropsRef.current.map((d) => d.item.id)

    const scheduleDrop = () => {
      const delay = rand(LIVE_DROPS.DROP_INTERVAL_MIN_MS, LIVE_DROPS.DROP_INTERVAL_MAX_MS)
      dropTimer = window.setTimeout(() => {
        if (cancelled) return
        if (!document.hidden && bestRef.current) {
          const drop = nextFeedDrop(
            { all: allRef.current, bestPrice: bestRef.current.item.price, recentIds: recent() },
            true,
          )
          if (drop) pushDrop(drop)
        }
        scheduleDrop()
      }, delay)
    }

    const checkBest = () => {
      if (cancelled || document.hidden || !bestRef.current) return
      if (!LIVE_DROPS.DEBUG_FAST_BEST && Math.random() >= LIVE_DROPS.BEST_UPGRADE_CHANCE) return
      const all = allRef.current
      const cur = bestRef.current
      const start = firstIndexAbove(all, cur.item.price)
      if (start >= all.length) return // дороже уже нет
      const end = Math.min(all.length, start + LIVE_DROPS.BEST_STEP_COUNT)
      const candidate = all[start + Math.floor(Math.random() * (end - start))]
      commitBest(makeBest(candidate))
      // этот же скин появляется сверху ленты как обычная строка
      pushDrop(makeDrop(candidate, rand(LIVE_DROPS.BEST_ROW_CHANCE_MIN, LIVE_DROPS.BEST_ROW_CHANCE_MAX), true))
    }

    loadCatalog()
      .then((catalog) => {
        if (cancelled) return
        let all = catalog.filter((i) => i.image)
        if (all.length === 0) all = catalog // если картинок нет вообще, берём всё
        if (all.length < 2) return // каталог слишком короткий: ничего не падает
        all = [...all].sort((a, b) => a.price - b.price)
        allRef.current = all

        // стартовый Best drop
        const lo = Math.floor(all.length * LIVE_DROPS.BEST_START_MIN_PERCENTILE)
        const hi = Math.max(lo + 1, Math.floor(all.length * LIVE_DROPS.BEST_START_MAX_PERCENTILE))
        const startItem = all[Math.min(all.length - 1, lo + Math.floor(Math.random() * (hi - lo)))]
        commitBest(makeBest(startItem))

        // стартовая лента: сразу заполнена
        const initial: LiveDrop[] = []
        for (let i = 0; i < LIVE_DROPS.INITIAL_DROPS; i++) {
          const d = nextFeedDrop(
            {
              all,
              bestPrice: startItem.price,
              recentIds: initial.map((x) => x.item.id),
            },
            false,
          )
          if (d) initial.unshift(d)
        }
        commitDrops(initial)

        scheduleDrop()
        bestTimer = window.setInterval(checkBest, LIVE_DROPS.DEBUG_FAST_BEST ? 10000 : LIVE_DROPS.BEST_REFRESH_MS)
      })
      .catch(() => {
        /* каталог не загрузился: панель просто пустая */
      })

    return () => {
      cancelled = true
      if (dropTimer !== undefined) window.clearTimeout(dropTimer)
      if (bestTimer !== undefined) window.clearInterval(bestTimer)
    }
  }, [commitDrops, commitBest, pushDrop])

  // картинка строки не загрузилась: строка удаляется из ленты
  const removeDrop = useCallback(
    (id: string) => {
      commitDrops(dropsRef.current.filter((d) => d.id !== id))
    },
    [commitDrops],
  )

  // картинка Best drop не загрузилась: берём следующий по цене предмет
  const bestImageFailed = useCallback(() => {
    const cur = bestRef.current
    const all = allRef.current
    if (!cur) return
    failedImages.current.add(cur.item.id)
    let idx = firstIndexAbove(all, cur.item.price)
    while (idx < all.length && failedImages.current.has(all[idx].id)) idx++
    if (idx < all.length) commitBest(makeBest(all[idx]))
  }, [commitBest])

  // Best drop выбран вручную из каталога: дальше он сам обновляется вверх по цене от него
  const pickBest = useCallback(
    (item: DropItem) => {
      commitBest(makeBest(item))
      pushDrop(makeDrop(item, rand(LIVE_DROPS.BEST_ROW_CHANCE_MIN, LIVE_DROPS.BEST_ROW_CHANCE_MAX), true))
    },
    [commitBest, pushDrop],
  )

  // весь каталог (с картинками), отсортированный по цене по возрастанию
  const getAllItems = useCallback(() => allRef.current, [])

  return { drops, best, removeDrop, bestImageFailed, pickBest, getAllItems }
}
