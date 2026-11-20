// Компенсация за проигранный апгрейд (виртуальная, только симуляция).
//
// Как считается (калибровка по оригинальному сайту):
//  * Компенсация — один скин из каталога за один проигранный апгрейд.
//  * Её цена = сумма входа (коины + все скины) x доля. Средняя доля зависит от суммы входа: чем больше ставка,
//    тем меньше процент. Это логарифмическая интерполяция по двум измеренным точкам (ANCHORS).
//  * Разброс вокруг средней доли равномерный (SPREAD). Измерено на оригинале: 14 проигрышей по 10 000 дали
//    компенсации 152,28 ... 718,49 (1,52% ... 7,18%), всего 6 286,39 = 4,49% от 140 000.
//  * При входе не больше COMPENSATION_MIN_INPUT компенсации нет.
//  * Реальный скин подбирается из каталога (public/skins.json) с ценой рядом с рассчитанной.
//    Недавно выпавшие скины исключаются, чтобы не повторялся один и тот же предмет.

import type { Skin } from './components/SkinCatalog'

// Кейс появляется только при сумме входа БОЛЬШЕ этого значения (и только в обычной прокрутке)
export const CASE_THRESHOLD = 100

// Компенсация начисляется только за проигрыш с суммой входа БОЛЬШЕ этого значения
export const COMPENSATION_MIN_INPUT = 100

export type DropKind = 'common' | 'good' | 'rare'

// Измеренные точки: [сумма входа, средняя доля компенсации]
//  100    -> 0.25   (из первого видео: вход ~100, дроп 30,65)
//  10 000 -> 0.0449 (14 проигрышей по 10 000: в среднем 4,49%)
const ANCHORS: [[number, number], [number, number]] = [
  [100, 0.25],
  [10000, 0.0449],
]
const MEAN_RATIO_MIN = 0.01
const MEAN_RATIO_MAX = 0.3

// Множитель к средней доле: равномерно от 0.35 до 1.65 (среднее = 1). На входе 10 000 это 1,57% ... 7,40%.
const SPREAD_MIN = 0.35
const SPREAD_MAX = 1.65

export function getMeanRatio(input: number): number {
  const [[x0, r0], [x1, r1]] = ANCHORS
  const k = (Math.log10(input) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0))
  const ratio = Math.exp(Math.log(r0) + k * (Math.log(r1) - Math.log(r0)))
  return Math.min(MEAN_RATIO_MAX, Math.max(MEAN_RATIO_MIN, ratio))
}

// Нужно ли начислять компенсацию за проигрыш с такой суммой входа
export function isCompensationEligible(input: number): boolean {
  return input > COMPENSATION_MIN_INPUT
}

export type CompensationDrop = {
  skin: Skin
  kind: DropKind
  ratio: number // доля от суммы входа
}

// --- каталог, отсортированный по цене (строится один раз на массив) ---

const sortedCache = new WeakMap<Skin[], Skin[]>()

function sortedByPrice(catalog: Skin[]): Skin[] {
  let sorted = sortedCache.get(catalog)
  if (!sorted) {
    sorted = [...catalog].sort((a, b) => a.price - b.price)
    sortedCache.set(catalog, sorted)
  }
  return sorted
}

// первый индекс с ценой >= value
function lowerBound(sorted: Skin[], value: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].price < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

// Случайный реальный скин с ценой около wanted (окно расширяется, пока не наберётся выбор).
// maxPrice — потолок цены (необязательно), exclude — id, которых лучше избегать.
export function pickSkinNear(
  catalog: Skin[],
  wanted: number,
  options: { maxPrice?: number; exclude?: ReadonlySet<string> } = {},
): Skin | null {
  if (catalog.length === 0) return null

  const sorted = sortedByPrice(catalog)
  const floor = sorted[0].price
  const target = Math.max(floor, wanted)
  const { maxPrice = Infinity, exclude } = options

  let spread = 0.05
  for (let attempt = 0; attempt < 14; attempt++) {
    const from = lowerBound(sorted, target * (1 - spread))
    const to = lowerBound(sorted, target * (1 + spread) + 0.0001)
    const pool: Skin[] = []

    for (let i = from; i < to; i++) {
      const skin = sorted[i]
      if (skin.price <= maxPrice && !exclude?.has(skin.id)) pool.push(skin)
    }

    if (pool.length >= 3 || (attempt >= 10 && pool.length > 0)) {
      return pool[Math.floor(Math.random() * pool.length)]
    }
    spread *= 1.6
  }

  // запасной вариант: ближайший по цене
  const index = Math.min(sorted.length - 1, lowerBound(sorted, target))
  return sorted[index]
}

function randomInRange(min: number, max: number) {
  // логарифмическое распределение (цены растут «в разы»)
  return Math.exp(Math.log(min) + (Math.log(max) - Math.log(min)) * Math.random())
}

// Выбор компенсации за проигранный апгрейд.
// input — сумма входа, targetPrice — цена цели (компенсация не бывает дороже цели).
// Возвращает null, если компенсация не положена (малая ставка) или каталог пуст.
export function pickCompensation(
  catalog: Skin[],
  input: number,
  targetPrice: number,
  recentIds: readonly string[] = [],
): CompensationDrop | null {
  if (catalog.length === 0 || !isCompensationEligible(input)) return null

  const mean = getMeanRatio(input)
  const roll = SPREAD_MIN + Math.random() * (SPREAD_MAX - SPREAD_MIN)
  const cap = targetPrice > 0 ? targetPrice * 0.95 : Infinity
  const wanted = Math.min(input * mean * roll, cap)

  const skin = pickSkinNear(catalog, wanted, { maxPrice: cap, exclude: new Set(recentIds) })
  if (!skin) return null

  const position = (roll - SPREAD_MIN) / (SPREAD_MAX - SPREAD_MIN)
  const kind: DropKind = position > 0.94 ? 'rare' : position > 0.74 ? 'good' : 'common'
  return { skin, kind, ratio: skin.price / input }
}

// Скины для ленты рулетки: цены вокруг суммы входа, иногда очень дорогие «для интереса»
export function pickBeltSkins(catalog: Skin[], input: number, count: number, avoid: ReadonlySet<string>): Skin[] {
  const result: Skin[] = []
  const used = new Set(avoid)

  for (let i = 0; i < count; i++) {
    const dream = Math.random() < 0.07
    const wanted = dream ? input * randomInRange(8, 60) : input * randomInRange(0.05, 5)
    const skin = pickSkinNear(catalog, wanted, { exclude: used })
    if (!skin) continue
    used.add(skin.id)
    result.push(skin)
  }

  return result
}
