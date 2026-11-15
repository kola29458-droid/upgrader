// Компенсация за проигрыш (симулятор): после проигранной крутки со ставкой больше MIN_LOSS
// падает кейс, и игроку выпадает случайный скин. Все значения только виртуальные.
//
// Размер компенсации подобран по видео оригинала (ставка -> скин):
//   ставка 10 000   -> Gunsmoke 233.89  (2.3 %)   [скины в рулетке на 10 000: от 152 до 718, то есть 1.5-7.2 %]
//   ставка 2 955.25 -> Hobbit 325.12   (11 %)    [остальные скины в рулетке: от 58 до 207, то есть 2-7 %]
// Поэтому доля считается случайно в диапазоне RATE_MIN..RATE_MAX, чаще ближе к нижней границе.
import type { Skin } from './components/SkinCatalog'

export const COMPENSATION_MIN_LOSS = 30   // компенсация только если ставка БОЛЬШЕ этой суммы (коины)
export const COMPENSATION_MIN_PRICE = 100 // скин-компенсация всегда дороже 100 коинов; если по ставке выходит меньше, компенсации нет
export const COMPENSATION_RATE_MIN = 0.015 // минимум: 1.5 % от ставки
export const COMPENSATION_RATE_MAX = 0.11  // максимум: 11 % от ставки
export const COMPENSATION_REEL_LENGTH = 41 // карточек в рулетке (победная стоит ближе к концу)
export const COMPENSATION_WINNER_INDEX = 34

export type Compensation = {
  stake: number    // сколько проиграно
  winner: Skin     // выпавший скин
  reel: Skin[]     // рулетка: COMPENSATION_REEL_LENGTH скинов, на WINNER_INDEX стоит winner
}

let sortedCache: { source: Skin[]; sorted: Skin[] } | null = null

function byPrice(skins: Skin[]): Skin[] {
  if (sortedCache?.source === skins) return sortedCache.sorted
  const sorted = [...skins].sort((a, b) => a.price - b.price)
  sortedCache = { source: skins, sorted }
  return sorted
}

// Индекс первого скина с ценой >= price
function lowerBound(sorted: Skin[], price: number): number {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].price < price) lo = mid + 1
    else hi = mid
  }
  return lo
}

// Случайный скин, цена которого близка к target (окно из соседей по цене)
function randomNear(sorted: Skin[], target: number, spread = 12, minPrice = 0): Skin {
  const at = lowerBound(sorted, target)
  const from = Math.max(0, at - spread, lowerBound(sorted, minPrice))
  const to = Math.min(sorted.length - 1, at + spread)
  return sorted[from + Math.floor(Math.random() * (to - from + 1))]
}

export function makeCompensation(catalog: Skin[], stake: number): Compensation | null {
  if (!(stake > COMPENSATION_MIN_LOSS) || catalog.length === 0) return null
  const sorted = byPrice(catalog)

  const rate = COMPENSATION_RATE_MIN + (COMPENSATION_RATE_MAX - COMPENSATION_RATE_MIN) * Math.random() ** 2
  // Компенсация дороже 100 коинов. Если по доле вышло меньше, поднимаем до 100, но только когда это укладывается
  // в максимальную долю (ставка >= ~910). При меньшей ставке компенсации нет.
  if (stake * COMPENSATION_RATE_MAX <= COMPENSATION_MIN_PRICE) return null
  const budget = Math.max(stake * rate, COMPENSATION_MIN_PRICE + 0.01)
  const winner = randomNear(sorted, budget, 12, COMPENSATION_MIN_PRICE + 0.01)

  // Остальные карточки рулетки: случайные скины в диапазоне 0.5-12 % от ставки
  const reel: Skin[] = []
  for (let i = 0; i < COMPENSATION_REEL_LENGTH; i++) {
    if (i === COMPENSATION_WINNER_INDEX) {
      reel.push(winner)
      continue
    }
    const filler = stake * (0.005 + Math.random() * 0.115)
    reel.push(randomNear(sorted, filler, 40))
  }
  return { stake, winner, reel }
}
