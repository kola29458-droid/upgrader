// Общая математика апгрейдера: шанс, потолок шанса и максимальная ставка.

// Коэффициент шанса: скин 3.32 -> цель 6.64 даёт 50% * 1.03 = 51.50%
export const CHANCE_MULTIPLIER = 1.03

// Выше этого шанса крутить нельзя (кнопка Improve блокируется, ставку выше не поднять)
export const MAX_CHANCE = 79.99

// Шанс (в процентах) для суммы входа и цены цели.
// Показывается честно до 100%: если на входе больше, чем стоит цель, колесо заполняется целиком.
export function calcChance(inputTotal: number, targetPrice: number): number {
  if (targetPrice <= 0 || inputTotal <= 0) return 0
  return Math.min(100, (inputTotal / targetPrice) * 100 * CHANCE_MULTIPLIER)
}

// Шанс слишком мал, цель нельзя выбрать (меньше MIN_CHANCE)
export function isChanceTooLow(inputTotal: number, targetPrice: number): boolean {
  if (inputTotal <= 0 || targetPrice <= 0) return false
  return (inputTotal / targetPrice) * 100 * CHANCE_MULTIPLIER < MIN_CHANCE
}

// Максимум коинов с баланса, который можно добавить к выбранным скинам,
// чтобы шанс не превысил MAX_CHANCE. Без выбранной цели ограничен только балансом.
export function getMaxBet(
  balance: number,
  skinsTotal: number,
  targetPrice?: number,
): number {
  if (!targetPrice || targetPrice <= 0) return Math.max(0, balance)

  const maxInput = (targetPrice * MAX_CHANCE) / 100 / CHANCE_MULTIPLIER
  const room = Math.round((maxInput - skinsTotal) * 100) / 100

  return Math.max(0, Math.min(balance, room))
}

// Минимальный шанс: цели, у которых шанс ниже, заблокированы
export const MIN_CHANCE = 0.01

// Можно ли выбрать скин с ценой targetPrice, если на входе inputTotal коинов.
// Без выбранных скинов и ставки (inputTotal = 0) заблокированного нет.
// slack — небольшой запас сверху (для проверки уже выбранной цели из-за округления ставки до копеек).
export function isTargetAllowed(
  inputTotal: number,
  targetPrice: number,
  slack = 0,
): boolean {
  if (inputTotal <= 0) return true
  if (targetPrice <= 0) return false

  const raw = (inputTotal / targetPrice) * 100 * CHANCE_MULTIPLIER
  return raw >= MIN_CHANCE && raw <= MAX_CHANCE + slack
}
